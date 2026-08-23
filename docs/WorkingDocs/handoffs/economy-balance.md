# Handoff: Economy Balance Analysis

Use this handoff for economy-report interpretation and balance proposals. Runtime rules belong to [gameflow.md](../gameflow.md); exact values belong to the current constants.

## Guardrails

- Judge intended recipes by standalone recipe-window profitability first; connected-chain totals are secondary diagnostics.
- Isolated continuous selling is a market-saturation stress test, not the normal late-game loop. Diversification, downstream consumption, construction, customer orders, and network research are intended counters.
- Preserve local volatility, nonlinear condition/repair costs, and real Construction Materials/Industrial Machines demand.
- Do not add generic demand, by-products, input-efficiency, or specialisation only to repair one report row.
- The report excludes customer sales, runtime prestige/relationships, upgrade effects, and the full player/company simulator.

## Balance Authority

| Layer | Source |
|---|---|
| Resource prices, pools, logistics, value density | `game/resources/resourceConstants.ts` |
| Recipe inputs/outputs/work/wear | `game/recipes/recipeConstants.ts` |
| Facility construction, workers, wear, repair | `game/facilities/facilityConstants.ts`, `facilityEconomics.ts` |
| Upgrade costs/effects | `game/facilities/facilityUpgrades.ts` |
| Market prices/diffusion | `game/market/` |
| Research costs/effects | `game/research/researchConstants.ts`, `research.ts` |
| Report simulator | `tests/support/recipeEconomy.ts` |
| Report tests/generator | `tests/facilities/recipeEconomy.report.test.ts`, `tools/runRecipeEconomyReport.mjs` |

## Report Use

Run:

```powershell
npm run economy:report
```

- Recipe windows model one fully staffed facility buying inputs locally and selling output locally; compare 15/60/180-minute margins, maintenance, price pressure, break-even, and payback.
- Connected chains share a market, retain the next minute's inputs, sell other output, and spread construction demand over 180 minutes. A stalled chain is invalid.
- `initialMargin` is the primary intrinsic signal. `margin15m/60m/180m` include realised input, repair, and market effects. `breakEven` is operating margin, not capex payback. `payback` uses the simulator's investment definition.
- Network III is a resilience comparison; its research cost is not charged to facility payback. Test-only electricity-cap comparisons do not change runtime rules.

## Runtime/Report Parity Checklist

After a balance-affecting rule change, compare runtime and report support before reading numbers:

1. Facility construction and upgrades include all euro and construction-input costs.
2. Recipe inputs, outputs, work, staffing, research, diffusion order, and output multiplicity match.
3. Wear, repair threshold, repair inputs, realised repair spend, and outstanding liability match.
4. Chain demand includes every participating facility construction input.
5. Focused regression tests and the generated report are updated together.

## Diagnosis

| Result | First interpretation | First lever |
|---|---|---|
| Negative initial margin | Intrinsic recipe/repair issue | Narrow recipe output/input/work or repair lever |
| Fast isolated price decline | Saturation | Review downstream use, output rate, depth, or diffusion |
| Good margin, poor payback | Capital burden | Facility or recipe-research investment |
| High maintenance | Wear/repair burden | Verify parity, then targeted wear/repair factor |
| Upgrade does not repay | Track cost/effect/staffing mismatch | Adjust that track only |
| Chain red, components healthy | Stress-test bottleneck | Do not rebalance the recipe automatically |

Preferred lever order: fix parity, adjust the affected recipe, adjust capex/research cost, adjust repair/wear, adjust the affected upgrade, then adjust network resilience.

## Agent Workflow

1. Inspect the latest balance diff and classify its layer.
2. Update simulator parity and focused tests.
3. Run `npm run economy:report` and compare like-for-like scenarios.
4. Report intrinsic margin, maintenance, saturation, capex/payback, and network deltas.
5. Propose one or two narrow levers; ask before broad rebalance.
6. After approval, run the relevant typecheck/tests/report and `git diff --check`.
