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
| Finance, inventory and resource-flow history, facilities and maintenance statistics, customer orders and relationships, achievements, prestige, research, logical game time | Domain models in the store | Yes |
| Foreground wall-clock observation anchor and derived UI data | Store/runtime helpers | No |
| Durable snapshot | Company-keyed Expo SQLite adapter | Yes |
| Cloud state | None | No |

## Production and Facilities

Recipes consume inputs at cycle start; if inputs are absent, the facility stalls without banking work. A completed cycle grants every configured `baseOutput × outputMultiplier`. A facility may run one or more researched recipes as an ordered production cycle; when a recipe completes, it starts the next entry and returns to the first after the final entry. A production cycle may repeat a recipe. Each constructed facility is an independent numbered instance, so multiple facilities of one type can run different recipes, cycles, and upgrades. Successful recipe-input consumption and completed outputs both record a categorized resource-flow entry at the foreground step's logical time.
Players may pause a selected recipe without clearing it; resuming continues its retained cycle progress. A facility also stalls automatically at a cycle boundary when its next recipe inputs are unavailable.

| Recipe | Inputs | Output | Work |
|---|---|---:|---:|
| Grow Grain | 1 Water, 1 Electricity, 0.025 Fertilizer | 1.2 Grain | 0.06 |
| Bake Bread | 1.5 Grain, 1 Water, 1 Electricity | 4.5 Bread | 0.26 |
| Produce Water / Electricity | None | 2 utility resources | 0.073 / 0.11 |
| Grow Sugar | 3 Water, 0.04 Fertilizer | 1.2 Sugar | 0.12 |
| Grow Fruit | 2 Water, 0.03 Fertilizer | 2 Fruit | 0.16 |
| Raise Cattle | 12 Grain, 8 Water, 5 Electricity | 2 Meat, 5 Milk, 0.2 Fertilizer | 2.45 |
| Raise Sheep | 8 Grain, 6 Water, 4 Electricity | 1.5 Meat, 2 Wool, 0.1 Fertilizer | 1.75 |
| Raise Chicken | 4 Grain, 4 Water, 3 Electricity | 1 Meat, 5 Eggs, 0.05 Fertilizer | 1.4 |
| Mine Coal | 1 Water, 2 Electricity | 2.5 Coal | 0.2 |
| Mine Iron | 2 Water, 4 Electricity, 0.1 Chemicals | 1.25 Iron | 0.267 |
| Mine Copper | 2 Water, 5 Electricity, 0.1 Chemicals | 1.25 Copper | 0.333 |
| Mine Gold | 3 Water, 8 Electricity | 0.2 Gold | 0.667 |
| Quarry Sand | 1 Water, 1 Electricity | 3 Sand | 0.107 |
| Quarry Clay | 2 Water, 1 Electricity | 2 Clay | 0.16 |
| Quarry Stone | 1 Water, 4 Electricity | 3 Stone | 0.213 |
| Quarry Minerals | 1 Water, 2 Electricity | 3 Minerals | 0.16 |
| Produce Steel | 2 Iron, 1 Coal, 2 Water, 6 Electricity | 6 Steel | 1.1 |
| Produce Electric Circuits | 2 Copper, 1 Silicon, 1 Plastic, 1 Water, 4 Electricity | 5 Electric Circuits | 1.65 |
| Produce Chemicals | 2 Minerals, 2 Water, 4 Electricity | 4 Chemicals | 2.5 |
| Synthesize Fertilizer | 1 Chemicals, 1 Minerals, 1 Water, 2 Electricity | 4 Fertilizer | 1.667 |
| Produce Plastic | 2 Chemicals, 1 Water, 3 Electricity | 4 Plastic | 1.667 |
| Produce Silicon | 3 Minerals, 3 Sand, 5 Electricity | 2 Silicon | 2.017 |
| Produce Advanced Components | 2 Electric Circuits, 2 Silicon, 0.1 Gold, 1 Water, 4 Electricity | 3 Advanced Components | 3.025 |
| Assemble Industrial Machines | 6 Steel, 3 Electric Circuits, 2 Advanced Components, 2 Water, 6 Electricity | 4 Industrial Machines | 5.95 |
| Produce Bricks | 2 Clay, 1 Sand, 1 Water, 3 Electricity | 12 Bricks | 0.65 |
| Produce Cement | 3 Stone, 1 Clay, 1 Minerals, 1 Water, 5 Electricity | 7 Cement | 1.083 |
| Produce Reinforced Concrete | 2 Cement, 3 Sand, 2 Stone, 2 Steel, 0.5 Minerals, 0.25 Chemicals, 2 Water, 2 Electricity | 7 Reinforced Concrete | 2.6 |
| Produce Construction Materials | 2 Bricks, 1 Reinforced Concrete, 1 Steel, 1 Sand, 1 Cement, 0.1 Chemicals, 0.2 Plastic, 2 Electricity | 8 Construction Materials | 5.2 |
| Bake Cake | 1 Grain, 0.5 Eggs, 2 Electricity, 2 Water | 4 Cake | 0.39 |
| Bake Premium Cake | 1 Grain, 0.5 Eggs, 1 Fruit, 1 Milk, 2 Electricity, 2 Water | 4 Premium Cake | 0.52 |
| Bake Meat Pie | 1 Grain, 1 Meat, 1 Water, 2 Electricity | 4 Meat Pie | 0.65 |
| Manual / Electric Pumping | None / 1 Electricity | 2 / 7 Water | 0.073 / 0.12 |
| Coal / Solar Power | 0.5 Coal, 1 Water / None | 6 / 3 Electricity | 0.467 / 0.933 |

