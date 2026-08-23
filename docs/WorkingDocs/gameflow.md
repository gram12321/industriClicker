# Industri Clicker Gameflow

Authority for mechanics, formulas, tick order, state ownership, and save lifecycle. Names are in [CONTEXT.md](CONTEXT.md); variable/dependency details are in [VariableRelationshipMap.md](VariableRelationshipMap.md).

## System Flow and Ownership

```text
Player/system event -> typed command -> pure rules -> Zustand state -> derived UI
Foreground elapsed time -> advanceGameTime -> one-second timed rules -> SQLite save boundary
```

| Concern | Owner | Durable form |
|---|---|---|
| Catalogues and balance | Typed `*Constants.ts` modules | Code only |
| Active gameplay | Zustand domain objects | Current `GameSnapshot` |
| Profile/company/session/tutorial metadata | Company/tutorial SQLite adapters | Dedicated local tables |
| Foreground observation anchor and UI data | Runtime helpers/selectors | None |
| Cloud state | None | None |

## Production and Facilities

- A recipe consumes all inputs at cycle start or stalls without banking work. Capture input quality and input source cost then; at completion, add the production-maintenance allocation and divide total source cost across output quantity.
- Production-maintenance allocation is `productionConditionLoss × repairMaterialCostRate × (landCost + constructionMaterialsCost × localConstructionMaterialsPrice + industrialMachinesCost × localIndustrialMachinesPrice)`, where production loss uses recipe wear, the asymmetrical condition scaler, condition-decay upgrades, and overstaffing wear.
- Completion applies output multipliers, records categorized input/output flow and lifetime output, and creates a zero-cash Finance performance entry at current local price. Contribution margin excludes maintenance and capital; operating profit subtracts output source cost, staff wages, and staffing/training expense; actual repair settlements remain visible as maintenance; investment-adjusted result also subtracts period construction/upgrades.
- Each facility is an independent numbered instance with a paused/resumable, ordered, repeating cycle of researched recipes. Missing inputs stall at cycle boundaries. Exact recipes and dependencies are in [VariableRelationshipMap.md](VariableRelationshipMap.md).
- Construction consumes land euros, Construction Materials, and Industrial Machines. Missing construction/upgrade/repair inputs may be bought from the local market only when the full cash requirement is affordable.
- Upgrade cost is `ceil(baseUpgradeCost × 1.5^currentLevel)` euros plus each construction input at `baseRequirement × 0.2 × 1.5^currentLevel`; fractional resource costs are valid.
- Speed work multiplier: `1 + 0.8 × (1 - e^(-0.22 × speedLevel))`. Output multiplier: `1 + 1.5 × (1 - e^(-0.18 × outputLevel))`.
- Required workers: `baseWorkers + speedLevel + outputLevel + ceil(baseWorkers × 1.15^(speedLevel + outputLevel) - baseWorkers)`. Available workers are assigned workers not currently training; zero available workers contribute zero staffing efficiency. Worker staffing efficiency is `0.01 + 0.99 × ratio^1.6` at/below target and `1 + 0.25 × (1 - e^(-0.7 × (ratio - 1)))` above it, multiplied by wage efficiency and Staff Quality's work multiplier. For wage ratio `r = min(100, wage/baseWage)`, wage efficiency is `(e^(3r) - 1)/(e^3 - 1)` through the base wage and `1 + 9 × asymmetricalScaler((r - 1)/99)` above it.
- Staff wages are charged before each foreground production step. When the charge cannot be paid, production, staff training time, and wage-driven Staff Quality/experience progression pause; unpaid training retains its remaining duration. Repair may overlap staffing and training; staffing and training remain mutually exclusive. Hiring and firing use timed wage-based costs, and firing removes the fired workers' proportional share of pooled facility knowledge.
- Each assigned worker costs the player-set wage per foreground minute. The proportional charge is recorded each foreground step; if it cannot be paid, that facility pauses before production work.
- Condition starts at 1. Passive loss is `1/1,200` per facility-minute. Each completed recipe loses `(requiredWork/1,200 + 0.05/1,200) × recipeWearMultiplier`; both losses use the asymmetrical condition scaler and the overstaffing multiplier `1.5^(staffingRatio - 1)`.
- Condition upgrades reduce wear by `1 - 0.75 × (1 - e^(-0.18 × conditionUpgradeLevel))` without increasing workers. Facility efficiency is staffing efficiency × condition efficiency.
- Repair to a selected higher target costs each construction input `constructionCost × 0.45 × (target - current)`; cash uses land cost. Auto-repair uses the same costs, Finance maintenance entry, statistics, and flow, but only during foreground steps and within the Repair Technician facility limit.
- Effective work is `(baseWork + requiredWorkers × 0.1 × stepMs/60,000 × staffingEfficiency) × conditionEfficiency × speedMultiplier × recipeResearchMultiplier`.

### Economy Evidence

Run `npm run economy:report` for report-only recipe windows and connected-chain diagnostics. Read [handoffs/economy-balance.md](handoffs/economy-balance.md) before changing balance; the report is not runtime state and does not model every player system.

## Market

