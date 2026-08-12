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

Recipes consume inputs at cycle start; if inputs are absent, the facility stalls without banking work. A completed cycle grants `baseOutput × outputMultiplier`. Each constructed facility is an independent numbered instance, so multiple facilities of one type can run different recipes and upgrades.
Players may pause a selected recipe without clearing it; resuming continues its retained cycle progress. A facility also stalls automatically at a cycle boundary when its next recipe inputs are unavailable.

| Recipe | Inputs | Output | Work |
|---|---|---:|---:|
| Grow Grain | 1 Water, 1 Electricity | 1 Grain | 0.06 |
| Bake Bread | 2 Grain, 1 Water, 1 Electricity | 3 Bread | 0.26 |
| Produce Water / Electricity | None | 1 utility resource | 0.073 / 0.11 |
| Grow Sugar | 4 Water | 1 Sugar | 0.12 |
| Mine Coal | 1 Water, 2 Electricity | 2 Coal | 0.2 |
| Mine Iron | 2 Water, 4 Electricity | 1 Iron | 0.267 |
| Mine Copper | 2 Water, 5 Electricity | 1 Copper | 0.333 |
| Quarry Sand | 1 Water, 1 Electricity | 3 Sand | 0.107 |
| Quarry Clay | 2 Water, 1 Electricity | 2 Clay | 0.16 |
| Quarry Stone | 1 Water, 4 Electricity | 3 Stone | 0.213 |
| Produce Steel | 2 Iron, 1 Coal, 2 Water, 6 Electricity | 5 Steel | 1.1 |
| Produce Electric Circuits | 2 Sand, 2 Copper, 1 Water, 4 Electricity | 4 Electric Circuits | 1.65 |
| Produce Bricks | 2 Clay, 1 Sand, 1 Water, 3 Electricity | 10 Bricks | 0.65 |
| Produce Cement | 3 Stone, 1 Clay, 1 Water, 5 Electricity | 5 Cement | 1.083 |
| Produce Reinforced Concrete | 2 Cement, 3 Sand, 2 Stone, 2 Steel, 2 Water, 2 Electricity | 6 Reinforced Concrete | 2.6 |
| Produce Construction Materials | 4 Bricks, 2 Reinforced Concrete, 2 Steel, 2 Sand, 3 Electricity | 4 Construction Materials | 5.2 |
| Bake Cake | 1 Grain, 0.5 Sugar, 2 Electricity, 2 Water | 3 Cake | 0.39 |
| Manual / Electric Pumping | None / 1 Electricity | 1 / 5 Water | 0.073 / 0.12 |
| Coal / Solar Power | 1 Coal, 2 Water / None | 10 / 1 Electricity | 0.467 / 0.933 |

For `levels = speedLevel + outputLevel`:

- Upgrade cost: `ceil(upgradeCost × 1.5^currentLevel)`.
- Speed-upgrade work-speed multiplier: `1 + 0.8 × (1 - e^(-0.22 × speedLevel))`.
- Output multiplier: `1 + (1 - e^(-0.18 × outputLevel))`.
- Required workers: `baseWorkers + levels + ceil(baseWorkers × 1.15^levels - baseWorkers)`.
- Staffing efficiency at or below target: `0.01 + 0.99 × ratio^1.6`; above target: `1 + 0.25 × (1 - e^(-0.7 × (ratio - 1)))`.
- Facility condition starts at `1`, is clamped to `0–1`, and loses `1 / 600` per constructed facility per foreground minute. Each completed recipe cycle loses `(recipe.requiredWork / 600 + 0.05 / 600) × recipe.conditionWearMultiplier` condition. The fixed per-cycle term makes shorter cycles wear more per minute; the static per-recipe multiplier reflects machinery intensity and never follows live market prices. Both losses are multiplied by `calculateAsymmetricalScaler01(facilityCondition)`, so wear is fastest at high condition and slows toward zero.
- Overstaffing also multiplies both condition losses by `1.5^(staffingRatio - 1)` whenever staffing exceeds the requirement. This exponential wear penalty has no ceiling.
- Condition upgrades reduce both wear sources by `1 - 0.75 × (1 - e^(-0.18 × conditionUpgradeLevel))`; the reduction approaches 75% without reaching it, uses the same facility upgrade cost curve, and does not increase worker requirements.
- Facility efficiency: `staffingEfficiency × conditionEfficiency`, where `conditionEfficiency = 1 - calculateAsymmetricalScaler01(1 - facilityCondition)`, so each lost point of condition is increasingly costly.
- Repairing a facility restores condition to `1` and costs only Construction Materials: `constructionMaterialsCost × 0.9 × (1 - facilityCondition)`. Missing materials are bought automatically from the local market; land cost is excluded.
- Staff work: `requiredWorkers × 0.1 × (stepMs / 60,000) × staffingEfficiency` work per foreground step.
- Effective work: `(baseWork + staffWork) × conditionEfficiency × speedUpgradeWorkSpeedMultiplier × recipeResearchWorkSpeedMultiplier`.

