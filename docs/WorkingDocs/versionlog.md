# Version Log - Industri Clicker

## AI Instructions For New Entries

### Goal

Write clear, factual release notes that explain what changed, where, and why it matters.

### Scope Rules

- Log only meaningful changes: features, refactors, balancing changes, architecture updates, major bug fixes, and documentation restructures.
- Skip trivial noise such as format-only edits, typos, and minor wording tweaks unless bundled with a meaningful change.
- Group related commits into one entry only when they represent one logical change.

### Evidence Rules

- Use actual repository data before writing: commit hash(es), changed files, and basic stats.
- Review each commit patch before writing its behavior summary:
  - single commit: `git show --no-color <commit>`
  - grouped commits: run the same command for each commit.
- Do not guess file changes or claim behavior/mechanics that are not visible in the reviewed diff.
- If commits are grouped, list each commit hash in the entry header.

### Entry Format (Required)

```md
## Version <tag> - <short title>
**Date:** YYYY-MM-DD | **Commit(s):** <hash or comma-separated hashes> | **Stats:** <additions/deletions summary>

### Summary
- 1-3 bullets describing intent and outcome.

### Changes
- `path/to/file.ts` - what changed and why it matters.
- **NEW FILE:** `path/to/newFile.ts` (<line count> lines) - purpose.
- **REMOVED:** `path/to/oldFile.ts` - reason removed/replaced.

### Notes
- Migration, compatibility, balancing impact, follow-up items, or known limitations.
```

### Writing Rules

- Keep entries concrete and technical.
- Prefer file paths over vague descriptions.
- Use `NEW FILE` and `REMOVED` markers exactly.
- Call out architecture decisions and intentional deviations from earlier plans when relevant.

### Ordering

- Newest entry goes at the top below this instruction section.
- Keep entries in reverse chronological order.

### Archive Procedure

- Keep the newest complete entries in this file.
- When this file would exceed 300 lines, move the oldest complete entries beyond that limit to [oldversionslog.md](oldversionslog.md).
- Preserve archived entries unchanged; continue adding new entries here and keep the active log in reverse chronological order.

---

## Version 0.00045 through 0.00044 - Facility accounting and repair automation
**Date:** 2026-08-22 | **Commit(s):** 1f57256298edd556226b86ab7252e12078a90c97, d89db4ebfdffce5fc96ef363a1d5a6806372060c | **Stats:** +1043 / -209

### Summary

- Added Finance-owned facility accounting for historical construction, upgrades, maintenance, production output value, direct input cost, operating profit, and investment-adjusted results.
- Captured direct-material source cost and quality at production input consumption, then recorded facility performance on completed cycles and exposed the breakdown in Finance, Facility, and Inventory views.
- Added Repair Technician research, per-facility repair thresholds and targets, automatic repair during foreground ticks, and target-condition manual repairs.

### Changes

- `game/finance/finance.ts`, `financeConstants.ts`, and `financeStatements.ts` - Added facility accounting/performance metadata, historical book-value calculations, market revaluation, and rolling facility-performance reporting.
- `game/facilities/facility.ts`, `facilityEconomics.ts`, `facilityProduction.ts`, and `game/core/state/gameSnapshot.ts` - Persisted recipe source cost, calculated contribution economics, attached facility IDs and source costs to production output, and tightened snapshot validation.
- `game/core/stores/gameStore.ts` and `game/inventory/inventory.ts` - Recorded construction, upgrade, repair, and production transactions together with direct-material source costs and resource-flow effects.
- `game/research/`, `ui/dashboard/views/FacilityView.tsx`, `FinanceView.tsx`, `GameView.tsx`, `InventoryView.tsx`, and facility dialogs - Added Repair Technician progression, repair controls, auto-repair configuration, facility accounting detail, and source-cost presentation.
- `tests/core/`, `tests/facilities/`, `tests/finance/`, and `tests/inventory/` - Added regression coverage for source-cost capture, facility accounting, repair targets, and related state changes.

### Notes

- Facility book value uses recorded historical capital investment multiplied by current condition; current-market replacement value and revaluation remain informational.
- Repairs continue to consume euros, Construction Materials, and Industrial Machines. Auto-repair is foreground-only and limited by completed Repair Technician research.

---