- Price is `benchmarkSupply / max(supply, 1) × marketQuality`. Catalogue entries also own logistics/value-density multipliers; local supply/benchmark begin at 1/100, 1/20, or 1/10 of regional values by price tier, while regional initial supply is the diffusion rate base.
- Adjacent pools diffuse every five foreground seconds. Raw request is `rateBaseSupply / divisor × priceGap × (1 + priceGap)^curvature × logisticsMultiplier × valueDensityMultiplier × localRegionalResearchMultiplier`, where `priceGap = max(lowerPrice / higherPrice, higherPrice / lowerPrice) - 1`; elapsed-time, equilibrium, and source-supply caps apply. Diffusion research changes only local↔regional raw rate and uses the configured 1.15×–4.00× tiers.
- Local Market Network tiers create persisted, concurrent foreground activations. Each tier adds `0.05 × original local supply` and matching benchmark capacity per foreground minute until its own increment is exhausted; activations stack and do not replace diffusion.
- Inventory and market additions mix quality and source cost by quantity. Market purchases use executed price; facility output uses captured input cost plus production-maintenance allocation. Selling uses inventory Q as a price multiplier and mixes Q into local stock; customer fulfilment adds goods to global stock.
- Each resource has a saved five-second-default autotrade interval. Autobuy respects access, cash, supply, inventory targets, and price caps; autosell respects rate, minimum keep, and minimum price. Resource Flow records market, order, construction/upgrade/repair spending, rewards, and production changes.

## Finance, Sales, and Progression

- Finance stores signed typed transactions, nested details, logical timestamps, loans, lender portfolios/searches, economy phase, and payment history. Reports use foreground windows of 1 minute, 15 minutes, 1 hour, 10 hours, 24 hours, or all time.
- Assets are derived: cash + inventory at current local prices + facilities at historical capital × `max(0.1, condition)` + completed research at configured cost. Replacement value and market revaluation are informational; repairs remain maintenance.
- Loan offers are deterministic per-company lender portfolios. Searches accept lender type, €50–€1,000,000 amount, 5–1,440-minute term, and 1–10 offer count; regular searches charge `€10 + €25 × activeParameterCount × selectivityMultiplier^1.25` and become foreground activities. Accepted loans use amortized foreground-minute payments, fee-inclusive 52-cycle cost, extra-payment fees, and bounded prepayment penalties. Misses escalate at 1/3/6/10 payments through warning, surcharge/prestige loss, forced liquidation, then default/blacklist/Collections Recovery. Forced recovery pays 55% of current inventory/facility value, capped at 50% of pre-collection assets.
- Prestige is derived from a permanent balance event and foreground-time-decaying fulfilled-sales events. Achievements evaluate post-command state and create idempotent `achievement:<id>` prestige events.
- Customer acquisition rolls every foreground simulation step. Its per-minute rate is `100% × prestige discovery × open-order penalty × inventory readiness × economy frequency`; it is zero only when no offerable resource exists or capacity is full. The UI pipeline is expected-arrival progress, not a countdown.
- An order is a locked atomic bundle. Quantity is `roundUp(lineTargetValue × globalSupplyVolumeMultiplier / bidUnitPrice, standardLot)`. Its target is scaled by `1 + 3 × prestige/(prestige + 250)` and `1 + 0.2 × relationship`, bounded by `max(€100, companyAssets × OrderScopeFraction)`, and adjusted by bounded global pressure (shortage ≤1.12×; oversupply ≤1.30×). Customer type/domain restrict resources; research controls capacity, targeting, bid, bundle maturity, and relationship effects. Fulfilment is all-or-nothing; orders may request currently unheld resources.
- Research starts only when all gates pass and charges its full cost. Active projects run independently up to capacity; cancellation refunds the recorded cost. Completion applies one effect once. Recipe unlock/work-speed research uses three times its base duration; the first-facility grant can make the first recipe free and ten times faster.
- Quality research is unlimited per resource. Level `n` costs `€100 × 1.12^(n - 1)` and takes `30 seconds × 1.08^(n - 1)`. Output Q is `min(InputMaxQ, ResearchMaxQ, UpgradeMaxQ, ProductionMaxQ)`; research/facility levels use `Q(progress) = min(99.999999, 1 + 98.999999 × (1 - e^(-ln(99/98) × progress^1.1)))`, and lifetime output uses `progress = (lifetimeOutput/100)^0.5`. Q never reaches 100.

## Foreground Time

1. `TimeManager` measures active wall time from `lastObservedAtMs`.
2. `advanceGameTime` splits it into one-second steps and advances logical time/pipeline.
3. Each step applies passive facility wear, market-network activation, autotrade, production, auto-repair, sales acquisition/expiry/relationships, market diffusion, and active research.
4. Production completion updates flow, Finance performance, lifetime output, and achievement checks in post-command order.
5. Completed foreground minutes process loan repayments and economy transitions; customer offers are attempted per step.
6. Fast-forward first processes real foreground time, then simulates 60 seconds through the same path.
7. Background processes the final active interval and saves; resume resets the observation anchor. Inactive time awards no work, offers, research, or prestige decay.

Offline catch-up is deferred.

## Save Lifecycle

| Event | Behavior |
|---|---|
| Normal change | Batch the current company snapshot for up to five seconds. |
| Checkpoint/background | Process final foreground time, then flush one snapshot. |
| Launch | Restore device session and valid active-company snapshot; apply no catch-up. |
| Switch/logout | Flush outgoing company; logout clears selected session only. |
| Invalid snapshot | Start that company fresh; preserve other company saves. |
| Delete company | Delete company, save, tutorial rows, and return to selection. |
| Clear local data | Delete all local profiles, companies, saves, tutorials, and session; retain empty schema. |

No save compatibility layer exists. Missing current fields or incompatible persisted gameplay units invalidate the old company save.