The following reference values use the current condition curve. Passive time advances in one-second steps; production uses completed `1.00`-work cycles. Their nearly identical results differ only because of that step size.

| Foreground time | Completed 1.00-work cycles | Passive condition | Production condition |
|---:|---:|---:|---:|
| Start | 0 | 100.00% | 100.00% |
| 1 hour | 60 | 90.11% | 90.11% |
| 2 hours | 120 | 80.50% | 80.49% |
| 4 hours | 240 | 62.58% | 62.57% |
| 6 hours | 360 | 47.61% | 47.59% |
| 8 hours | 480 | 35.45% | 35.42% |
| 10 hours | 600 | 26.26% | 26.23% |
| 15 hours | 900 | 12.40% | 12.38% |
| 20 hours | 1,200 | 5.86% | 5.84% |
| 30 hours | 1,800 | 1.31% | 1.30% |
| 40 hours | 2,400 | 0.29% | 0.29% |
| 60 hours | 3,600 | 0.01% | 0.01% |

Levels and worker counts are non-negative integers. A zero-worker requirement has 100% efficiency; above-target staffing cannot reach a 25% bonus.

## Market

- Each resource's catalogue entry defines local, regional, and global benchmark and initial supply, plus separate logistics and value-density multipliers. Every price is `benchmarkSupply / max(supply, 1) × marketQuality`. Regional values retain the former local levels. Local supply and benchmark are 1/100 of regional for resources initially priced at €1 or less, 1/20 for €1–€5 resources, and 1/10 for higher-priced resources, so every tier begins at the same price while cheap goods have the most volatile local market. The same diffusion formula runs sequentially for local/regional and regional/global pairs, using the lower tier's initial supply as its base: `initialSupply / MARKET_DIFFUSION_DIVISOR × priceGap × (1 + priceGap)^MARKET_DIFFUSION_CURVATURE × logisticsMultiplier × valueDensityMultiplier × marketUrgencyMultiplier`. The urgency multiplier is the bounded `0.75–1.5` response to the geometric mean of adjacent prices relative to their initial geometric mean. Each tick is capped to 50% of the distance to current pair equilibrium, then capped by source supply.
- `Market.getLocalRegionalDiffusionDetails(resourceType)` and `Market.getRegionalGlobalDiffusionDetails(resourceType)` expose current prices, targets, multipliers, and effective post-cap transfers for the read-only Market Flow IndustriPedia view.
- Foreground minute completion creates price-locked sales offers, then source-capped diffusion balances every resource first between local/regional and then regional/global reservoirs. Offline time does none of these.
- Manual buys/sells trade only with the local market. A fulfilled sales contract adds the delivered inventory and its quality directly to the global reservoir; its reward was locked at offer time from global price × 1.20.
- Each resource has one saved autotrade interval, defaulting to 5 seconds. At every completed interval, enabled autobuy fills its target inventory and may purchase missing recipe inputs from the local market when its finite price cap, funds, supply, and access rule allow it; enabled autosell then sells under its existing rate, minimum inventory, and minimum-price limits. The autosell maximum remains a per-minute rate and is scaled to the interval.

## Finance, Prestige, and Sales

