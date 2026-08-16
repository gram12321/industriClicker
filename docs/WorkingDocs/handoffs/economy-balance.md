# Handoff: Economy Balance Analysis

## Goal

Maintain a deliberate, playable economy as facilities, recipes, resources, repair rules, and upgrades change during development and beta. Use the economy report to identify *which layer* changed, recommend the smallest suitable balance lever, and avoid treating an artificial stress test as literal player behaviour.

This handoff is for analysis and proposals first. Do not change balance numbers until the current report, the runtime rule, and the scenario being judged agree.

## Product Decisions To Preserve

- A recipe should be profitable at initial prices when it is intended to be available.
- Continuous selling of one resource into an otherwise inactive market is a **market-saturation stress test**, not the normal late-game player loop. Some recipes may become unprofitable in that test over time.
- Players are expected to counter local saturation through diversified production, consuming resources in downstream chains, construction, contracts, and market-network research.
- Local volatility is intentional, especially for cheap resources. Do not make all markets deep or all prices flat merely to improve a single-output report row.
- Local Market Network and Market Diffusion Network are progression tools that extend market resilience. They are not the primary fix for an intrinsically unprofitable recipe.
- Construction Materials and Industrial Machines are genuine construction/upgrade/repair inputs. Do not add a synthetic permanent demand sink just to make a report result positive.

## How to read the economy report

This is the canonical guidance for any agent using [economy-report.md](../../../economy-report.md).

- Primary signal: recipe-window profitability is the key balance gate. A recipe that remains healthy in its standalone window is more important than a chain row that looks weak in a combined 180-minute scenario.
- Secondary signal: chain totals are a yellow warning layer for bottlenecks, network friction, and supply-chain fragility. They are not the first-pass verdict on a recipe.
- Report scope: the simulator does not include Customer sales, market pricing beyond the local static model, upgrade effects, or runtime prestige/relationship boosts. Treat it as a conservative base-case economy test.
- Upgrade nuance: output and reliability upgrades can make the player’s real result better than the test suggests. Speed upgrades can make the real-game case worse, because faster cycles increase output and accelerate saturation.
- Interpretation rule: a chain can be acceptable even when its combined 180-minute run is weak, if its component recipes remain viable and the chain is mainly a staging or convenience route. The reverse is also true: a chain can look red while the underlying individual recipes are still responsible and useful.

When a balance question comes up, read this file first and then the report. Do not treat chain totals as the decisive signal when recipe windows are the more direct evidence.

## Current Economy Model

Read [gameflow.md](../gameflow.md), [design.md](../design.md), and the current constants before proposing changes. The high-impact model is currently:

- Markets have local, regional, and global pools. Local and regional/global pairs diffuse every five foreground seconds.
- Local Market Network expands local depth while preserving its immediate price. Market Diffusion Network increases only local-regional diffusion. Both have ten research tiers.
- Facilities need land, Construction Materials, and Industrial Machines to build.
- Facilities lose condition from passive time, recipe work, and completed cycles. Condition loss remains nonlinear through the facility condition curve.
- A repair at the 70% threshold costs `0.9 x missing condition` of each facility's land value (cash), Construction Materials, and Industrial Machines.
- Every speed, output, or condition upgrade costs euros plus Construction Materials and Industrial Machines. The currency cost grows by `1.5^level`; each resource cost starts at 20% of the facility's respective construction-input requirement and uses the same growth curve.
- Speed and output improve production but also raise worker requirements. Condition upgrades reduce both wear sources and are separate from speed/output.

Authoritative balance locations:

| Lever | Primary location |
| --- | --- |
| Resource benchmark prices, local/regional/global pool depth, logistics/value density | `game/resources/resourceConstants.ts` |
| Recipe inputs, outputs, required work, recipe wear multiplier | `game/recipes/recipeConstants.ts` |
| Facility land, Construction Materials, Industrial Machines, workers, upgrade base, global wear values | `game/facilities/facilityConstants.ts` |
| Upgrade cost/growth/resource requirement and bonus curves | `game/facilities/facilityUpgrades.ts` |
| Live repair/upgrade affordability and automatic local purchases | `game/core/stores/gameStore.ts` |
| Diffusion formulas and market price formation | `game/market/` |
| Market-network and recipe research costs/effects | `game/research/researchConstants.ts` and `game/research/` |

## Economy Report: What It Answers

Run:

```powershell
npm run economy:report
```

The generated [economy-report.md](../../../economy-report.md) has several deliberately different diagnostics.

| Section | Valid interpretation | Do not infer |
| --- | --- | --- |
| Recipe windows | One fully staffed facility buys inputs locally and sells output locally. It exposes intrinsic initial margin, short-run margin, maintenance, local-price pressure, break-even, and payback. Baseline and Networks III are both shown. | That a late-chain recipe is bad because it fails after 180 minutes of selling only itself. |
| Connected-chain economy | A fixed set of facilities shares a base market and inventory. Upstream output is available before downstream work; the following minute's inputs are retained and all other produced goods are sold. Construction input demand is spread over the 180-minute run as an external construction programme. A stalled chain is invalid. | A full player/company simulator, or a forecast of every possible facility mix. |

### Key fields

- `initialMargin`: full-cycle initial-price rate after expected maintenance. It is the primary intrinsic-margin signal.
- `margin15m`, `margin60m`, `margin180m`: average realised operating margin in the stated run, including input purchases and repair liability.
- `outputPriceDrop*`: local output-price pressure from the isolated sales scenario.
- `breakEven`: first completed output cycle whose operating margin is non-positive. It is not facility-investment payback.
- `payback`: first minute cumulative operating profit reaches the simulator's investment definition for that scenario.
- `maintenance60m`: realised repair spend plus outstanding repair liability over the 60-minute run.