## Version 0.00043 through 0.000375 - Sales orders, customers, and offer balancing
**Date:** 2026-08-22 | **Commit(s):** 8ba3a7aa9b9cebbde323238c7803b814a4faeb18, 2b8e9933f5c3d1eee776973c320b3c1f459df172, 04e7e8f7d715e42f8fd0be4159c6b094477be467, 842dc584ed36c4ff974d99de3d78017ae9d24237, 3f97212946973c53ee2651e0d55329f0173d9fdf, c6db01e435eec492732093eaa279b3d7ecdfb598, 65fdecec2ff14ceb5e577b181ca1948efb0b12f9, fd2981eba7939e31f77baddc6a82aeabd6bada49, dfbbfa7b83036dc2b6121d21d7c1f274146989c1, de2c17633f694ea00347e24f07e2638557fa6c6e | **Stats:** +1562 / -951

### Summary

- Reworked customer-order acquisition into a continuous foreground-rate model using company assets, inventory value readiness, offerable resources, customer maturity, and cap-safe fallback generation.
- Added deterministic customer names, catalogue version 3, customer accessibility and size-fit rules, improved bid/premium and bundle balancing, and sales-related achievement/research progression.
- Refined Sales, IndustriPedia, Prestige, active-process, admin, and facility-economics presentation around customer orders and quality-aware market comparisons.

### Changes

- **NEW FILE:** `game/sales/salesCustomerNameConstants.ts` (30 lines) and `game/sales/salesCustomerNames.ts` (22 lines) - Added deterministic customer-name vocabularies based on customer type and home domain.
- `game/sales/salesConstants.ts`, `salesCustomers.ts`, `salesOrders.ts`, and `salesOrderAcquisition.ts` - Added customer-size fitting, accessibility, inventory-value readiness, partial-lot behavior, offer diagnostics, prestige/economy curves, and order terminology cleanup.
- `game/core/stores/gameStore.ts`, `game/prestige/`, `game/research/`, and `game/achievements/` - Connected continuous order generation, quality-adjusted fulfilment values, order achievements, and order-gated research to runtime state.
- `app/index.tsx`, `ui/dashboard/views/SalesView.tsx`, `ui/dashboard/views/FacilityView.tsx`, `ui/dashboard/views/userpages/IndustriPediaView.tsx`, `ui/dashboard/components/ActiveProcessesOverlay.tsx`, and related cards/dialogs - Added customer navigation, order diagnostics, improved offer readouts, and customer/order presentation.
- `tests/sales/`, `tests/research/`, and `tests/facilities/facilityProduction.test.ts` - Covered deterministic names, customer selection, offer readiness, order sizing, premiums, fulfilment, and quality-aware recipe economics.
- **REMOVED:** `olditerations/Readme_hackandslash.md`, `olditerations/readmeOffice.md`, and `olditerations/readme_winemaker.md` - Removed predecessor readmes that were no longer needed in the active repository.

### Notes

- The customer catalogue remains deterministic and device-local; there is no shared customer service or backend.
- Orders remain company-specific atomic bundles. The catalogue version changed to 3, and no compatibility migration was added for earlier local customer identities.

---

## Version CI - Android APK workflow
**Date:** 2026-08-21 | **Commit(s):** 9073ac8009cec613e9a1d89b41600dd65b037c06, cbdc02df2c4829edb2c59539d3985a2de8d3df3b | **Stats:** +92 / -0

### Summary

- Added a manually triggered GitHub Actions workflow for building the preview Android APK locally with EAS.
- Uploaded the resulting APK as a workflow artifact for device installation and inspection.

### Changes

- **NEW FILE:** `.github/workflows/android-apk.yml` (46 lines) - Checks out the repository, installs Node and Java, runs the Expo/EAS Android preview build with `EXPO_TOKEN`, and uploads the APK artifact.

### Notes

- The workflow requires the repository's `EXPO_TOKEN` secret and uses the existing `preview` EAS profile. It does not add a backend or change the product's Android-first release boundary.

---

## Version 0.000414 through 0.00040 - Quality progression and production ceilings
**Date:** 2026-08-21 | **Commit(s):** 8f86efc725750e967d878393fe0ef1fa65e9e80e, ca25b041eea4d85c9ba1e9b00c2c431829f84a46, 4965772ed4ad4c4deb859b74282a22a5acd16dea, 333850272281a589fc1cb847ffac1cdfb851e726, fa2484d4e7ad5c7ac15557f2fbca34014a474fa1, 3c5a7d4f39d1fdbaa859348b0e54f6aad9cdc3e0, 622c5b1897307b77e7cb315d90c80040a99ca5b9, d4551058cfe563c03611f98cd84be3edb35e8a1e | **Stats:** +1176 / -391

