# Achievement System Research And Direction

Use a local-first hybrid: Winemaker04 supplies the tier catalogue, idempotent unlock, prestige-event, and presentation patterns; Baseclicker supplies durable lifetime totals; HackAndSlash02 supplies event-scoped statistic updates rather than repeated broad polling. Implement it within Industri Clicker's existing Expo, Zustand, and single SQLite snapshot architecture. Do not import Supabase, backend code, or predecessor persistence shapes.

## Research result

| Source | Verdict | What to reuse |
|---|---|---|
| Winemaker04 `main` | Most complete achievement feature. | Typed tier definitions, pure evaluation context, durable unlock metadata, idempotent prestige reward sources, completed-plus-next-tier display, focused evaluation/presentation tests. |
| Baseclicker | Smaller and more recently touched local clicker system. | Persisted lifetime totals and a tier-series UI with current progress. Do **not** copy its source-agnostic inventory totals. |
| HackAndSlash02 | Best generic achievement-stat model. | A narrow event -> statistic -> affected-achievement path, durable completion time/progress, category summaries, prerequisite-ready definitions. |
| Skiclicker | Earlier local prestige bridge. | Achievement levels that reward decaying prestige, and a time-cadenced check as a possible future optimisation. Do **not** copy its in-memory-only unlock set. |
| OfficeTycoon | Achievement route is not implemented. | Typed achievement prestige payload and source-ID event discipline only. |
| Tradergame / Simulus / Protoproduction | No implemented local achievement engine. | Protoproduction's design rule: historical achievements must use completion history or durable aggregates, never mutable live inventory. |

## Goal and scope

Add a durable, tiered company-achievement system that:

- tracks facility, production, sales, finance, foreground-time, and company-prestige milestones;
- preserves unlocks and required lifetime production facts in the existing `GameSnapshot`;
- shows current progress for the next tier in each series;
- creates exactly one achievement prestige event per unlock;
- remains informational apart from prestige: no production, pricing, staffing, contract, or finance bonuses in v1.

Out of scope: offline progress, cloud sync, achievements as unlock gates, achievement rewards other than prestige, notifications, hidden achievements, prerequisites, and a generic analytics/event framework. These can be added later without changing the core unlock format.

## Recommended v1 architecture

```text
Facility / production / sale / finance / time command
  -> local achievement metric update where history is needed
  -> pure achievement evaluation for the affected categories
  -> AchievementLedger records new unlocks once
  -> PrestigeLedger records achievement:<id> once
  -> Zustand state and GameSnapshot save normally
  -> Achievements dashboard derives progress from definitions + current state
```

### Source of truth

- `AchievementLedger` owns only durable unlock facts: achievement ID and the logical foreground game time when it unlocked. It must not store a mutable prestige total or UI-ready progress percentage.
- `ProductionStatistics` owns only lifetime production output by resource. It increments from completed production output, after the facility output multiplier, never from inventory admin changes, market grants, or manual inventory edits.
- The evaluator derives current balance, facility state, completed-contract statistics, foreground operating time, and current prestige from existing domain state.
- `GameTimeSnapshot` gains `companyStartedAtGameTimeMs`; it is set for a new company and deliberately does not change during restore. This is the source for foreground operating-time milestones.
- `AchievementDefinition` constants own titles, descriptions, icons, categories, tiers, thresholds, and prestige reward configuration. No balance values belong in UI components.

This is deliberately narrower than HackAndSlash02's generic stat registry. Industri currently needs one historical family (production); sales already keep durable completed-contract history, and current facility/balance/prestige facts are available at the command boundary.

### Evaluation rules

- Use a pure `AchievementEvaluationContext` and pure evaluator. It receives snapshots/read-only domain values and returns eligible unlock candidates plus display progress; it does not mutate Zustand, SQLite, UI, or prestige.
- Evaluate only affected categories after a successful mutation: facilities after construction or upgrade; production after one or more completed cycles; sales and prestige after fulfilment; finance after a balance-changing command; time after a foreground time advance.
- Production is checked only when output was actually completed. Time achievements may be checked once per completed foreground minute, not every one-second observation.
- Evaluate against the post-command state, including the normal sale/balance prestige event, but before prestige rewards for newly unlocked achievements are considered. An achievement reward therefore cannot recursively unlock another prestige achievement in the same evaluation pass.
- A restored current-version save receives one safe evaluation after restore. This can award currently true state achievements, but cannot reconstruct lifetime production absent from the new statistics snapshot.

### Prestige connection

`PrestigeEventType` and the prestige dialog already reserve `achievement`; complete that prepared path.