For `levels = speedLevel + outputLevel`:

- Upgrade cost: `ceil(upgradeCost × 1.5^currentLevel)` euros, plus `constructionResourceCost × 0.2 × 1.5^currentLevel` Construction Materials and Industrial Machines. Resource costs may be fractional.
- When an upgrade is confirmed, any missing Construction Materials or Industrial Machines are bought from the local market automatically. The button's cash cost includes those purchases and the euro upgrade cost; it remains unavailable when either market supply or total cash is insufficient.
- Speed-upgrade work-speed multiplier: `1 + 0.8 × (1 - e^(-0.22 × speedLevel))`.
- Output multiplier: `1 + 1.5 × (1 - e^(-0.18 × outputLevel))`.
- Required workers: `baseWorkers + levels + ceil(baseWorkers × 1.15^levels - baseWorkers)`.
- Staffing efficiency at or below target: `0.01 + 0.99 × ratio^1.6`; above target: `1 + 0.25 × (1 - e^(-0.7 × (ratio - 1)))`.
- Facility condition starts at `1`, is clamped to `0–1`, and loses `1 / 1,200` per constructed facility per foreground minute. Each completed recipe cycle loses `(recipe.requiredWork / 1,200 + 0.05 / 1,200) × recipe.conditionWearMultiplier` condition. The fixed per-cycle term makes shorter cycles wear more per minute; the static per-recipe multiplier reflects machinery intensity and never follows live market prices. Both losses are multiplied by `calculateAsymmetricalScaler01(facilityCondition)`, so wear is fastest at high condition and slows toward zero.
- Overstaffing also multiplies both condition losses by `1.5^(staffingRatio - 1)` whenever staffing exceeds the requirement. This exponential wear penalty has no ceiling.
- Condition upgrades reduce both wear sources by `1 - 0.75 × (1 - e^(-0.18 × conditionUpgradeLevel))`; the reduction approaches 75% without reaching it, uses the same three-input upgrade cost curve, and does not increase worker requirements.
- Facility efficiency: `staffingEfficiency × conditionEfficiency`, where `conditionEfficiency = 1 - calculateAsymmetricalScaler01(1 - facilityCondition)`, so each lost point of condition is increasingly costly.
- Repairing a facility restores condition to `1` and costs cash, Construction Materials, and Industrial Machines. Each is `its construction cost × 0.9 × (1 - facilityCondition)`; cash uses land cost. Missing resource inputs are bought automatically from the local market and included in the displayed cash total.
- Staff work: `requiredWorkers × 0.1 × (stepMs / 60,000) × staffingEfficiency` work per foreground step.
- Effective work: `(baseWork + staffWork) × conditionEfficiency × speedUpgradeWorkSpeedMultiplier × recipeResearchWorkSpeedMultiplier`.