- Construction requires both land funds and Construction Materials. It applies `newBalance = currentBalance - landCost` and consumes `constructionMaterialsCost` from inventory; neither balance nor materials can become negative.
- Finance records each accepted cash movement with a signed amount, a typed source and accounting kind, nested detail lines, balance after the movement, and logical foreground-game time. The Finance UI derives rolling statements for the last 1 minute, 15 minutes, 1 hour, 10 hours, 24 hours, or all time.
- Current assets are cash plus inventory valued at live local-market prices. Fixed facility value is `(landCost + constructionMaterialsCost × localMaterialsPrice + upgradeCost × upgradeLevels) × max(0.1, facilityCondition)`. Completed research is a capitalized intangible at its configured cost. Total equity is derived as assets less outstanding liabilities.
- Cash-flow rows group operating income and expenses into player-selected 1-minute or 15-minute foreground windows, retain individual investing/financing rows, and expose their recorded nested descriptions.
- A fresh company receives a deterministic saved portfolio of generated banks, investment funds, private lenders, and quickloan lenders. Each lender has independent rate, risk tolerance, flexibility, amount/term bounds, origination fees, market capitalization, and single-borrower exposure.
- Lender availability and each lender's policy cap are derived as `min(assetCap, ratingCap, marketCapLimit, contractLimit)`. The company borrowing ceiling is the highest policy cap among eligible lenders; available borrowing is that ceiling less outstanding debt. The mobile Finance view exposes this full per-lender breakdown.
- Lender searches accept lender-type, €50–€1,000,000 amount, 5–1,440 foreground-minute term, and 1–10 offer-count criteria, charge a deterministic search fee up front, and become a foreground-time activity. The offer-count multiplier, regular-lender-type narrowness (up to 1.5×), amount-range narrowness (up to 2×), and term-range narrowness (up to 2×) multiply work. The cash fee is `€10 + €25 × active parameter count × selectivity multiplier^1.25`; lender filtering, narrowing amount, narrowing term, and requesting more than one offer each add one active parameter. A quickloan-only search has no fee and does not gain a selectivity multiplier from its lender filter. Matching offers appear only on completion. Accepting a quote consumes that quote only; all remaining results are immediately rechecked against their lenders' updated available limits, and the player can dismiss unavailable quotes individually or as a group. Accepted loans add proceeds and an origination fee as financing cash flow.
- A loan uses amortized foreground-minute payments. An extra payment charges an administration fee and reduces principal; full repayment charges a bounded prepayment penalty. A missed payment can charge a late fee; four missed payments default the loan.
- Economy phase is persisted as crash, recession, stable, expansion, or boom. It transitions deterministically at 24-hour foreground periods and adjusts the interest rate on future offers. Credit rating derives from detailed asset health, payment history, company stability, and negative-balance penalty inputs.
- A construction confirmation may buy only its missing Construction Materials from the local market at the current unit price. The purchase is allowed only when local supply and funds cover both the materials and the pending land cost.
- Prestige is informational. Its total is derived from a permanent balance event and decaying fulfilled-sales events using foreground logical time; background time does not decay it.
- Achievements are evaluated from post-command state. Facility/finance changes check their categories immediately; completed production updates lifetime total and per-resource output before production checks; fulfilled sales check sales, finance, and prestige after their normal prestige event; time checks run after completed foreground minutes.
- An achievement unlock is durable and creates one source-keyed `achievement:<id>` prestige event. The evaluator sees normal post-command prestige but not prestige rewards from other unlocks in that same pass, so prestige tiers cannot recursively chain.
- Each foreground minute may offer one contract. Offer chance falls from 100% as unfulfilled contracts grow, using sales control points `0→0`, `3→0.25`, `5→0.50`, `10→0.75`, and `1,000,000→almost 1`, then `1 - calculateAsymmetricalScaler01(...)`.
- A contract requests a random catalogue resource and quantity 1–10, pays `quantity × €1`, and can be fulfilled only with the full inventory amount. Rejection changes neither inventory nor finance.
- The customer pipeline is visual only and does not affect offer rolls. It fills green through one estimated wait interval, then refills in red for each additional estimated interval until an offer resets it.
- Capital Grants scale their cost, reward, and foreground duration aggressively; late tiers take hours. Sales Capacity raises the derived open-contract maximum from its base of two to 3, 5, 7, 10, or 15. Sales Targeting gives previously produced resources 2×, 4×, 8×, and 16× offer-selection weight across its first four tiers, then limits offers to those resources when at least one exists. Contract Value raises the customer-contract premium from 25% through 30%, 35%, 40%, and 50%; it does not affect ordinary market sales. Capacity blocks only newly created offers; existing offers remain actionable.
- A research project requires all of its gates at start, deducts its full configured cost immediately, and is the only active project for its company. Completion is durable and applies its grant/effect once. Cancelling refunds the recorded full paid cost and discards partial progress.
- A progression grant may reduce a specific action's cost to zero. Building a company's first facility grants a one-use waiver for its first listed recipe research; that research retains its normal duration and a cancellation refunds zero.

## Foreground Time

1. `TimeManager` measures active wall-clock time from `lastObservedAtMs`.
2. `advanceGameTime` splits it into one-second simulation steps.
3. Each step advances logical time and pipeline, applies passive condition wear to every constructed facility, then gives active facilities `elapsedSeconds / 60` base work in fixed order. A completed recipe cycle applies its linear production tear before its output is recorded in lifetime production statistics after output multipliers apply.
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

No save compatibility layer exists: a snapshot that lacks a required current field, including facility condition, is discarded. Achievement ledger, production statistics, research ledger, facility condition, and company-start logical time are required snapshot fields.