- Each definition includes a named base prestige amount and active-foreground-hour half-life appropriate to its tier.
- `PrestigeLedger.recordAchievement(...)` uses `achievement:<achievementId>` as its source ID and `recordIfAbsent`, so repeated evaluation, restore evaluation, and future asynchronous UI work cannot duplicate its reward.
- Add achievement contribution to `CompanyPrestigeSummary` and the prestige dialog's total-card/filter breakdown.
- Achievement events follow the existing foreground logical-time decay model. They do not decay in the background and fast-forward advances them through the normal game clock.

## Initial catalogue direction

The first catalogue should be deliberately small and built only from facts currently supported by the game. Each multi-tier series uses the standard `seriesId_tier_N` identifier format.

| Category | Initial series | Data source | Notes |
|---|---|---|---|
| Facilities | First facility; facility portfolio; upgrades purchased | Current `FacilityCollection` and facility upgrade levels | Portfolio thresholds must not exceed the current six-facility catalogue. Evaluate immediately so later demolition does not erase an earned unlock. |
| Production | First output; lifetime output by resource; total lifetime output | `ProductionStatistics` | Counts only completed recipe output, after output upgrades. Inventory quantity is never used as a proxy. |
| Sales | Fulfilled contracts; total fulfilled contract quantity; largest fulfilled contract | `SalesContracts.completed` filtered to `fulfilled` | Use retained contract history; rejected contracts do not progress achievements. |
| Finance | Current balance milestones | `Finance.getBalance()` | A milestone remains unlocked even if later spending reduces balance. |
| Time | Foreground operating-time milestones | `lastProcessedAtMs - companyStartedAtGameTimeMs` | Background time remains excluded. Add the durable company-start logical time rather than treating a wall-clock date as game time. |
| Prestige | Current company-prestige milestones | `calculateCompanyPrestigeSummary(...)` before new achievement reward events | These are achievement consumers of prestige; they must not chain from their own award in one pass. |

Thresholds and achievement copy must be kept together in `achievementConstants.ts` and tuned against the current six-facility, one-to-ten-unit contract, and foreground-only production loop before code is considered complete. Do not use Winemaker's economic values, which assume a different economy.

## File map

| File | Change |
|---|---|
| `game/achievements/achievementConstants.ts` | **New.** Code-owned categories, tier definitions, thresholds, icon/copy, and prestige reward values. |
| `game/achievements/achievement.ts` | **New.** `AchievementLedger`, unlock snapshot validation, immutable unlock data, clone/restore helpers. |
| `game/achievements/productionStatistics.ts` | **New.** Resource-keyed lifetime completed-output totals and snapshot validation. |
| `game/achievements/achievementEvaluator.ts` | **New.** Pure context builder helpers, category-scoped evaluation, and display-progress derivation. |
| `game/achievements/index.ts` | **New.** Public achievement barrel surface for `game/index.ts`. |
| `game/facilities/facility.ts` | Return typed completed-output facts from one facility's production advance without changing production rules. |
| `game/facilities/advanceProduction.ts` | Aggregate facility output facts in deterministic facility order. |
| `game/core/stores/gameStore.ts` | Own achievement ledger, production statistics, command-boundary evaluation, atomic prestige reward writes, restore/reset/snapshot integration. |
| `game/core/state/gameSnapshot.ts` | Add achievement and production-statistics snapshot fields plus `companyStartedAtGameTimeMs` to the time snapshot. |
| `game/core/persistence/gameSaveRepository.ts` | Validate the new snapshot fields. Older snapshots are intentionally invalid and start fresh. |
| `game/prestige/prestige.ts` | Add idempotent achievement-event recording. |
| `game/prestige/prestigeCalculator.ts` | Derive achievement prestige contribution in the summary. |
| `ui/dashboard/views/AchievementsDashboard.tsx` | **New.** Portrait-first achievement list with category grouping, completion state, and next-tier progress. |
| `ui/dashboard/DashboardView.tsx` | Provide the achievement dashboard surface if it shares dashboard view plumbing. |
| `ui/index.ts` | Export the new UI view. |
| `app/index.tsx` | Wire the existing Achievements profile-menu item to the new view and select achievement state from the store. |
| `ui/dashboard/components/PrestigeDialog.tsx` | Add achievement summary and filter support. |
| `docs/WorkingDocs/CONTEXT.md` | Define canonical achievement, achievement unlock, and lifetime production-stat terms. |
| `docs/WorkingDocs/design.md` | Record the player-facing achievement direction and prestige-only reward decision. |
| `docs/WorkingDocs/gameflow.md` | Record evaluation order, production-stat ownership, prestige ordering, and restore behavior. |
| `docs/WorkingDocs/VariableRelationshipMap.md` | Add state ownership, command effects, and snapshot mapping. |