### Summary

- Established the shared quality domain and the canonical four-ceiling production model: weighted input quality, resource research maximum, facility upgrade maximum, and lifetime-production maximum.
- Added quantity-weighted quality to market reservoirs and sales, unlimited per-resource quality research, per-facility quality upgrades, and quality-aware facility economics.
- Refined quality displays, upgrade projections, snapshot validation, and automated coverage for the quality formulas and production integration.

### Changes

- **NEW FILE:** `game/quality/index.ts` (2 lines), `game/quality/qualityConstants.ts` (16 lines), and `game/quality/qualityMath.ts` (66 lines) - Added the public quality module, balance values, ceiling calculations, and output-quality breakdowns.
- **NEW FILE:** `tests/quality/qualityMath.test.ts` (45 lines) - Added focused coverage for quality limits and output resolution.
- `game/market/`, `game/inventory/resourceFlow.ts`, `game/facilities/`, `game/research/`, `game/core/stores/gameStore.ts`, and `game/finance/financeStatements.ts` - Connected quality mixing, research, upgrades, production output, and quality-adjusted value calculations.
- `ui/dashboard/views/FacilityView.tsx`, `ResearchView.tsx`, `FinanceView.tsx`, `InventoryView.tsx`, `IndustriPediaView.tsx`, and supporting styles/helpers - Added quality-limit explanations, output-quality previews, research icons, and upgrade value projections.
- `docs/WorkingDocs/CONTEXT.md`, `PROJECT_INFO.md`, `VariableRelationshipMap.md`, `design.md`, and `gameflow.md` - Documented quality ownership, formulas, and the new production constraints.

### Notes

- New inventory and market entries still start at Q1. Quality affects sale value and reservoir mixing, while production output is bounded by all applicable ceilings and never reaches the research chain's asymptote automatically.

---

## Version 0.000418 through 0.00041 - Tutorial progression and onboarding
**Date:** 2026-08-20 | **Commit(s):** 3fcaa256e47ebcda8e7ccfb1538e5366ddd6a0bf, be46de02f163a818d9d3281ae60c0bfced9959cd, ab73717e46d0a807b0fb539ef162446fb89d2e46, 6ccc679d425db70fb1880f6cd849bb167dd34122, 934e6bd1285e9f1a63e1c9e5feb338d711968adb, b896ec01609e767bd84148d0a07f20860bfbd472, b49c5d61098c4eda117718b266c267c961e51ff8, 3697d3b8a525a6d2a1550cd9e39579c02fb5bfcd, a02e65a7db8a7121d59015d36044e50b323515ad, efa732d02fb212bc083c2044f9a5958972c251d0, c3e3fca643181cc224acc3444f315a81f6f5a697 | **Stats:** +2541 / -479

### Summary

- Expanded onboarding from company orientation into facility construction, facility choice and confirmation, first-facility inspection, recipe research, production cycles, automation, recipe economics, and inventory.
- Added tutorial spotlights, focus layouts, scroll-aware stages, active-process guidance, navigation/replay/dismissal handling, and a complete inventory transition.
- Refactored the tutorial dialog into reusable presentation pieces and added stage-sequencing tests.

### Changes

- `app/index.tsx`, `ui/dashboard/components/dialog/TutorialDialog.tsx`, `ui/dashboard/views/FacilityView.tsx`, `GameView.tsx`, and `InventoryView.tsx` - Added the expanded stage machine, highlighted targets, recipe/automation/economics guidance, and inventory tutorial flow.
- `ui/dashboard/components/ActiveProcessesOverlay.tsx` and dashboard styles - Added tutorial-specific process visibility, focus states, and narrow-screen presentation support.
- `game/tutorial/tutorialState.ts` and `tests/tutorial/tutorialState.test.ts` - Extended and verified the first-facility and inventory-transition stage order.
- `readme.md` - Recorded the repository's focused-test execution limitation while the tutorial economy step was added.

### Notes

- Tutorial progress remains local to the company/device session and does not change the underlying production or research rules.

---