The following reference values use the current condition curve. Passive time advances in one-second steps; production uses completed `1.00`-work cycles. Their nearly identical results differ only because of that step size.

| Foreground time | Completed 1.00-work cycles | Passive condition | Production condition |
|---:|---:|---:|---:|
| Start | 0 | 100.00% | 100.00% |
| 1 hour | 60 | 95.03% | 95.03% |
| 2 hours | 120 | 90.11% | 90.11% |
| 4 hours | 240 | 80.49% | 80.49% |
| 6 hours | 360 | 71.26% | 71.25% |
| 8 hours | 480 | 62.58% | 62.57% |
| 10 hours | 600 | 54.71% | 54.70% |
| 15 hours | 900 | 38.20% | 38.19% |
| 20 hours | 1,200 | 26.24% | 26.23% |
| 30 hours | 1,800 | 12.39% | 12.38% |
| 40 hours | 2,400 | 5.85% | 5.84% |
| 60 hours | 3,600 | 1.30% | 1.30% |

Levels and worker counts are non-negative integers. A zero-worker requirement has 100% efficiency; above-target staffing cannot reach a 25% bonus.

### Recipe Economy Validation

The deterministic recipe-economy simulator models one fully staffed facility buying its recipe inputs locally, continuously selling its completed output locally, applying normal foreground wear and five-second adjacent-market diffusion. Initial net margin is calculated from a full initial-market cycle rate, including expected maintenance, rather than treating inputs bought before a long recipe's first output as a loss. It reports initial and sustained net margin after inputs and maintenance, facility and upgrade investment, payback time, condition, repairs, market stalls, and the first non-positive completed-cycle margin when one occurs. Standard diagnostics cover 15 minutes, 60 minutes, and an optional four-hour break-even horizon. Recipe windows include the 180-minute margin in both base-market and pre-owned Network III market conditions; the latter is a resilience diagnostic and does not charge market-network research to facility payback. When their test-only `electricity max 1.5x` comparison differs, it appears as a second line in the margin column; electricity bought above 1.5 times its initial local price is externally supplied at that cap, without changing runtime market rules. The compact Markdown report also includes base-market shared-production chains: upstream output is available before downstream production, then the chain retains its following-minute inputs and sells every other produced good. Chain results show 15/60/180-minute margins, the first non-positive output minute, setup-cost payback, participating facilities, named primary outputs, and local-market input spending. Chain payback includes facility construction and each distinct recipe-unlock research cost. Every chain consumes the total Construction Materials and Industrial Machines requirement of its participating facilities evenly over the 180-minute scenario as external construction demand; this is a test-only demand floor, not a player expense or a live market sink. A chain that stalls is an invalid report scenario. The simulated facility repairs to 100% whenever condition reaches 70%; outstanding repair cost is included as maintenance even before the threshold is reached.

## Market