## Implementation sequence

1. **Create the pure achievement domain.**
   - Add the definition constants, durable unlock ledger, production statistics, and evaluator as separate `game/achievements` modules.
   - Keep catalogue data in `achievementConstants.ts`; make all IDs, categories, and snapshots explicitly typed.
   - Define initial tier thresholds only for achievable current content, including the six-facility ceiling.
   - Verify pure evaluator cases: below threshold, exact threshold, multiple eligible tiers, already unlocked tier, and pre-award prestige context.

2. **Expose completed production as a domain fact.**
   - Change facility production to report each completed output without moving resource accounting out of `Facility`.
   - Aggregate those facts in `advanceProduction` in the current deterministic facility order.
   - Update `ProductionStatistics` only with that reported output; `addResource`, `setInventoryAmount`, and admin inventory controls must leave it unchanged.
   - Verify output counts for partial cycles, multiple cycles in one advance, output upgrades, missing-input stalls, and multiple active facilities.

3. **Integrate atomic store commands and evaluation.**
   - Add achievements and production statistics to `GameState`, add `companyStartedAtGameTimeMs` to its durable time state, and initialise all three for a new company.
   - After each successful relevant command, produce one post-command evaluation context, add only newly eligible unlocks, and then record their prestige events on cloned state before the single Zustand `set`.
   - Use category-scoped checks, with minute-level time cadence and completion-only production cadence. Do not add a timer, store subscription, or UI-owned game rule.
   - On restore, rebuild classes from the snapshot and run one idempotent evaluation; on reset, create fresh state.
   - Verify no duplicate unlock or prestige event appears after repeated commands, fast-forward, or restore.

4. **Complete persistence deliberately.**
   - Add `achievements`, `productionStatistics`, and `companyStartedAtGameTimeMs` to `GameSnapshot`, create/restore logic, and save validation.
   - Keep the single SQLite row and existing five-second batching unchanged.
   - Require both new fields in validation. Per project policy, an older snapshot is invalid and starts a new company; add no migration or compatibility branch.
   - Verify round-trip preservation of unlocked IDs/times and resource production totals, plus rejection of malformed snapshots.

5. **Finish the prestige consumer/input loop.**
   - Add a typed `recordAchievement` method to `PrestigeLedger`; it takes only already-resolved achievement metadata/reward values and owns source-key idempotency.
   - Extend the prestige summary and dialog for achievement contribution/history.
   - Verify achievement events use foreground logical time and do not duplicate after evaluation or restore; verify a prestige threshold cannot be awarded solely from the achievement reward created in that same pass.

6. **Add the mobile achievement surface.**
   - Make the existing Profile-menu Achievements action open an `AchievementsDashboard`; do not add a sixth bottom-navigation item.
   - Group by category, show unlocked tiers and the next incomplete tier for each series, and provide readable current/target progress. Completed entries show unlock state; locked future tiers stay hidden to avoid a dense list.
   - Use React Native Paper and existing dashboard styles/tokens. Ensure portrait scroll, touch targets, accessibility labels, and narrow-width layout work without hover-only interaction.
   - Verify the menu action, a first unlock, progress after a production completion, and portrait rendering on the preferred Android device path.

7. **Document and validate the approved system.**
   - Update the four working documents listed in the file map once exact tiers and prestige values are approved in code.
   - Run `npm run typecheck`, the smallest added pure achievement tests if a test runner is explicitly approved, and `git diff --check`.
   - Do not add a test dependency merely for this feature without separate approval; the current scaffold exposes only `npm run typecheck`.

## Acceptance criteria

- A successful facility, production, sales, balance, time, or prestige milestone unlocks the appropriate tier once and survives app restart.
- Production achievements count only completed facility output, including output upgrades, and never inventory/admin changes or consumed stock.
- Sales achievements count only retained fulfilled contracts; rejected contracts have no achievement effect.
- Repeated evaluation, restore, and fast-forward cannot duplicate an unlock or its `achievement:<id>` prestige event.
- Current prestige can unlock prestige achievements, but a new achievement's reward cannot cause same-pass recursive prestige unlocks.
- The dashboard exposes useful current progress without rendering all future tiers, and the existing profile-menu action opens it.
- No cloud service, migration, compatibility layer, new production bonus, or gameplay consumer of achievements is introduced.

## Verification note

The current project has `npm run typecheck` but no test runner. The pure-domain modules should be designed for direct focused testing from the outset; adding Vitest or another runner requires separate approval because it adds a dependency and project tooling.