## Version 0.000415 through 0.00042 - State ownership and local persistence cleanup
**Date:** 2026-08-20 | **Commit(s):** 41b32642b27f1317a810e98ecdfac0109e05406d, 899d243c6851ac1f909ce36f19a892a2c8ab45ef | **Stats:** +377 / -275

### Summary

- Isolated tutorial state, local database access, company game-save persistence, dashboard state composition, facility command helpers, and Finance view memoization into clearer owning modules.
- Added explicit local SQLite tables and repositories for tutorial state and current company game saves.
- Reduced the route shell's direct Zustand wiring while keeping leaf dashboard views prop-driven.

### Changes

- **NEW FILE:** `game/core/persistence/localDatabase.ts` (16 lines), `game/core/persistence/gameSaveDatabase.ts` (39 lines), and `game/core/persistence/index.ts` (2 lines) - Added shared local-database setup and company game-save CRUD.
- **NEW FILE:** `game/tutorial/index.ts` (1 line), `game/tutorial/tutorialDatabase.ts` (33 lines), `game/tutorial/tutorialState.ts` (83 lines), and `tests/tutorial/tutorialState.test.ts` (44 lines) - Added tutorial state ownership, persistence, recovery helpers, and tests.
- **NEW FILE:** `game/facilities/facilityCommandService.ts` (13 lines), `ui/dashboard/hooks/useDashboardGameState.ts` (5 lines), and `ui/dashboard/views/finance/useFinanceStatementData.ts` (10 lines) - Separated facility material commands, dashboard state composition, and Finance statement derivation.
- `app/_layout.tsx`, `app/index.tsx`, `game/company/`, `game/core/`, `game/index.ts`, `game/facilities/`, `game/sales/`, and Finance views - Routed persistence and state through the new ownership boundaries.

### Notes

- This remains local-first SQLite persistence. No cloud sync, account service, or compatibility migration layer was introduced.

---

## Version 0.000382 - Balance evidence and verification guidance
**Date:** 2026-08-20 | **Commit(s):** 2d7a79863499de321c76f0f49496920c7755e046, 2e6d491b221f9fc4263b97792a62f2eefa00d88a, 87c00f525aee42e26cf26a20449a0ffe41abddb4 | **Stats:** +320 / -200

### Summary

- Retuned resource prices and recipe-economy evidence, then regenerated the balance report and focused report tests.
- Added canonical guidance for interpreting recipe-window profitability versus combined-chain warnings.
- Updated repository verification policy to prefer impact-based focused checks and removed stale market/recipe assertions that no longer matched the current model.

### Changes

- `game/resources/resourceConstants.ts`, `economy-report.md`, `tests/facilities/recipeEconomy.test.ts`, `recipeEconomy.report.test.ts`, `tests/market/market.test.ts`, and `tests/support/recipeEconomy.ts` - Updated balance inputs, generated evidence, and assertions.
- `docs/WorkingDocs/handoffs/economy-balance.md` and `docs/WorkingDocs/PROJECT_INFO.md` - Added the report-reading guide and linked it from the canonical documentation map.
- `AGENTS.md` and `readme.md` - Clarified focused/full verification boundaries and required production/recipe-balance checks.

### Notes

- `economy-report.md` is balancing evidence, not runtime game state. The report does not model customer sales, runtime prestige/relationships, or upgrade effects.

---

## Version X0.0001 - Market activation and slippage fixes
**Date:** 2026-08-19 | **Commit(s):** d99b2d6aefed1b665aa8790122e6a4249e10cb00, 1430e03af53743335c243f02e9dd5b4126c35726 | **Stats:** +232 / -41

### Summary

- Corrected quality-aware local sale quotes so execution uses supply slippage and autosell checks the executable quote against its minimum price.
- Added foreground activation for Local Market Network research, including concurrent persisted activations and progress presentation in Research.
- Repaired the local-market research chain and added market/store regression coverage.

### Changes

- `game/market/market.ts`, `marketConstants.ts`, `marketTypes.ts`, and `game/core/stores/gameStore.ts` - Added quote-based execution and saved local-market activation state.
- `game/research/researchEffects.ts` and `ui/dashboard/views/ResearchView.tsx` - Connected research completion to foreground market-depth activation and displayed activation progress.
- `tests/core/gameStore.test.ts` and `tests/market/market.test.ts` - Covered slippage-aware selling, autosell thresholds, activation timing, parallel activations, and snapshot restoration.

