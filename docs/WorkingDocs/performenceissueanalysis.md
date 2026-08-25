Conclusion
The most likely primary cause is not five facilities, progress bars, Zustand, SQLite, or local persistence by themselves.
The code creates an ever-growing finance history—especially one wage transaction per staffed facility per second—and then repeatedly:
- Deep-clones the entire history every game tick.
- Scans the entire history several times per facility.
- Renders the dashboard from a whole-store subscription.
- Copies and serializes the entire history to SQLite every five seconds.
This produces steadily increasing CPU work, memory allocation, garbage collection, and save size. Mobile hardware reaches the failure point much sooner than a laptop. Once the JavaScript thread is saturated, delayed or dropped button and slider interaction is exactly what I would expect.
I have not reproduced this on the affected Android device, so this is not profiler-confirmed yet. However, the static evidence is strong enough that I would treat the finance ledger as the first root-cause candidate.
The problematic runtime flow
1-second timer
  → advanceRealtime
  → advanceGameTime
      → clone facilities
      → deep-clone Finance and every historical transaction
      → add one wage transaction per staffed facility
      → scan every resource for autobuy
      → advance production
      → scan finance history per facility to calculate assets
      → scan every resource for autosell
      → advance sales, research, loans, prestige
      → scan finance history again for asset prestige
  → update Zustand
  → rerender the whole GameShell and active screen

Every 5 seconds
  → run advanceRealtime again
  → clone every domain into a snapshot
  → JSON.stringify the growing snapshot
  → replace the SQLite JSON record
