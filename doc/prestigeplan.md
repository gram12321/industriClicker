# Prestige System Research And Direction

Use a hybrid: take Winemaker04’s event-ledger design, but implement it locally in the current Zustand/SQLite snapshot architecture—without vineyards, Supabase, or current prestige effects on gameplay.

## Research result

| Source | Verdict | What to reuse |
|---|---|---|
| Winemaker04 `main` | Most mature implementation. Its prestige feature was finalized in the July 21–22 isolation work. | Typed events, source-keyed permanent rows, event metadata, decay model, idempotent achievement events, focused tests. |
| `winemaker04-buy-market-storage-vessels` and `winemaker04-staff-task-grape-specializations` | Same prestige implementation as Winemaker04 main. | No extra prestige evolution. |
| `winemaker04-isolate-user-domain-research` | Older ancestor, before the final feature isolation. | Do not use as the reference. |
| Skiclicker | Smaller local-first adaptation of the earlier Winemaker model. | Local Zustand event storage and derived reputation pattern. |
| OfficeTycoon | Best architectural analogue for this project’s current maturity. | Its deliberately small, company-only event model and “prepare now, connect systems later” approach. |

Older `winemaker`/`winemaker03` contain earlier monolithic versions. The other hits are either archived copies, documentation, or unrelated tournament reputation.

## Current integration points

| Current system | Prestige v1 connection |
|---|---|
| Finance | A permanent company-balance prestige row updates whenever a transaction succeeds. |
| Sales contracts | Fulfilling a contract adds one source-keyed sales prestige event. Rejecting does nothing for now. |
| Facilities/upgrades | Affect prestige indirectly through the current cash balance only. Do not invent facility asset values yet. |
| Achievements | Define an idempotent future achievement-event command, but create no placeholder entries or UI until achievements exist. |
| Loans/assets | Reserve calculation inputs and finance-penalty event types; use `0` for assets and liabilities in v1. |
| Time | Foreground logical game time advances event decay. Background time does not. |
| Persistence | Add prestige to the single `GameSnapshot`, save subscription, restore, and reset path. |

The central integration point is `stores/gameStore.ts`: all successful money changes and contract fulfilment already pass through it. Persistence currently uses one snapshot in `game/core/state/gameSnapshot.ts`, with batching in `app/_layout.tsx`. Achievements are currently only a menu placeholder.

## Recommended v1 mechanic

Only company prestige exists.

- Source of truth: a persisted `PrestigeLedger`/event list, not one mutable total.
- Derived value: `companyPrestige = sum(current event amounts)`.
- Permanent company-balance event: upserted under `company-balance`, so it never duplicates.
- Sales event: one event per fulfilled contract, keyed as `contract:<id>`.
- Future achievement event: keyed as `achievement:<id>` to prevent duplicate unlock rewards.
- Future finance events: reserved for loan defaults, missed payments, and similar reputational penalties—not ordinary construction spending.

The balance placeholder should be explicit:

```text
companyCapital = cashBalance + futureAssetBookValue - futureLiabilities
balancePrestige = ln(1 + max(0, companyCapital) / 10,000)
```

For now, both future inputs are zero. This deliberately means it represents cash balance, not a real company valuation; we should not silently treat construction costs as assets before the finance system defines that accounting.

Do not reuse Winemaker’s sale-value divisor: current contracts pay only €1–€10, so it would produce invisible prestige. A sensible initial target is roughly `+0.20` for a €1 contract to `+0.46` for a €10 contract, with a per-contract cap around `+0.5`. Tune that after the first playable check.

Prestige remains informational in v1. It does not change customer chance, production, pricing, or finance rules until a later system deliberately consumes it.

## Decay direction

Decay is included in v1, but it should use logical foreground game time rather than device wall-clock time. A paused or backgrounded game does not lose prestige; Fast-forward advances decay because it advances the same logical game clock.

Store a named half-life in **active foreground hours** on each decaying event and derive its current contribution continuously:

```text
elapsedForegroundHours = (currentLogicalGameTimeMs - event.createdAtGameMs)
  / 3,600,000

currentAmount = baseAmount × 0.5 ^ (elapsedForegroundHours / halfLifeForegroundHours)
```

This preserves the Winemaker intent: an event can remain meaningful over an entire company lifecycle without tying game balance to real-world calendar time or requiring a later data migration.

Initial decay categories should be configuration, not duplicated formulas:

| Event family | Initial decay direction |
|---|---|
| Company balance | Permanent; recalculated and upserted. |
| Contract sales | Short-lived company memory; decays over a small number of active foreground hours. |
| Achievements | Very long-lived; choose an event-specific half-life so a whole-lifecycle event is near zero at the 100-hour lifecycle reference. |
| Future finance penalties | Long-lived negative brand scars, with explicit event-specific half-lives. |

The intended lifecycle remains 100 foreground hours. This is a balancing reference, not a half-life: an event intended to fade over the entire company lifecycle should be near zero by 100 foreground hours. Decay is stored directly in active foreground hours, so no additional time-regime conversion is needed.

Store immutable event base amounts and `createdAtGameMs`; derive decayed values from `lastProcessedAtMs`. This avoids rewriting every prestige row every second and keeps the calculation deterministic. Expired tiny events can be pruned only at deliberate save or game-time maintenance boundaries.

## UI recommendation

Your modal assumption is correct: the reference systems all expose prestige through a modal.

For Industri Clicker:

- Add a compact, tappable trophy/prestige indicator in the existing header—preferably replacing the inert notification placeholder rather than adding a sixth bottom tab.
- Open a React Native Paper `Portal` + `Dialog`, matching the existing construction dialogs.
- Keep the first modal deliberately small:
  - Company prestige total
  - Balance contribution
  - Sales contribution
  - Event history, newest first
  - Simple `All / Balance / Sales` filters
  - A clear “fading”/permanent label for each event
  - Achievement section only when achievements actually exist

Avoid porting Winemaker04’s large vineyard/filter modal. It solves real complexity there, but would make this screen feel unfinished and desktop-like on a phone.

## Implementation sequence

1. Add pure `game/prestige` types, ledger, summary selectors, formulas, and active-hour decay helpers.
2. Integrate atomic updates in the store for finance changes and contract fulfilment.
3. Derive decay from logical foreground time and prune expired events at a deliberate maintenance boundary.
4. Persist/restore/reset prestige with the game snapshot.
5. Add the required prestige field to the snapshot; older saves without that field are discarded rather than migrated, per project policy.
6. Add the header indicator and Paper dialog.
7. Document the approved mechanic in `CONTEXT.md`, `design.md`, `gameflow.md`, and the variable map.

The project currently has no test runner configured—only `npm run typecheck`—so I would keep formulas independently testable but not add a test dependency without approval.

## Confirmed decisions

- Prestige is informational until a future system deliberately consumes it.
- Prestige decays through foreground logical game time, never background wall-clock time.
- The event ledger supports very long, lifecycle-scale decay through event-specific active-hour half-lives.

## Confirmed lifecycle calibration

- The intended lifecycle is 100 foreground hours.
- For whole-lifecycle decaying events, 100 foreground hours is the near-zero target rather than the half-life.
- Decaying prestige events use active foreground-hour half-lives.
- Contract-sale prestige uses a five-active-hour half-life in the first implementation.