### Notes

- Market activation and diffusion remain foreground systems; offline time does not apply either process.

---

## Version 0.00042 through 0.00040 - Icon and tooltip accessibility polish
**Date:** 2026-08-17 | **Commit(s):** b4edd8d17a845a37bd8e6832cd89f5444f9dd422, d7aadd8cf0de73b05485b1705c8a5462f01672e4, 01d2275c7c27b2141b023972b3d16dfeccd23314 | **Stats:** +434 / -344

### Summary

- Added shared icon tooltips and an icon-tooltip provider for player-facing Material icons.
- Replaced ambiguous text glyphs and inconsistent icon usage across inventory, sales, research, facility, achievement, and IndustriPedia surfaces.
- Improved icon labels and accessibility metadata without changing gameplay rules.

### Changes

- **NEW FILE:** `ui/dashboard/components/IconTooltip.tsx` (50 lines) - Added reusable tooltip wrappers for Material, resource, and text icons.
- `icons.ts`, `ui/dashboard/components/`, `ui/dashboard/components/cards/`, `ui/dashboard/components/dialog/`, and dashboard views - Standardized icon maps, tooltip labels, and icon presentation across the dashboard.
- `app/_layout.tsx`, `app/index.tsx`, and `ui/index.ts` - Registered and exported the tooltip provider/components.

### Notes

- This is presentation and accessibility work only; no new persistence or game-system behavior was added.

---

## Version 0.000381 - Resource flow ownership and production statistics
**Date:** 2026-08-15 | **Commit(s):** d54b087f17550274d19bbca8783c42890e2cd99e, c04b087ff1d99c0ce235f71a3c308ca624fada54 | **Stats:** +533 / -172

### Summary

- Replaced the standalone production-statistics owner with a Resource Flow ledger that records categorized, signed inventory changes and lifetime facility output.
- Separated facility maintenance statistics from production totals and connected both owners to achievements, snapshots, UI, and tests.
- Updated sales acquisition to consume a structural production-statistics interface rather than a concrete achievement module.

### Changes

- **NEW FILE:** `game/inventory/resourceFlow.ts` (135 lines) and `game/facilities/facilityMaintenanceStatistics.ts` (43 lines) - Added the resource-flow ledger and facility-maintenance facts.
- **NEW FILE:** `tests/inventory/resourceFlow.test.ts` (37 lines), `tests/facilities/facilityMaintenanceStatistics.test.ts` (15 lines), and `tests/achievements/achievementEvaluator.test.ts` (27 lines) - Added focused coverage for flow aggregation, maintenance statistics, and achievement evaluation.
- **REMOVED:** `game/achievements/productionStatistics.ts` - Replaced the former production-statistics module with Resource Flow ownership.
- `game/core/state/gameSnapshot.ts`, `game/core/stores/gameStore.ts`, `game/achievements/`, `game/facilities/`, `game/inventory/`, app lifecycle files, and dashboard views - Connected the new ledgers and persisted snapshot shape.

### Notes

- Resource Flow is the source for lifetime facility output used by achievements and sales targeting; it is not an unbounded event log.

---

## Version 0.00038 - Facility upgrade and economics polish
**Date:** 2026-08-15 | **Commit(s):** ae2eb8885bef932acd595a7ffae4ee92047c7368 | **Stats:** +41 / -22

### Summary

- Changed Construction Materials and Industrial Machines upgrade costs to use the same exponential scaling without an artificial minimum-unit clamp.
- Added focused facility-upgrade coverage and refined facility, finance, IndustriPedia, and economy-phase presentation.

### Changes

- `game/facilities/facilityUpgrades.ts` - Allowed the configured fractional resource-cost curve to reach the UI and runtime calculations.
- **NEW FILE:** `tests/facilities/facilityUpgrades.test.ts` (9 lines) - Added coverage for upgrade resource-cost scaling.
- `app/index.tsx`, `ui/dashboard/helpers/dashboard.styles.ts`, `ui/dashboard/views/FacilityView.tsx`, `FinanceView.tsx`, `IndustriPediaView.tsx`, and working documents - Connected economy-phase context and refined related facility/finance presentation.

### Notes

- The change is a balance and presentation adjustment; the facility upgrade tracks and their material types remain unchanged.

---
