# Industri Clicker Gameflow

This is the authority for system rules, formulas, tick order, state groups, and save lifecycle. See [VariableRelationshipMap.md](VariableRelationshipMap.md) for concrete variables and command reads/writes.

## System Flow

```text
Player input or system event -> typed command -> pure game rules
    -> Zustand runtime state -> derived UI feedback
    -> Expo SQLite snapshot at an approved save boundary

Foreground elapsed time -> advanceGameTime -> registered timed rules
```

## State Ownership

| Concern | Owner | Persisted |
|---|---|---|
| Balance values and catalogues | Typed TypeScript definitions | No |
| Current game state | Zustand | Through `GameSnapshot` |
| Local player/company/session metadata | Company domain and SQLite adapters | Yes, separately from `GameSnapshot` |
| Finance, inventory, facilities, sales contracts, achievements, production statistics, prestige, research, logical game time | Domain models in the store | Yes |
| Foreground wall-clock observation anchor and derived UI data | Store/runtime helpers | No |
| Durable snapshot | Company-keyed Expo SQLite adapter | Yes |
| Cloud state | None | No |

## Production and Facilities

Recipes consume inputs at cycle start; if inputs are absent, the facility stalls without banking work. A completed cycle grants `baseOutput × outputMultiplier`.

| Recipe | Inputs | Output | Work |
|---|---|---:|---:|
| Grow Grain | 1 Water, 1 Electricity | 1 Grain | 5 |
| Bake Bread | 2 Grain, 1 Water, 1 Electricity | 1 Bread | 10 |
| Produce Water / Electricity | None | 1 utility resource | 5 |
| Grow Sugar | 4 Water | 1 Sugar | 3 |
| Mine Coal | 3 Electricity | 1 Coal | 3 |
| Bake Cake | 1 Grain, 0.5 Sugar, 2 Electricity, 2 Water | 1 Cake | 15 |
| Manual / Electric Pumping | None / 1 Electricity | 1 / 5 Water | 1 / 0.5 |
| Coal / Solar Power | 1 Coal, 2 Water / None | 10 / 1 Electricity | 5 / 10 |

For `levels = speedLevel + outputLevel`:

- Upgrade cost: `ceil(constructionCost × 1.5^currentLevel)`.
- Speed multiplier: `1 + 0.8 × (1 - e^(-0.22 × speedLevel))`.
- Output multiplier: `1 + (1 - e^(-0.18 × outputLevel))`.
- Required workers: `baseWorkers + levels + ceil(baseWorkers × 1.15^levels - baseWorkers)`.
- Staffing efficiency at or below target: `0.01 + 0.99 × ratio^1.6`; above target: `1 + 0.25 × (1 - e^(-0.7 × (ratio - 1)))`.
- Effective work: `baseWork × staffingEfficiency × speedMultiplier`.

Levels and worker counts are non-negative integers. A zero-worker requirement has 100% efficiency; above-target staffing cannot reach a 25% bonus.

## Market

- Each resource has persisted local/global supply and quality. Local and global prices are `benchmarkSupply / max(supply, 1) × marketQuality`.
- Foreground minute completion creates price-locked sales offers, autosells enabled inventory to the local market, then source-capped diffusion balances every resource between local and global reservoirs. Offline time does none of these.
- Manual buys/sells trade only with the local market. A fulfilled sales contract adds the delivered inventory and its quality directly to the global reservoir; its reward was locked at offer time from global price × 1.20.
- Autobuy may purchase missing recipe inputs from the local market only when enabled and under its saved finite maximum unit price.

## Finance, Prestige, and Sales

- Construction requires funds and applies `newBalance = currentBalance - constructionCost`; balance cannot become negative.
- Prestige is informational. Its total is derived from a permanent balance event and decaying fulfilled-sales events using foreground logical time; background time does not decay it.
- Achievements are evaluated from post-command state. Facility/finance changes check their categories immediately; completed production updates lifetime total and per-resource output before production checks; fulfilled sales check sales, finance, and prestige after their normal prestige event; time checks run after completed foreground minutes.
- An achievement unlock is durable and creates one source-keyed `achievement:<id>` prestige event. The evaluator sees normal post-command prestige but not prestige rewards from other unlocks in that same pass, so prestige tiers cannot recursively chain.
- Each foreground minute may offer one contract. Offer chance falls from 100% as unfulfilled contracts grow, using sales control points `0→0`, `3→0.25`, `5→0.50`, `10→0.75`, and `1,000,000→almost 1`, then `1 - calculateAsymmetricalScaler01(...)`.
- A contract requests a random catalogue resource and quantity 1–10, pays `quantity × €1`, and can be fulfilled only with the full inventory amount. Rejection changes neither inventory nor finance.
- The customer pipeline is visual only and does not affect offer rolls. It fills green through one estimated wait interval, then refills in red for each additional estimated interval until an offer resets it.
- Research has two five-tier chains: Capital Grants pay one-time money rewards, while Sales Capacity raises the derived open-contract maximum from its base of one to 2, 3, 5, 7, or 10. Capacity blocks only newly created offers; existing offers remain actionable.
- A research project requires all of its gates at start, deducts its full configured cost immediately, and is the only active project for its company. Completion is durable and applies its grant/effect once. Cancelling refunds the recorded full paid cost and discards partial progress.

## Foreground Time

1. `TimeManager` measures active wall-clock time from `lastObservedAtMs`.
2. `advanceGameTime` splits it into one-second simulation steps.
3. Each step advances logical time and pipeline, then gives active facilities `elapsedSeconds / 60` base work in fixed order. Completed recipe output is also recorded in lifetime production statistics after output multipliers apply.
4. Active research advances by the same foreground elapsed milliseconds; background/resume time adds none. A completed project clears the active record and applies its one-time effect atomically.
5. Sales offers resolve only for completed foreground minutes and may be created only while below derived sales capacity; retained partial time carries between ticks.
6. Fast-forward first processes real foreground time, then simulates 60 seconds through the same path.
7. Background processes the final active interval and saves; resume resets the observation anchor. Inactive time awards no work, offers, research progress, or prestige decay.

Offline catch-up is deferred and must use this rule path when approved.

## Save Lifecycle

| Event | Behavior |
|---|---|
| Normal change | Batch the current snapshot for up to five seconds. |
| Checkpoint or background | Flush one current snapshot after processing final active time. |
| Launch | Restore the persisted device session, then the valid snapshot for its active company before interaction; apply no catch-up. |
| Company switch/logout | Flush the outgoing company's snapshot before changing session; a logout clears only the selected local session. |
| Invalid snapshot | Start only that company fresh and leave other company saves untouched. |
| Delete company | Delete the active company record and its cascaded local save/tutorial rows, then return to local company selection. |
| Clear local data (admin) | Delete every local profile, company, save, tutorial row, and device session while retaining the empty SQLite schema. |

No save-version compatibility layer exists: the old singleton save is deliberately discarded in favour of company-keyed snapshots. Achievement ledger, production statistics, research ledger, and company-start logical time are required snapshot fields.