- Each resource's catalogue entry defines local, regional, and global benchmark and initial supply, plus separate logistics and value-density multipliers. Every price is `benchmarkSupply / max(supply, 1) × marketQuality`. Regional values retain the former local levels. Local supply and benchmark are 1/100 of regional for resources initially priced at €1 or less, 1/20 for €1–€5 resources, and 1/10 for higher-priced resources, so every tier begins at the same price while cheap goods have the most volatile local market. The same diffusion formula runs sequentially for local/regional and regional/global pairs, using regional initial supply as its rate base: `rateBaseSupply / MARKET_DIFFUSION_DIVISOR × priceGap × (1 + priceGap)^MARKET_DIFFUSION_CURVATURE × logisticsMultiplier × valueDensityMultiplier × localRegionalResearchMultiplier`, where `priceGap = max(lowerPrice / higherPrice, higherPrice / lowerPrice) - 1`. This preserves the formula's former market-scale response for local/regional diffusion without accelerating regional/global diffusion; Market Diffusion Network can raise only its local/regional raw request through 1.15×, 1.30×, 1.50×, 1.70×, 2.00×, 2.30×, 2.60×, 3.00×, 3.50×, and 4.00×. Diffusion runs every five foreground seconds; raw requests scale by elapsed time and the equilibrium cap compounds to the same 50% maximum correction per foreground minute before source-supply capping.
- Local Market Network research multiplies all local benchmark supplies and their current local pool supplies by the same completed-tier multiplier (1.2, 1.5, 1.9, 2.4, 3.1, 3.9, 4.8, 5.8, 6.9, or 8.0). Its completion is price-neutral; subsequent local purchases and sales have a proportionally smaller price impact. The multiplier is derived from completed research, while the expanded local pools remain part of the normal market snapshot. The 8.0× ceiling keeps every local market below its regional market, whose smallest relative size is 10× local.
- `Market.getLocalRegionalDiffusionDetails(resourceType)` and `Market.getRegionalGlobalDiffusionDetails(resourceType)` expose current prices, targets, multipliers, and effective post-cap transfers for the read-only Market Flow IndustriPedia view.
- Foreground minute completion creates price-locked sales offers. Every five foreground seconds, source-capped diffusion balances every resource first between local/regional and then regional/global reservoirs. Offline time does neither.
- Manual buys/sells trade only with the local market. A fulfilled customer order adds the delivered inventory and its quality directly to the global reservoir; its reference price, bid, premium, quantity, and reward are locked at offer time.
- Each resource has one saved autotrade interval, defaulting to 5 seconds. At every completed interval, enabled autobuy fills its target inventory and may purchase the combined inputs for each active facility's full production cycle from the local market when its finite price cap, funds, supply, and access rule allow it. Autobuy buys the largest partial amount that leaves the resulting local unit price at or below its cap when the full target would exceed it; enabled autosell then sells under its existing rate, minimum inventory, and minimum-price limits. The autosell maximum remains a per-minute rate and is scaled to the interval.
- Resource-flow history records manual and automatic local-market buys and sells, customer-order delivery, facility construction/upgrade/repair inputs, and achievement resource rewards. The most recent foreground hour is retained at one-second precision for 15-second through 1-hour Inventory views; all-time totals retain the same categories without unbounded history growth.

## Finance, Prestige, and Sales