Relevant entry points are [app/_layout.tsx (line 39)](/C:/GitHub/industriClicker-initial-app-shell/app/_layout.tsx:39), [gameStore.ts (line 745)](/C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:745), and [gameSaveDatabase.ts (line 38)](/C:/GitHub/industriClicker-initial-app-shell/game/core/persistence/gameSaveDatabase.ts:38).
Ranked causes
1. Critical: one wage transaction per facility per second
At [gameStore.ts (line 789)](/C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:789), every one-second simulation step records a separate transaction for every staffed facility.
For five staffed facilities over 90 minutes:
5 facilities × 60 seconds × 90 minutes = 27,000 wage transactions
That excludes production, autobuy, autosell, research, repair, and other transactions.
There is no finance-history cap or aggregation. Transactions are continuously appended at [finance.ts (line 123)](/C:/GitHub/industriClicker-initial-app-shell/game/finance/finance.ts:123).
I generated 27,000 wage records matching the current shape:
- Finance JSON alone was approximately 9.81 MiB.
- One JSON.stringify took approximately 66 ms on this laptop.
- A mobile device can take substantially longer.
- The complete save also includes markets, resource-flow buckets, facilities, orders, research, and other state.
The in-memory representation is larger than the JSON representation. Repeated deep copies can temporarily retain several copies, producing significant garbage-collection pauses and potentially thermal throttling.
2. Critical: Finance deep-clones the complete history every tick
Finance.clone() round-trips through a full snapshot at [finance.ts (line 204)](/C:/GitHub/industriClicker-initial-app-shell/game/finance/finance.ts:204). toSnapshot() calls getTransactions(), which deep-copies every transaction.
Even if no wage or market activity occurs, the game clones Finance at [gameStore.ts (line 1017)](/C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:1017) to process loans and the economy.
This turns an operation that should be roughly constant-time into work proportional to total foreground play time:
tick cost ∝ complete historical transaction count
That directly explains why the game starts smoothly and becomes progressively worse.
3. Critical on the Facility screen: repeated full-history scans
For every rendered facility, the Facility screen calculates:
- Asset accounting, which scans all transactions.
- Facility performance, which scans all transactions again.
This happens at [FacilityView.tsx (line 172)](/C:/GitHub/industriClicker-initial-app-shell/ui/dashboard/views/FacilityView.tsx:172), even when the finance detail tab is not visible.
With 27,000 transactions and five facilities, one Facility render performs approximately 270,000 transaction visits from these two calculations alone.
The simulation also calculates company assets and prestige using per-facility transaction scans at [gameStore.ts (line 928)](/C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:928) and again at [gameStore.ts (line 1068)](/C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:1068). While viewing Facilities, a rough lower bound is therefore over half a million transaction visits per second, before deep cloning, serialization, production, markets, or React rendering.
4. High: the entire dashboard subscribes to the entire Zustand store
[useDashboardGameState.ts (line 5)](/C:/GitHub/industriClicker-initial-app-shell/ui/dashboard/hooks/useDashboardGameState.ts:5) calls useGameStore() without a selector.
Consequently, any store mutation can rerender GameShell and the active screen. That includes:
- The clock observation update.
- The game-time update.
- Market changes.
- Facility progress.
- Customer pipeline progress.
- Persistence-triggered realtime processing.
The Facility screen is especially expensive because all facilities are rendered through a normal ScrollView at [app/index.tsx (line 208)](/C:/GitHub/industriClicker-initial-app-shell/app/index.tsx:208), rather than isolated memoized cards or a virtualized list. It also calculates upgrade projections, finance results, recipe information, and other hidden-tab data during every render.
Five facilities are not inherently excessive, but five large cards rebuilt every second on top of the finance-history work can be excessive on a phone.
5. High: full growing snapshot saved every five seconds
The persistence layer:
- Creates a full snapshot, which clones the finance history and resource-flow buckets.
- Serializes it synchronously with JSON.stringify.
- Replaces one large SQLite text value.
- Does this every five seconds.
Periodic saving also calls advanceRealtime first at [app/_layout.tsx (line 43)](/C:/GitHub/industriClicker-initial-app-shell/app/_layout.tsx:43). That can run an additional small simulation step and create another wage transaction.
There is no single-save-in-flight guard. The timer invokes void saveNow(), and save failures are silently discarded. Once a save becomes slow enough, writes could begin queueing without useful diagnostics.
SQLite is not the fundamental problem here. The problem is repeatedly serializing and replacing a growing multi-megabyte event log.
6. Medium: one-hour resource-flow history is repeatedly cloned
Resource flow keeps up to 3,600 second-level buckets at [resourceFlow.ts (line 3)](/C:/GitHub/industriClicker-initial-app-shell/game/inventory/resourceFlow.ts:3). Unlike Finance, this history is bounded, which is good.
However, recording the first flow event in a tick clones all retained buckets, and saving copies them all again. This creates a substantial, stable allocation burden after approximately one hour—the same general period in which the reported problem becomes visible.
It is probably an amplifier rather than the primary cause.
7. Medium: stable per-tick engine overhead
Every tick currently performs work such as:
- Two full passes across all 32 resource types for autobuy and autosell.
- Production-input automation per facility.
- Market and asset calculations.
- Multiple arrays and resource maps for sales acquisition.
- A sales-ledger clone even when no order changes at [gameStore.ts (line 983)](/C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:983).
This work does not grow as quickly as Finance, so it does not explain the progressive degradation alone. It will matter after the history problem is fixed.
8. Secondary: progress bars
The progress bars do create work. React Native Paper starts a 200 ms animation whenever the determinate progress prop changes. Because the whole screen rerenders every second, several bars can continuously restart animations.
But progress-bar count does not increase with foreground play time. That makes it a poor explanation for a game that becomes dramatically worse after 90 minutes.
I would optimize them only after fixing the ledger, persistence, and render subscription. They may still contribute to the final load, particularly when many process and research bars are visible.
Recommended fixes
Immediate root-cause fix
Replace per-second financial events with aggregated accounting.
A suitable Finance shape would contain:
- Current balance.
- All-time totals by source/kind.
- All-time facility accounting totals.
- Rolling time buckets for reports, preferably one-minute buckets.
- A bounded recent transaction-detail list for player-facing cash-flow details.
- Loan and collection state.
For example, five facilities over 90 minutes would create at most 450 facility-minute wage buckets rather than 27,000 second-level wage transactions—a reduction of approximately 60× before considering indexes.
Production-performance and automated market transactions should also aggregate by time bucket, facility, source, and resource where exact individual events are not player-relevant.
Remove history-sized cloning and querying
Finance should not clone the entire ledger to append one transaction.
Recommended approaches:
- Treat stored transaction objects as immutable and structurally share completed history.
- Maintain aggregate indexes when transactions are recorded.
- Make getFacilityAccounting an O(1) indexed lookup.
- Make period performance scan only bounded time buckets.
- Expose readonly data or iterators for reports instead of deep-cloning every transaction.
- Calculate expensive summaries only when their actual inputs change.
This is more important than changing databases.
Isolate UI subscriptions and rendering
Replace the whole-store subscription with narrow selectors:
- Header: balance, elapsed time, prestige, economy phase.
- Facility screen: facility view models and only the inventory/market values it needs.
- Finance screen: finance revision and selected report data.
- Inventory screen: inventory/market revisions.
Then:
- Extract each facility into a memoized component.
- Calculate finance data only when its Finance tab is visible.
- Calculate upgrade projections only when the Upgrades tab is visible.
- Avoid calculating expanded content for collapsed cards.
- Consider a FlatList for facilities if the count is expected to grow substantially.
The Finance memo is also ineffective: [useFinanceStatementData.ts (line 10)](/C:/GitHub/industriClicker-initial-app-shell/ui/dashboard/views/finance/useFinanceStatementData.ts:10) depends on a newly created input object, so it recomputes after every parent render.
Make persistence compact and single-flight
I recommend keeping persistence local, but changing its behavior:
- Save a compact snapshot without unbounded raw histories.
- Permit only one SQLite save at a time.
- If state changes during a save, schedule one trailing save rather than overlapping writes.
- Track a state revision and skip unchanged saves.
- Do not run an additional simulation step for ordinary periodic saves.
- Continue processing the final foreground interval on background/checkpoint.
- Measure and log snapshot size, snapshot creation time, serialization time, and SQLite time during diagnosis.
- Do not silently swallow all save errors during development.
A 10–30 second foreground checkpoint could be reasonable after state is compact, but increasing the interval alone only postpones the current problem.
Optimize timed systems afterward
Once the growing-history problem is removed:
- Run autotrade only when its next interval is due.
- Track enabled automation resources rather than checking every resource twice per second.
- Aggregate wages and passive condition changes mathematically across elapsed time.
- Avoid cloning SalesOrders unless an order can actually be created, expired, fulfilled, or rejected.
- Reduce resource-flow precision from one-second buckets where player-visible reports do not require it.
- Separate simulation frequency from UI presentation frequency.
What I would not do
I would not move the game to Supabase or another backend to address this issue.
The game still needs its current state in memory, and it would still need to serialize or transmit it. A remote backend would add network latency, failure modes, and synchronization complexity while leaving the history scans and rerenders intact.
Local-first persistence remains appropriate. The persisted representation and save boundary need optimization—not necessarily the persistence location.
Confirmation procedure
Before a broad refactor, add temporary device instrumentation for:
- Finance transaction count.
- Serialized snapshot byte count.
- advanceGameTime duration.
- Finance.clone duration.
- Asset-calculation duration.
- Snapshot creation, serialization, and SQLite duration.
- Root and Facility-screen render counts.
- Pending/in-flight save count.
Then compare:
1. A fresh five-facility game.
2. The affected 90-minute save.
3. The same save with wage entries aggregated or temporarily omitted.
4. The same save with persistence temporarily disabled.
5. The same save with facility progress bars hidden.
My prediction is:
- Aggregating/removing the raw wage history will produce the largest improvement.
- Disabling persistence will remove periodic spikes but not all continuous lag.
- Hiding progress bars alone will provide a much smaller improvement.
No files were changed, and no Android runtime profiling was performed during this analysis.