## Report Integrity Checklist (Required After Rule Changes)

The report is test support, not runtime code:

- Simulator: `tests/support/recipeEconomy.ts`
- Report generator: `tests/facilities/recipeEconomy.report.test.ts`
- Command wrapper: `tools/runRecipeEconomyReport.mjs`

Whenever a balance-affecting runtime rule changes, first compare it with these test-support files. Update the report model and focused tests before interpreting its numbers. In particular check:

1. Facility construction investment includes every required construction input at current local prices.
2. Upgrade investment includes the euro cost plus every upgrade resource at current local prices.
3. Initial expected maintenance, realised repair spend, and outstanding repair liability all use the same repair inputs and formula as runtime.
4. Chain construction demand includes every construction input that a participating facility requires.
5. Production cycles, output multiplicity, input consumption, staffing, recipe research, and diffusion order match runtime behaviour.

## Balance Targets

Use these as directional targets, then record approved replacements here or in `design.md`.

| Scenario | Desired outcome |
| --- | --- |
| Initial intended recipe | Positive intrinsic margin after input and maintenance cost. |
| 15-minute isolated sale | Positive for almost all intended recipes. |
| 60-minute isolated sale | Positive for most recipes; a few saturation-sensitive basics are acceptable. |
| 180-minute isolated sale | May be negative for specialised goods. Diagnose it as saturation, not an automatic recipe failure. |
| Connected chain | Later chains should show worthwhile net EUR/minute and plausible payback after facility and recipe-research investment. Include the construction inputs that the chain creates demand for. |
| Facility plus recipe research | Most intended paths should repay in roughly 1-3 healthy play hours under an appropriate scenario. |
| Early useful upgrades | Aim for approximately 30-90 minutes of payback under a healthy, appropriate market scenario. Later levels may deliberately take longer, but their role must be stated. |
| Market-network research | Tier I/early tiers should materially improve recipe-window resilience; high tiers may be strategic/endgame rather than short-session payback. |

## Diagnosis Before Touching A Lever

Classify the failing result first.

| Observed result | Likely layer | Preferred first lever |
| --- | --- | --- |
| Negative `initialMargin` | Intrinsic recipe economics or repair cost | Targeted output/input/work adjustment; then targeted facility capex or repair-input requirement. |
| Good initial margin, rapid isolated price decline | Market saturation | Leave as intentional if the resource has real downstream use; otherwise assess local depth/diffusion, output rate, or a missing consumer scenario. |
| Good chain operating margin, poor payback | Capital burden | Facility land/construction-input cost, recipe unlock cost, or upgrade cost - not output price first. |
| Poor operating margin and high `maintenance60m` | Wear/repair burden | Confirm report/runtime parity, then target wear rate, recipe wear multiplier, repair factor, or construction-input cost. Preserve nonlinear condition. |
| Upgrade does not repay | Upgrade price/resource curve versus added output/speed, and added staffing requirement | Review the specific level and track; do not lower every recipe price or decay rate. |
| Network upgrade improves a recipe but not enough to justify its role | Research cost curve or scenario coverage | Check the intended recipe-window and chain scenarios before changing diffusion physics. |
| A construction good collapses in isolated sales but works in chains | Expected missing demand in stress test | Keep the isolated row as a warning only; expand the representative chain scenario if needed. |

## Preferred Lever Order

For a specific failing recipe or chain, prefer narrow changes in this order:

1. Correct a simulator/runtime mismatch.
2. Adjust that recipe's output amount, input amount, required work, or recipe wear multiplier.
3. Adjust the affected facility's land, Construction Materials, Industrial Machines, or recipe-unlock cost when the issue is payback rather than ongoing margin.
4. Adjust repair-input factor or wear only when maintenance is demonstrably the cause; do not flatten the nonlinear condition system.
5. Adjust a specific upgrade track's euro/resource cost or effect when its own payback is the issue.
6. Adjust local market depth/diffusion research pricing or effect when the issue is saturation resilience.

Avoid these as the first response:

- Raising every resource benchmark price: it also raises downstream input, construction, repair, and upgrade costs.
- Broadly lowering all decay: it removes a deliberate operating cost and makes condition upgrades less meaningful.
- Changing diffusion to repair intrinsic recipe margins.
- Adding generic NPC demand, by-products, input-efficiency systems, or recipe-specialisation systems solely to repair a report row. They are potential future expansion levers, and can be suggested, but they are not baseline fixes.

## Recommended Agent Workflow

1. Inspect the latest balance-related diff and identify the rule layer changed.
2. Update report/test-support parity first, including a focused regression test for the changed formula.
3. Run `npm run economy:report`; compare only like-for-like scenarios with the prior report.
4. Summarize deltas by layer: intrinsic margin, maintenance, price pressure, capex/payback, and network resilience.
5. State whether a failure is intrinsic, saturation-only, capital-only, or a report-model gap.
6. Offer one or two narrowly scoped levers with expected trade-offs. Ask for approval before a broad rebalance.
7. After approved changes, run `npm run typecheck`, `npm test`, `npm run economy:report`, and `git diff --check`.

## Suggested Skills

- `skills/mobilegamedev-gram/SKILL.md` - required repository routing and documentation rules.
- `skills/best-practices/js-ts-best-practices/SKILL.md` - deterministic simulator, tests, and TypeScript changes.
- `skills/superpowers/brainstorming/SKILL.md` - when the requested target or player-facing economic role is unclear.