- Construction requires land funds, Construction Materials, and Industrial Machines. It applies `newBalance = currentBalance - landCost` and consumes `constructionMaterialsCost` and `industrialMachinesCost` from inventory; neither balance nor construction input can become negative.
- Finance records each accepted cash movement with a signed amount, a typed source and accounting kind, nested detail lines, balance after the movement, and logical foreground-game time. The Finance UI derives rolling statements for the last 1 minute, 15 minutes, 1 hour, 10 hours, 24 hours, or all time.
- Current assets are cash plus inventory valued at live local-market prices. Fixed facility value includes land, facility-construction inputs, and each completed upgrade's euro, Construction Materials, and Industrial Machines investment, then multiplies the total by `max(0.1, facilityCondition)`. Completed research is a capitalized intangible at its configured cost. Total equity is derived as assets less outstanding liabilities.
- Cash-flow rows group operating income and expenses into player-selected 1-minute or 15-minute foreground windows, retain individual investing/financing rows, and expose their recorded nested descriptions.
- A fresh company receives a deterministic saved portfolio of generated banks, investment funds, private lenders, and quickloan lenders. Each lender has independent rate, risk tolerance, flexibility, amount/term bounds, origination fees, market capitalization, and single-borrower exposure.
- Lender availability and each lender's policy cap are derived as `min(assetCap, ratingCap, marketCapLimit, contractLimit)`. The company borrowing ceiling is the highest policy cap among eligible lenders; available borrowing is that ceiling less outstanding debt. The mobile Finance view exposes this full per-lender breakdown.
- Lender searches accept lender-type, €50–€1,000,000 amount, 5–1,440 foreground-minute term, and 1–10 offer-count criteria, charge a deterministic search fee up front, and become a foreground-time activity. The offer-count multiplier, regular-lender-type narrowness (up to 1.5×), amount-range narrowness (up to 2×), and term-range narrowness (up to 2×) multiply work. The cash fee is `€10 + €25 × active parameter count × selectivity multiplier^1.25`; lender filtering, narrowing amount, narrowing term, and requesting more than one offer each add one active parameter. A quickloan-only search has no fee and does not gain a selectivity multiplier from its lender filter. Matching offers appear only on completion. Accepting a quote consumes that quote only; all remaining results are immediately rechecked against their lenders' updated available limits, and the player can dismiss unavailable quotes individually or as a group. Accepted loans add proceeds and an origination fee as financing cash flow.
- A loan uses amortized foreground-minute payments; one minute is one finance payment cycle. Its fee-inclusive 52-cycle loan cost is calculated as the effective rate that discounts the scheduled payments to the principal less origination fee, normalized over 52 payment cycles. An extra payment charges an administration fee and reduces principal; full repayment charges a bounded prepayment penalty. Misses trigger a late-fee warning at one, rate/balance escalation and a fading prestige loss at three, inventory-first and facility-second forced liquidation at six, then lender blacklist, default prestige loss, and a Collections Recovery restructure offer at ten. Forced liquidation pays 55% of the current inventory/facility value and is capped at 50% of pre-collection assets; voluntary facility sales pay 70% of the same condition-adjusted facility valuation used by the balance sheet.
- Economy phase is persisted as crash, recession, stable, expansion, or boom. It starts stable and transitions deterministically every 10 foreground minutes: Stable has 15% chances to move toward recession or expansion; Recession/Expansion have a 35% chance to return to Stable, a 10% chance to move further from Stable, and otherwise stay; Crash/Boom have a 35% chance to return inward. It adjusts the interest rate on future loan offers, the frequency of new customer orders, and the premiums on new customer bids; existing loans and orders are unaffected. Credit rating derives from detailed asset health, payment history, company stability, and negative-balance penalty inputs. Payment history starts at 100% and loses 8 percentage points per missed payment plus 30 percentage points per default. Company stability is `35% × sqrt(min(activeHours / 240, 1)) + 40% × recent consistency + 25% × operating-margin efficiency`; recent consistency uses up to 16 operating 15-minute periods, blends a 60% starter score by observed coverage, and halves the observed consistency for a negative average period result. Operating-margin efficiency reaches 100% at a 25% or greater operating margin.
- A construction confirmation may buy only its missing Construction Materials and Industrial Machines from the local market at their current unit prices. The purchase is allowed only when local supply and funds cover both inputs and the pending land cost.
- Prestige is informational. Its total is derived from a permanent balance event and decaying fulfilled-sales events using foreground logical time; background time does not decay it.
- Achievements are evaluated from post-command state. Facility/finance changes check their categories immediately; completed production updates lifetime total and per-resource output before production checks; fulfilled sales check sales, finance, and prestige after their normal prestige event; time checks run after completed foreground minutes.
- An achievement unlock is durable and creates one source-keyed `achievement:<id>` prestige event. The evaluator sees normal post-command prestige but not prestige rewards from other unlocks in that same pass, so prestige tiers cannot recursively chain.
- Each foreground minute may acquire one customer order when a meaningful inventory lot is available within the current order-value cap. Chance is `100% base × (65% + prestige discovery progress) × pending-order penalty × economy frequency`; it is zero without an eligible lot and falls as open orders accumulate. The sales screen displays the non-base factors and compact estimated wait.
- The deterministic local customer catalogue has Food, Raw Materials, Industrial Inputs, Construction Materials, Electronics, and Utilities buyers. Each domain uses the Winemaker-style customer-generation flow: select a customer type, make skewed market-share draws, take extra draws and keep the smallest for larger candidates, scale by the domain and customer-type share multipliers, then continue until the domain reaches 100%. Private customers are strongly compressed toward small shares; enterprise, utility, contractor, and government buyers can absorb larger shares. Every buyer has market share, purchasing power, and bid profile. Utility orders use high standard lots (Water 500, Electricity 250), so low unit price still produces meaningful order value.
- An order locks one or more inventory-ready resource lines, each with its own customer bid, global reference price, premium, global-supply volume multiplier, lot-sized quantity, and reward. It is fulfilled atomically. Quantity per line is `roundUp(line target value × market volume multiplier / bid, standard order lot)`. Standard lots are static commercial units tuned by resource scale and global initial supply. The rolled domain target value is multiplied by `1 + 3 × prestige / (prestige + 250)` (capped below 4×) and by `1 + 0.2 × relationship` (at most 1.2×) before it is distributed across lines, then cannot exceed `max(€100, current company assets × Order Scope fraction)`. Current global supply relative to the resource benchmark applies a bounded final volume multiplier: shortage reaches at most 1.12× and oversupply at most 1.30× by three times benchmark supply. The order-value cap remains authoritative. The base Order Scope fraction is 50%; its five research tiers raise it to 75%, 100%, 150%, 250%, and 400%. Customer type and generated operating domains restrict eligible resources. Bundle line count is a skewed, maturity-weighted draw across compatible in-stock resources, using prestige control points 0/1/5/20/60/150/300, normalized 0–1 relationship, market share, and type appetite; there is no fixed line cap beyond compatible resources. Global premiums use a positive-skewed bounded tail, with rare capped pressure offers below global. Fulfilment relationship gain is `domain modifier × 0.10 × global-reference-value / (global-reference-value + €350) × (1 − relationship taper)`, so larger orders earn more but gains flatten as relationship rises. Rejection and expiry use the same relationship-and-value curve, starting at `−0.0001`: rejection approaches `−0.10`, while expiry approaches `−0.20` only at relationship 1 and an effectively uncapped late-game order. The UI multiplies relationship values by 100. Reputation is the prestige recognition less the customer-market-share adjustment; relationship beyond or below that baseline is retained order history. Foreground-time decay moves that history toward Reputation; zero prestige gives no static relationship floor.
- The customer pipeline is visual only and does not affect offer rolls. It fills green through one estimated wait interval, then refills in red for each additional estimated interval until an offer resets it.
- Capital Grants scale their cost, reward, and foreground duration aggressively; late tiers take hours. Sales Capacity raises the derived open-contract maximum from its base of two to 3, 5, 7, 10, or 15. Order Scope raises the maximum value of a newly generated customer order from 50% of company assets through 75%, 100%, 150%, 250%, and 400%, with a €100 practical floor. Sales Targeting gives previously produced resources 2×, 4×, 8×, and 16× offer-selection weight across its first four tiers, then limits offers to those resources when at least one exists. Contract Value raises the customer-contract premium from 25% through 30%, 35%, 40%, and 50%; it does not affect ordinary market sales. Capacity blocks only newly created offers; existing offers remain actionable.
- A research project requires all of its gates at start, deducts its full configured cost immediately, and is the only active project for its company. Recipe-unlock research and recipe work-speed follow-ups use three times their base foreground duration. Completion is durable and applies its grant/effect once. Cancelling refunds the recorded full paid cost and discards partial progress.
- A progression grant may reduce a specific action's cost or duration. Building a company's first facility grants a one-use waiver for its first listed recipe research; it costs zero and its effective duration is one tenth of the configured duration. A cancellation refunds zero.

## Foreground Time

1. `TimeManager` measures active wall-clock time from `lastObservedAtMs`.
2. `advanceGameTime` splits it into one-second simulation steps.
3. Each step advances logical time and pipeline, applies passive condition wear to every constructed facility, then gives active facilities `elapsedSeconds / 60` base work in fixed order. A completed recipe cycle applies its linear production tear before its output is recorded as all-time `facility-output` resource flow after output multipliers apply; achievements and sales targeting consume those totals.
4. Active research advances by the same foreground elapsed milliseconds; background/resume time adds none. A completed project clears the active record and applies its one-time effect atomically.
5. Customer orders resolve only for completed foreground minutes and may be created only while below derived sales capacity; retained partial time carries between ticks. The customer catalogue is code-derived, while order and relationship state are company-owned snapshot data.
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

No save compatibility layer exists: a snapshot that lacks a required current field is discarded. Achievement ledger, resource-flow ledger, facility-maintenance statistics, research ledger, facility condition, and company-start logical time are required snapshot fields. Changes to persisted gameplay units intentionally invalidate former saves through the existing structural validation rather than introducing version tracking.
