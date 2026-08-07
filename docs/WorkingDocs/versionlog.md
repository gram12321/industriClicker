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

---

## Version 0.00053e through 0.00053d - UI cleanup and polish
**Date:** 2026-07-30 | **Commit(s):** 5facb01ccd5f1c02e4861607f4fa09d020abf7a4, 53606e447df40299d33d95c0511e3554384d30fc, b4934e0ddeac55159bbdf9a34660859c80f4b2bb, 89d7573dcb96debead6f58e83e00c4483df92265, e146ca514776c7ce692b91cfdff22034a845c6e1 | **Stats:** +573 / -770

### Summary

- Refined the sales dashboard and icon presentation.
- Cleaned imports and extracted domain balance values into named constants.
- Removed obsolete UI and documentation code while keeping the active app flow coherent.

### Changes

- `ui/dashboard/views/SalesDashboard.tsx` and `ui/dashboard/dashboard.styles.ts` - Improved the sales dashboard layout and interaction presentation.
- `icons.ts`, `ui/dashboard/views/IndustriPediaDashboard.tsx`, and `ui/dashboard/views/InventoryDashboard.tsx` - Refined icon quality and corrected icon usage in the reference and inventory dashboards.
- `game/core/index.ts`, `game/index.ts`, `ui/index.ts`, and `game/core/stores/gameStore.ts` - Added and adopted public barrel surfaces while cleaning internal imports.
- `game/facilities/facilityConstants.ts`, `game/facilities/facilityUpgrades.ts`, `game/prestige/`, `game/sales/`, `game/core/time/timeConstants.ts`, and related `*Constants.ts` files - Moved balance and domain configuration into named constants modules.
- `game/core/persistence/gameSaveRepository.ts` and `game/core/state/gameSnapshot.ts` - Updated save and snapshot consumers during the store cleanup.
- `ui/dashboard/components/ContractRequestCard.tsx`, `DashboardDialogs.tsx`, and `InventoryControlCard.tsx` - Simplified dashboard components and corrected their imports.
- `docs/WorkingDocs/PROJECT_INFO.md`, `docs/WorkingDocs/gameflow.md`, `readme.md`, and `docs/plans/prestigeplan.md` - Updated implementation status, flow notes, and the prestige plan.

### Notes

- These commits were completed asynchronously and are grouped because they form one UI and code-cleanup pass.

---

## Version 0.00054 through 0.00053 - Prestige and reference content
**Date:** 2026-07-30 | **Commit(s):** e98cd740544c0bafbaeecee1e2c89f6cd3ea0953, 88bf69b0dd4d6b60a56914ffbb59bb5e9d2f875c, ea623abe5a39e3f0420a12313eec1fafc77f4304, 89309b43a2536c8c923c933e8322062c8160eade | **Stats:** +150 / -19

### Summary

- Improved prestige presentation and expanded Industripedia content.
- Tuned production UI and corrected a related production display issue.

### Changes

- `ui/dashboard/components/PrestigeDialog.tsx` - Improved the prestige dialog and its player-facing progression presentation.
- `ui/dashboard/views/IndustriPediaDashboard.tsx` and `ui/dashboard/helpers/recipeFormatters.ts` - Expanded Industripedia content and improved recipe formatting.
- `ui/dashboard/views/SalesDashboard.tsx` and `ui/dashboard/dashboard.styles.ts` - Tuned production/sales presentation and corrected the related layout behavior.
- `docs/WorkingDocs/AIpromt_docs.md`, `docs/WorkingDocs/PROJECT_INFO.md`, and `readme.md` - Updated the documentation references affected by the UI changes.

### Notes

- Grouped from the reviewed commits because all changes affect player-facing progression or production presentation.

---

## Version 0.0006 through 0.00052a - Admin and prestige systems
**Date:** 2026-07-30 | **Commit(s):** ac4d98560038b0c6bccafa9aa91926a6043d2136, 2d148d9ccacd593488228cd240ebfa789b366483, 4f6675907e649ff0307c25e6973aa1fd81af6a94, d7f3651d7a60eb0199eb85b67fc4fa5d3ba56240, 8635878eae3eee558e023ef5417b781343a0e86d, 95b17fcb2a10198cfea6a232deaf055ddb278ae1 | **Stats:** +982 / -114

### Summary

- Added admin inventory controls and expanded admin options.
- Added prestige progression and refined prestige timing, cost, and lifecycle behavior.
- Tuned constants and corrected the near-zero long-duration prestige calculation.

### Changes

- `ui/dashboard/views/AdminDashboard.tsx`, `ui/dashboard/components/InventoryControlCard.tsx`, `game/inventory/inventory.ts`, and `stores/gameStore.ts` - Added admin inventory controls and the state operations needed to set inventory values.
- `game/prestige/prestige.ts`, `game/prestige/prestigeCalculator.ts`, and `game/prestige/prestigeConstants.ts` - Added prestige progression calculations and tuned prestige constants.
- `ui/dashboard/components/PrestigeDialog.tsx` and `ui/dashboard/views/IndustriPediaDashboard.tsx` - Exposed prestige actions and status in the dashboard UI.
- `game/sales/salesContracts.ts`, `ui/dashboard/components/ContractRequestCard.tsx`, and `ui/dashboard/views/AdminDashboard.tsx` - Added admin contract-related options and controls.
- `app/index.tsx`, `app/_layout.tsx`, `utils.ts`, and `stores/gameStore.ts` - Connected the new admin and prestige behavior to application lifecycle and state handling.
- `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, `VariableRelationshipMap.md`, and `doc/prestigeplan.md` - Recorded the new progression, timing, and admin behavior.

### Notes

- These commits are grouped by the shared admin/progression domain despite their non-sequential version labels.

---

## Version 0.00051b through 0.00051 - Dashboard and administration
**Date:** 2026-07-30 | **Commit(s):** df9272a5c15b0bcbae38f28b160de4755c9da472, d9e00b959b3f82ac16f4f88cc71fa0c71cf145b9, 8d6ca64bb39db7e8761ee6ccdec9d59e9be82fdf | **Stats:** +573 / -662

### Summary

- Added the admin dashboard and reorganized the main dashboard UI.
- Fixed dashboard behavior and presentation issues discovered during the refactor.

### Changes

- `app/dashboard/DashboardContent.tsx`, `app/dashboard/DashboardView.tsx`, and `app/dashboard/AdminDashboard.tsx` - Split dashboard content and administration into dedicated route-level modules.
- `ui/dashboard/views/CompanyDashboard.tsx`, `FinanceDashboard.tsx`, `InventoryDashboard.tsx`, `ProductionDashboard.tsx`, `ProfileDashboard.tsx`, and `SalesDashboard.tsx` - Added and organized the dashboard views.
- `ui/dashboard/components/DashboardDialogs.tsx`, `DashboardViewComponents.tsx`, and `ResetCompanyCard.tsx` - Extracted shared dashboard controls, dialogs, and reset behavior.
- `ui/dashboard/helpers/devAdminGate.ts` and `recipeFormatters.ts` - Added development-only admin gating and shared recipe formatting.
- `app/_layout.tsx`, `app/index.tsx`, `stores/gameStore.ts`, and `docs/WorkingDocs/` - Connected the dashboard refactor to app state and updated flow documentation.

### Notes

- The commits are grouped because they are one dashboard/admin UI stream.

---

## Version 0.0005 through 0.00043 - Persistence and authoritative time
**Date:** 2026-07-29 | **Commit(s):** 316a1f59978ba18afb27dea8ec2d666cf36b8c23, 8deb33cd3409bcd64bd80e7ceaaa788dd693752d, 082c2f1ad1969716371f5f865aac2004cb022a60, cf3f9364655b0a5504b7bf0109bbda0df3fb4286 | **Stats:** +329 / -196

### Summary

- Removed persistence-version handling that was no longer part of the local save design.
- Made seconds the authoritative unit for elapsed time and corrected true-time progression.
- Added rejection handling for invalid contract progression.

### Changes

- `game/core/time/timeManager.ts` and `game/facilities/advanceProduction.ts` - Made elapsed seconds authoritative for production and realtime progression.
- `game/core/persistence/gameSaveRepository.ts`, `game/core/state/gameSnapshot.ts`, and `stores/gameStore.ts` - Adjusted local persistence and snapshot handling, including removal of the obsolete persistence version.
- `game/sales/salesContracts.ts` and `app/dashboard/DashboardContent.tsx` - Added contract rejection behavior and connected it to the dashboard flow.
- `app/_layout.tsx`, `app/index.tsx`, `app/index.styles.ts`, and `app/dashboard/DashboardContent.tsx` - Updated lifecycle and dashboard integration for true elapsed-time progression.
- `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, and `VariableRelationshipMap.md` - Documented the authoritative seconds model and persistence boundaries.

### Notes

- These commits establish the timing assumptions used by later production and prestige work.

---

## Version 0.00042 through 0.0004 - Sales progression
**Date:** 2026-07-29 | **Commit(s):** 55c8b85fd7d84d4c21e26bafc8931207810eacab, cedfd2a2917a07d3eca101fe161086068889ce50, 907c30e92a0482f5b95f1bde3793334d482fc783, 0c7f525dc44951e5b654ced800830af30e7be0bc | **Stats:** +688 / -79

### Summary

- Added customer progress indicators and sales probability behavior.
- Implemented sales progression and refined its probability mathematics.

### Changes

- `game/sales/salesContracts.ts` - Added customer sales contracts, progress state, and probability calculations.
- `game/core/math/scaling.ts` - Added the scaling helper used by sales probability math.
- `app/dashboard/DashboardContent.tsx`, `app/index.tsx`, and `app/index.styles.ts` - Added the sales interaction and customer progress-bar presentation.
- `app/_layout.tsx` and `stores/gameStore.ts` - Connected sales progression to realtime state updates and persistence.
- `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, and `VariableRelationshipMap.md` - Defined the sales terms, formulas, state ownership, and flow.

### Notes

- The commits are grouped because they build one continuous sales-system implementation.

---

## Version 0.00055 through 0.00031 - Facility UI and shared utilities
**Date:** 2026-07-29 | **Commit(s):** 975cd1c6342a5d8c72553f866cafde5e7dd76348, 1bf8f9646a5c8445fdb892392f187b9080f8ea9e, 27a4613ddfd605bd0f13826a32af50b29eed9fa3, a1eca2a112f0aaca70b8281351142e59fec4a4a3, 8f851f48e44e3af0dede35b02d84528c362690d4, 7d3fc85a82f4e066e6233d1f7d6c7171b3016098, f38089e393783fb4dcd685b066681be50ee81a09, a37e53e80e39651adc5f45990a57d1ac5827e565 | **Stats:** +1383 / -571

### Summary

- Improved the facility UI and added more facility and resource presentation.
- Introduced shared utility functions and migrated callers to them.
- Added speed/output improvements and fixed a small UI issue.

### Changes

- `app/dashboard/DashboardContent.tsx`, `app/dashboard/DashboardDialogs.tsx`, `app/dashboard/dashboardFormatters.ts`, and `app/index.tsx` - Refactored dashboard rendering, formatting, and dialog composition.
- `game/facilities/facility.ts`, `facilityRegistry.ts`, `facilityUpgrades.ts`, and `game/inventory/inventory.ts` - Added more facility/resource presentation and connected upgrade and inventory data.
- `game/facilities/advanceProduction.ts`, `game/recipes/recipes.ts`, `game/recipes/recipeTypes.ts`, `game/resources/resourceIcons.ts`, `resourcesRegistry.ts`, and `resourceTypes.ts` - Expanded facility production and resource catalogues.
- `utils.ts`, `app/dashboard/recipeFormatters.ts`, and `app/dashboard/dashboardFormatters.ts` - Added shared formatting and utility functions, then migrated dashboard callers to them.
- `game/core/math/scaling.ts` and `stores/gameStore.ts` - Centralized shared scaling and updated store integration.
- `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, and `VariableRelationshipMap.md` - Updated the domain documentation for the expanded facility UI and utilities.

### Notes

- This group combines the reviewed facility/UI and utility refactors; all eight commits are listed to preserve history.

---

## Version 0.0006c through 0.0006b - Documentation updates
**Date:** 2026-07-27 | **Commit(s):** 6666f358904de2e93efa7cfd35dc9791d9e79899, 60ffe219daea22962668afcfcadd0f151106c6bd | **Stats:** +446 / -424

### Summary

- Updated the working documentation for the evolving facility and time systems.
- Corrected documentation structure and implementation descriptions.

### Changes

- `docs/WorkingDocs/PROJECT_INFO.md` - Updated the implementation map and current project status.
- `docs/WorkingDocs/AIpromt_docs.md`, `CONTEXT.md`, `design.md`, `gameflow.md`, and `VariableRelationshipMap.md` - Revised the AI guidance, glossary, product direction, system flow, and variable ownership documentation.
- `docs/WorkingDocs/versionlog.md` - Updated the release-history documentation itself.

### Notes

- These documentation commits are grouped because they update the same working-document surface.

---

## Version 0.00019b through 0.00019 - Tutorial flow
**Date:** 2026-08-06 | **Commit(s):** f9ae965dab8207231796174b9fcb0b9495d8f452, 888a43608d26b0b0b5fc46d7ce36b72b1b3376e5, b0e5754a2bec23485bf61d4b40923a67df63f001 | **Stats:** +91 / -50

### Summary

- Added the first tutorial flow and introduced tutorial guidance for new players.
- Added introductory visual assets and improved the tutorial's highlighted-area presentation.
- Connected tutorial state to company data and the admin/user dashboard context.

### Changes

- `ui/dashboard/components/TutorialGuideDialog.tsx` - Added the tutorial dialog, first-step guidance, and highlighted-area instructions.
- `ui/dashboard/helpers/dashboard.styles.ts` - Added styling for tutorial overlays and highlighted controls.
- `app/index.tsx` and `ui/dashboard/views/userpages/AdminDashboard.tsx` - Connected tutorial presentation to the app and dashboard flow.
- `game/company/companyDatabase.ts` and `game/company/companyTypes.ts` - Added the company data needed to support tutorial state and context.
- **NEW FILE:** `assets/simulucius/frontremovebg.png` and `assets/simulucius/withlaptop.png` - Added tutorial illustrations.

### Notes

- These commits form the initial tutorial implementation and are grouped despite their asynchronous commit order.

---

## Version 0.00018 - Sales UI gates
**Date:** 2026-08-05 | **Commit(s):** ecc25d36d9dbc9df26483207dc7b3093c10bc3db | **Stats:** +32 / -5

### Summary

- Added gated sales UI states so unavailable sales actions are visible with their requirements.
- Updated the sales view and contract state to expose gate information.

### Changes

- `game/sales/salesContracts.ts` - Added the sales gate state used by the UI.
- `ui/dashboard/views/SalesView.tsx` and `ui/dashboard/views/GameView.tsx` - Displayed gated sales actions in the player-facing flow.
- `ui/dashboard/helpers/dashboard.styles.ts` and `app/index.tsx` - Added the supporting styles and app integration.

### Notes

- The commit is a focused presentation and state change for sales availability.

---

## Version 0.00017 - Multiple facilities and documentation viewer fixes
**Date:** 2026-08-05 | **Commit(s):** 72a0427bacfd0a7fa8fffbee8555ca065afc2492 | **Stats:** +771 / -93

### Summary

- Allowed multiple facilities of the same type.
- Fixed viewing of Markdown documentation inside the app.
- Updated facility production, state snapshots, and dashboard dialogs for the expanded facility model.

### Changes

- `game/facilities/facility.ts`, `facilityCollection.ts`, `advanceProduction.ts`, `game/core/state/gameSnapshot.ts`, and `game/core/stores/gameStore.ts` - Updated facility identity, collection, production, and state handling to support repeated facility types.
- `ui/dashboard/components/DocumentationDialog.tsx`, `GameDialogs.tsx`, and `ui/dashboard/views/GameView.tsx` - Corrected the documentation viewer and related game dialogs.
- `app/index.tsx` - Integrated the revised facility and documentation behavior into the main app.
- `docs/WorkingDocs/CONTEXT.md`, `gameflow.md`, and `VariableRelationshipMap.md` - Documented the new facility and state relationships.
- `.tmp-web-export/` - Refreshed the generated web inspection assets and embedded documentation output.

### Notes

- This commit combines a gameplay data-model correction with its required UI and documentation updates.

---

## Version 0.00016 through 0.00015 - Deployment preparation
**Date:** 2026-08-05 | **Commit(s):** 1d4c9a667187723f7bf93d3e08036eb7c9654c65, 589360da7aaf37997cb46cc4510788668789df74 | **Stats:** +413 / -261

### Summary

- Corrected the package and generated bundle required for the deployment environment.
- Added deployment configuration and aligned the project structure with the deployable app.
- Updated public barrel exports and documented the deployment state.

### Changes

- `package.json`, `package-lock.json`, `metro.config.js`, `.tmp-web-export/`, and `app.json` - Updated package resolution, Metro configuration, app metadata, and generated web output.
- **NEW FILE:** `eas.json` - Added Expo Application Services deployment configuration.
- `game/core/`, `game/achievements/`, `game/company/`, `game/facilities/`, and related index files - Organized public exports and deployment-ready module boundaries.
- `docs/WorkingDocs/PROJECT_INFO.md` - Recorded the deployment setup and current project structure.

### Notes

- These commits prepare the existing game for deployment; they do not introduce a backend or cloud save system.

---

## Version 0.00014a through 0.00014 - Production UI
**Date:** 2026-08-04 | **Commit(s):** 7a9741d939fb74ec67b01dcc45a6f5ce28937bc8, ea25174fb26dbfb951fd9c3ef2fd940396be156e | **Stats:** +211 / -146

### Summary

- Added the dedicated production view and connected production information to the game UI.
- Improved facility production presentation, icons, layout, and dashboard navigation.

### Changes

- `ui/dashboard/views/ProductionView.tsx` and `ui/dashboard/views/GameView.tsx` - Added the production screen and connected it to the main game view.
- `ui/dashboard/helpers/dashboard.styles.ts` - Added production-specific layout and styling.
- `app/index.tsx`, `game/core/stores/gameStore.ts`, and `game/facilities/facility.ts` - Connected production state and facility data to the UI.
- `icons.ts` - Added or corrected production-related icon mappings.
- `docs/WorkingDocs/gameflow.md` - Updated the documented production flow.

### Notes

- The two commits are grouped because the second refines the production screen introduced by the first.

---

## Version 0.00013 through 0.00012 - Resources, construction materials, and market diffusion
**Date:** 2026-08-04 | **Commit(s):** 26d1841254d793102bf78be68b0193001f5a42b2, 2dce63fc61ab8902eec11d02fb69e95de316f3e4, 2f4459538b12956775d2bb94d987f21baeeeab8b, 8276b58f75f03e5342222716f7c2cf3e73831697, 9a86cd0917387058a767fa9ffe82dfbce4849761, 1211c6c34f18cc5a3ac16572901d4937760c57da | **Stats:** +1005 / -169

### Summary

- Added base resources, metals, construction materials, and their recipe relationships.
- Added the variable relationship map for tracking resource and facility dependencies.
- Introduced market diffusion and the first market model used by resource availability.
- Expanded IndustriPedia and resource formatting to expose the new catalogue.

### Changes

- `game/resources/resourceConstants.ts`, `resourceTypes.ts`, `game/recipes/recipeConstants.ts`, and `recipeTypes.ts` - Added the base resource and construction-material catalogue.
- `game/facilities/facilityConstants.ts` and `facilityTypes.ts` - Added construction costs and facility material relationships.
- `game/market/market.ts`, `marketDiffusion.ts`, `marketTypes.ts`, `marketConstants.ts`, and `game/market/index.ts` - Added market state, diffusion calculations, types, constants, and public exports.
- `ui/dashboard/views/userpages/IndustriPediaView.tsx`, `ui/dashboard/helpers/recipeFormatters.ts`, and `icons.ts` - Added the player-facing resource and recipe presentation.
- `app/index.tsx` and `game/core/stores/gameStore.ts` - Connected construction materials and market state to the app.
- `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, and `VariableRelationshipMap.md` - Documented resources, materials, market diffusion, and their dependencies.
- **NEW FILE:** `docs/WorkingDocs/VariableRelationshipMap.md` content was expanded by `2dce63f` with the current relationship register.

### Notes

- The version labels are not chronological; all six commits are retained together because they establish one resource and market foundation.

---

## Version 0.00011b through 0.00011 - Research gates
**Date:** 2026-08-03 | **Commit(s):** b85b71a12589a564db2adecfaccee36b8c05618c, af27af6851f465695829a45de9132aabff66e06c, 1266c5b11efea14004a5322d60c71f4e550f1cd9 | **Stats:** +744 / -33

### Summary

- Added the first research-gate domain and connected research state to the game.
- Added the research-gates implementation plan and improved research and achievement presentation.
- Added the initial research alpha flow and its persistence/state integration.

### Changes

- `game/gates/gate.ts`, `game/gates/index.ts`, `game/research/index.ts`, and `game/index.ts` - Added the initial research and gate public surfaces.
- `game/core/stores/gameStore.ts`, `game/core/state/gameSnapshot.ts`, and `game/company/companySessionStore.ts` - Added research-related state ownership and session integration.
- `app/_layout.tsx`, `app/index.tsx`, and `ui/dashboard/views/ResearchView.tsx` - Connected research state to the application and added its first UI.
- `ui/dashboard/views/userpages/AchievementsView.tsx` - Adjusted achievement presentation alongside the research UI.
- `docs/plans/researchgatesplan.md` - Added the research-gates implementation plan.
- `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, and `VariableRelationshipMap.md` - Documented research terminology, gate flow, state, and dependencies.

### Notes

- Research planning and implementation are recorded here; the separate achievement-tier correction is logged in the following account and achievement entry.

---

## Version 0.0010 through 0.00090a - Accounts, company reset, and achievements
**Date:** 2026-08-02 | **Commit(s):** 7be1d6857ed005188464b478b83f5d4b13c20387, c05f15f75131116273f7aa5b90032704a1f7049a, 775c30063f739a3a77863a5917c8fffe0475d814 | **Stats:** +243 / -121

### Summary

- Replaced completed achievement tiers and improved achievement presentation.
- Added user-facing company deletion and admin database reset controls.
- Added the supporting company/session behavior and documented the reset flow.

### Changes

- `game/achievements/achievementEvaluator.ts` and `ui/dashboard/views/userpages/AchievementsView.tsx` - Updated completed-tier evaluation and achievement display.
- `ui/dashboard/components/DeleteCompanyCard.tsx`, `ResetCompanyCard.tsx`, `ui/dashboard/views/userpages/AdminDashboard.tsx`, and `ProfileScreen.tsx` - Added company deletion and admin reset actions.
- `game/company/companyDatabase.ts` and `game/company/companySessionStore.ts` - Added the company/session operations behind those controls.
- `app/index.tsx` and `docs/WorkingDocs/VariableRelationshipMap.md` - Connected the controls and documented their state effects.
- `docs/plans/userlogin.md`, `docs/WorkingDocs/gameflow.md`, and `docs/WorkingDocs/design.md` - Recorded the account and reset behavior.

### Notes

- The `0.0010` labels are preserved as commit labels even though they do not sort chronologically with the surrounding versions.

---

## Version 0.00092d through 0.0009a - Core cleanup and achievement cleanup
**Date:** 2026-08-02 | **Commit(s):** 94339ab3923b45467143ef5943225d2c09e17851, 49e7c0fccfe9b38d346850925ee366dc27139110, f9d92933504c40db2ced71f485c4db76799bca9a, 83457c72c2b3760b3efa35d14cef5ea33e6a11d2, 92de738ddeb41972f5fd94123c034ececa0f1abf, 13bf3b9b841bdcdf406f9eed6cdf2f82cbfdf984 | **Stats:** +107 / -277

### Summary

- Cleaned mixed-domain modules and moved responsibilities to their owning domains.
- Removed obsolete core/store wiring and tightened achievement, facility, inventory, market, prestige, and resource boundaries.
- Simplified dashboard exports and corrected company/session code structure.

### Changes

- `game/achievements/achievementConstants.ts` and `productionStatistics.ts` - Cleaned achievement constants and production-statistics ownership.
- `game/facilities/`, `game/inventory/`, `game/market/`, `game/prestige/`, `game/recipes/`, and `game/resources/` - Removed mixed-domain responsibilities and corrected module boundaries.
- `game/core/state/gameSnapshot.ts`, `game/core/stores/gameStore.ts`, and `app/_layout.tsx` - Simplified core state and lifecycle wiring.
- `game/company/companyDatabase.ts` and `companySessionStore.ts` - Cleaned company/session responsibilities.
- `ui/dashboard/components/GameDialogs.tsx`, `ui/dashboard/helpers/dashboard.styles.ts`, and `ui/index.ts` - Removed obsolete UI exports and corrected dashboard imports.
- `docs/WorkingDocs/design.md`, `gameflow.md`, and `VariableRelationshipMap.md` - Updated the documented ownership after the cleanup.

### Notes

- This is a structural cleanup group; it does not represent a new player-facing feature by itself.

---

## Version Skill update - Project guidance alignment
**Date:** 2026-08-02 | **Commit(s):** 49c7ad5c27cea6cd4decaffd7ff584a68f316dd7 | **Stats:** +14 / -2

### Summary

- Updated the project guidance to reflect the current account, market, achievement, and game-domain structure.

### Changes

- `skills/mobilegamedev-gram/SKILL.md` - Updated the repository router and project-convention guidance.
- `readme.md` - Updated the project overview to match the current implementation direction.

### Notes

- This was documentation and workflow guidance only; it did not change runtime game behavior.

---

## Version 0.0009 - User login and user pages
**Date:** 2026-08-02 | **Commit(s):** bac92417f3dfe049b17712337036cb1cb18064e5, 8aaf03eaa5befe1988b26f6fc24af7edb722e2cd | **Stats:** +1264 / -613

### Summary

- Added the local company/session model and the first user-login flow.
- Added profile, admin, and user-facing dashboard pages.
- Added the company persistence boundary and documented the account/session behavior.

### Changes

- **NEW FILE:** `game/company/companyConstants.ts`, `companyDatabase.ts`, `companySessionStore.ts`, `companyTypes.ts`, and `game/company/index.ts` - Added company identity, local persistence, session state, types, and public exports.
- `app/_layout.tsx` and `app/index.tsx` - Added the application entry flow for the active company/session.
- `ui/dashboard/views/userpages/` and `ui/dashboard/components/` - Added profile, admin, game, inventory, contract, documentation, reset, and related user-page components.
- `metro.config.js` - Updated the bundler configuration for the company/session implementation.
- `docs/plans/userlogin.md`, `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, and `VariableRelationshipMap.md` - Documented user identity, session state, persistence ownership, and the user-page flow.

### Notes

- The implementation remains local-first; it does not add accounts or synchronization through a remote backend.

---

## Version 0.00081a through 0.0008 - Market implementation
**Date:** 2026-07-31 | **Commit(s):** 6f82613f9ed3957ce45027676374ec530284d6e3, f4c05e09a105c5d80a547f670476acfeebc078e4, fab4ec1826dd59ec4f6bbad53160a2ef2c246207, a87e3a96481a7646fb0f3ed5fab0dd40dd1e7ed7 | **Stats:** +874 / -55

### Summary

- Added the local market domain and market dashboard.
- Added market access, constants, types, state, and persistence integration.
- Added the market design plan and tuned the beta presentation.

### Changes

- **NEW FILE:** `game/market/market.ts`, `marketAccess.ts`, `marketConstants.ts`, `marketTypes.ts`, and `game/market/index.ts` - Added the market model, access rules, balance values, types, and public exports.
- `game/core/stores/gameStore.ts`, `game/core/state/gameSnapshot.ts`, `game/core/persistence/gameSaveRepository.ts`, and `game/inventory/inventory.ts` - Connected market state to the local game state and save boundary.
- `ui/dashboard/views/MarketDashboard.tsx`, `ui/dashboard/components/DashboardViewComponents.tsx`, `ui/dashboard/dashboard.styles.ts`, `icons.ts`, and `theme.ts` - Added and styled the market dashboard.
- `app/index.tsx` and `ui/dashboard/views/MarketDashboard.tsx` - Connected market navigation and display to the app.
- **NEW FILE:** `docs/plans/marketplan.md` - Added the market implementation plan.
- `app/_layout.tsx`, `app/index.tsx`, `utils.ts`, and dashboard styles - Applied beta tuning and small presentation fixes.

### Notes

- The market remains a local game system with no backend dependency.

---

## Version 0.0007a through 0.0007 - Achievements alpha
**Date:** 2026-07-31 | **Commit(s):** fce24175faaa3fae94ad669d948c532373ca2395, 2cffd131f50886e7272d91d2e0fb0ab1d39964bc | **Stats:** +878 / -35

### Summary

- Added the first achievement domain, evaluator, production statistics, and achievement dashboard.
- Added achievement persistence/state integration and the achievement implementation plan.
- Corrected achievement dashboard icon presentation.

### Changes

- **NEW FILE:** `game/achievements/achievement.ts`, `achievementConstants.ts`, `achievementEvaluator.ts`, `productionStatistics.ts`, and `game/achievements/index.ts` - Added achievement definitions, evaluation, production metrics, constants, and public exports.
- `game/core/persistence/gameSaveRepository.ts`, `game/core/state/gameSnapshot.ts`, `game/core/stores/gameStore.ts`, and `app/_layout.tsx` - Added achievement state and save/lifecycle integration.
- `app/index.tsx` and `ui/dashboard/views/AchievementsDashboard.tsx` - Added the achievement dashboard and app navigation.
- **NEW FILE:** `docs/plans/achievementsplan.md` - Added the achievement implementation plan.
- `docs/WorkingDocs/CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, and `VariableRelationshipMap.md` - Documented achievement terms, evaluation flow, and state ownership.

### Notes

- This was the first achievement implementation; later commits refine tiers and presentation.

---

## Version 0.00053f - Version-log reconciliation
**Date:** 2026-07-30 | **Commit(s):** 3167022167285ce842552785e6d9760441ed8a4f | **Stats:** +181 / -0

### Summary

- Recorded the preceding asynchronous development commits in the version log.

### Changes

- `docs/WorkingDocs/versionlog.md` - Added grouped evidence-based entries for the commits that had landed on `main` through this point.

### Notes

- This documentation commit is included so every commit reachable from `main` is represented exactly once.

---

## Version 0.0006a - Realtime manager fixes
**Date:** 2026-07-27 | **Commit(s):** 84d1189409f70caf731050642d7cb8b1a2dc4680 | **Stats:** +1511 / -90

### Summary

- Moved the time manager into the core game module and corrected realtime progression and lifecycle handling.
- Added local snapshot persistence and wired app startup, background changes, and store updates to deliberate saves.
- Updated the facility and resource code to use the reorganized game modules and refreshed the web inspection export.

### Changes

- `app/_layout.tsx`, `stores/gameStore.ts`, and `game/core/time/timeManager.ts` - Added realtime ticking, lifecycle handling, and local snapshot load/save integration.
- `game/core/persistence/gameSaveRepository.ts`, `game/core/state/gameSnapshot.ts` - Added the local save repository and shared game snapshot shape.
- `game/facilities/`, `game/finance/`, `game/inventory/`, and `game/resources/` - Updated imports and state integration for the reorganized core modules.
- `app.json`, `metro.config.js`, `.tmp-web-export/`, and working documents - Updated runtime configuration, generated web inspection output, and current implementation documentation.

### Notes

- Commits are also accepted on the `facilities.foundation` branch.

---

## Version 0.0006 - TimeManager
**Date:** 2026-07-27 | **Commit(s):** b606869f1d15e49a30e0674ca2355d12e92e8f9a | **Stats:** +299 / -35

### Summary

- Added the first realtime game clock and production advancement flow.
- Connected elapsed-time updates to the app lifecycle and game store.

### Changes

- `game/time/timeManager.ts`, `game/production/advanceProduction.ts`, `game/facilities/facility.ts`, and `stores/gameStore.ts` - Added timed production progression and state updates.
- `game/recipes/recipes.ts`, `game/resources/resourceTypes.ts`, and working documents - Added the supporting recipe, resource, and flow definitions.

### Notes

- Realtime behavior was subsequently reorganized under `game/core/` in `0.0006a`.

---

## Version 0.00053 - More facility code
**Date:** 2026-07-27 | **Commit(s):** 2beccf29e32f4a16b336737b56fdefaf97067c36 | **Stats:** +207 / -47

### Summary

- Expanded facility, recipe, inventory, and resource definitions for the facility loop.
- Added recipe data and connected the expanded definitions to the UI.

### Changes

- `game/facilities/`, `game/recipes/`, `game/inventory/`, and `game/resources/` - Expanded facility and production-domain types, registries, and recipes.
- `app/index.tsx`, `app/index.styles.ts`, and working documents - Reflected the expanded facility flow in the app and documentation.

### Notes

- This commit continued the early facility implementation without adding persistence.

---

## Version 0.00052 - Construction and demolition of buildings
**Date:** 2026-07-27 | **Commit(s):** 56ef5dbc95bd72cbcaa69e0d45da53bd7f8bb085 | **Stats:** +393 / -30

### Summary

- Added construction and demolition interactions for facilities.
- Added finance handling for building costs and updated the facility state flow.

### Changes

- `app/index.tsx`, `game/facilities/`, `game/finance/`, and `stores/gameStore.ts` - Added construction/demolition controls, costs, and state transitions.
- Working documents and `theme.ts` - Documented the facility economy and adjusted the related presentation.

### Notes

- The feature remained local in the game store and had no durable save layer yet.

---

## Version 0.00051 - Production facility
**Date:** 2026-07-27 | **Commit(s):** 6366599d33c3d90737c015f7e6317f61a4b47309 | **Stats:** +299 / -19

### Summary

- Added the initial production-facility domain model and registry.
- Added a game snapshot shape and exposed the facility state in the app.

### Changes

- `game/facilities/` - Added facility types, definitions, collection management, and the registry.
- `game/state/gameSnapshot.ts`, `stores/gameStore.ts`, and `app/index.tsx` - Added snapshot/store support and facility presentation.

### Notes

- This established the first facility implementation on top of the resource baseline.

---

## Version 0.0005 - Initial resources
**Date:** 2026-07-27 | **Commit(s):** 2eb875fe38cc948a784022d46e07165b3791c248 | **Stats:** +310 / -29

### Summary

- Added the initial resource, inventory, recipe, and resource-icon model.
- Replaced the counter store with the game store and surfaced resources in the app.

### Changes

- `game/inventory/`, `game/recipes/`, `game/resources/`, and `stores/gameStore.ts` - Added the initial resource domain and state ownership.
- `app/index.tsx` and working documents - Added resource display and documented the first resource direction.
- `stores/counterStore.ts` - Removed the placeholder counter store.

### Notes

- This was the first gameplay-domain implementation; facilities and production followed in later commits.

---

## Version 0.0004 - Expo setup
**Date:** 2026-07-27 | **Commit(s):** d6f640571ceeedf82863ca97da31f78aa626c646 | **Stats:** +3307 / -1483

### Summary

- Finalized the Expo dependency and configuration baseline for the mobile app.
- Updated project guidance for the active Expo and React Native setup.

### Changes

- `package.json`, `package-lock.json`, `app.json`, and `.gitignore` - Updated the Expo application configuration and dependency set.
- `readme.md`, `docs/WorkingDocs/PROJECT_INFO.md`, and `skills/mobilegamedev-gram/SKILL.md` - Updated setup and project conventions.
- `docs/WorkingDocs/AI_AGENT_INSTRUCTIONS.md` - Removed the redundant instruction file.

### Notes

- This was setup work only; no game mechanics were added.

---

## Version 0.002a - Dependency adjustment
**Date:** 2026-07-27 | **Commit(s):** c522ee800a9cecb94006e3e6978fd471b58f62f1 | **Stats:** +13 / -0

### Summary

- Added the dependency adjustment required by the initial app shell.

### Changes

- `package.json`, `package-lock.json` - Added and locked the required package dependency.

### Notes

- The commit contains dependency metadata only.

---

## Version 0.0003 - UI shell
**Date:** 2026-07-27 | **Commit(s):** 7b08af1497b95194524f8b926ed40b0f820793d4 | **Stats:** +374 / -38

### Summary

- Added the first app shell and initial mobile presentation.
- Added shared theme and documentation support for the new UI structure.

### Changes

- `app/index.tsx`, `app/index.styles.ts`, `app/_layout.tsx`, and `theme.ts` - Added the initial screen shell, styles, layout, and theme.
- `package.json`, `package-lock.json`, `readme.md`, and working documents - Updated dependencies and project guidance for the shell.

### Notes

- The UI shell preceded the resource and facility gameplay layers.

---

## Version 0.0002 - Dependencies
**Date:** 2026-07-26 | **Commit(s):** 20884944ee0ab502453b7bbaf2846d7b06b01997 | **Stats:** +7967 / -38

### Summary

- Added the initial Expo project configuration, dependencies, assets, and TypeScript setup.
- Added the first app layout and placeholder counter store.

### Changes

- `package.json`, `package-lock.json`, `app.json`, `tsconfig.json`, and `.gitignore` - Added the initial Expo project baseline.
- `app/`, `assets/`, and `stores/counterStore.ts` - Added the first app shell, bundled assets, and placeholder state.
- `docs/WorkingDocs/`, `readme.md`, and `VariableRelationshipMap.md` - Moved and updated the project documentation for the app baseline.

### Notes

- This commit established the application scaffold; gameplay implementation came later.

---

## Version 0.000e - Initial docs finalized
**Date:** 2026-07-26 | **Commit(s):** 3035bedc181159d24b2a41c6267ed91091d07e11 | **Stats:** +37 / -0

### Summary

- Finalized the initial project information and version-log documentation.

### Changes

- `docs/WorkingDocs/PROJECT_INFO.md` - Added the initial project implementation map.
- `docs/WorkingDocs/versionlog.md` - Added the evidence-based version-log format and initial documentation history.

### Notes

- This was documentation-only work before the Expo scaffold was added.

---

## Version 0.0001d - Initial project consistency review
**Date:** 2026-07-26 | **Commit(s):** 96c190e534516e5410de01fb2624d36eb946fb2d | **Stats:** +279 / -3534

### Summary

- Reviewed the initial project documentation, AI instructions, skills, and supporting files against the locked Industri Clicker conventions.
- Removed obsolete setup artifacts and inherited workflow support, and aligned active guidance with Android-first Expo development.
- Marked predecessor readmes as archives and updated the version log with the newly established documentation history.

### Changes

- `readme.md`, `AGENTS.md`, `CLAUDE.md`, and `docs/WorkingDocs/` - Corrected active documentation links, clarified ownership of the variable relationship map, and aligned current project-stage language.
- `olditerations/Readme_hackandslash.md`, `olditerations/readmeOffice.md`, and `olditerations/readme_winemaker.md` - Added explicit archive notices so predecessor content cannot be mistaken for current implementation guidance.
- `skills/mobilegamedev-gram/SKILL.md` and `skills/best-practices/supabase-best-practices/README.md` - Removed stale workflow assumptions and clarified current stack and deferred-cloud boundaries.
- `skills/superpowers/brainstorming/`, `diagnose/`, `executing-plans/`, `finishing-a-development-branch/`, `requesting-code-review/`, `systematic-debugging/`, `verification-before-completion/`, and `writing-plans/` - Reworked active workflows for explicit user control, native Android verification, and project-specific ownership boundaries.
- `skills/superpowers/improve-codebase-architecture/` and supporting specialist skills - Replaced generic or predecessor-oriented architecture language with Expo, React Native, TypeScript, Zustand, and Expo SQLite guidance.
- **REMOVED:** `.cursor/mcp.json.example` and `.cursor/worktrees.json` - Removed deferred Supabase setup and pre-scaffold worktree commands that were not valid for the current foundation stage.
- **REMOVED:** obsolete brainstorming visual-server files, generic debugging appendices, and plan-review prompt files - Removed unused browser, shell, and inherited workflow support.
- `docs/WorkingDocs/versionlog.md` - Added the `0.0001c` history entry and preserved the required evidence-based entry format.

### Notes

- No Expo application, game mechanics, persistence schema, or native build was added in this documentation and skill review.
- Supabase guidance remains available only for an explicitly approved future cloud requirement.

---

## Version 0.0001c - Variable relationship map template
**Date:** 2026-07-26 | **Commit(s):** 78b81969cc4cdbb8a78248e7b58213931c86d4ee | **Stats:** +133 / -91

### Summary

- Restored the variable relationship map as a generic Industri Clicker template rather than retaining predecessor-specific mechanics.
- Split variable-level ownership and dependencies from the broader gameflow document.
- Replaced the imported version history with the first three factual Industri Clicker entries and retained the reusable logging rules.

### Changes

- **NEW FILE:** `VariableRelationshipMap.md` (68 lines) - Added a template for variable registers, dependency formulas, command effects, time/catch-up effects, and persistence ownership.
- `docs/WorkingDocs/gameflow.md` - Redirected variable-level ownership and dependency tracking to the restored root map while retaining system flow, formulas, tick rules, and persistence boundaries.
- `docs/WorkingDocs/PROJECT_INFO.md` - Added the relationship map to the canonical documentation map.
- `docs/WorkingDocs/versionlog.md` - Renamed the log for Industri Clicker, retained the entry-writing rules, and replaced imported predecessor release entries with the actual `0.0001` through `0.0001b` commit history.

### Notes

- This commit established documentation templates only; it did not scaffold the Expo app or implement gameplay.

---

## Version 0.0001b - Documentation and skill consolidation
**Date:** 2026-07-26 | **Commit(s):** e2079e518e0635921fba73e99acb37c8b9e47186 | **Stats:** +635 / -11729

### Summary

- Consolidated imported project documentation into Industri Clicker working documents and a single project README.
- Updated agent instructions and the remaining relevant skills for the native Android, Expo, React Native, and TypeScript direction.
- Removed browser-oriented and otherwise unused imported skills, duplicate instruction files, and legacy project-map files.

### Changes

- `readme.md` - Added the consolidated Industri Clicker project overview and technology direction.
- `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/ai-agent-rule.mdc/airulesVS.instructions.md` - Aligned cross-environment AI instructions with the project router and working conventions.
- `docs/WorkingDocs/` - Consolidated core-game descriptions, cleanup guidance, documentation guidance, context, project information, design, and gameflow material into the working-document location.
- **NEW FILE:** `docs/WorkingDocs/AIDescriptions_coregame.md` (36 lines), `docs/WorkingDocs/AI_AGENT_INSTRUCTIONS.md` (5 lines), and `docs/WorkingDocs/AIpromt_docs.md` (29 lines) - Added canonical AI-facing working documentation.
- `skills/mobilegamedev-gram/SKILL.md`, `skills/best-practices/js-ts-best-practices/`, and `skills/best-practices/supabase-best-practices/` - Refined routing and technology guidance for the chosen mobile-first stack.
- **REMOVED:** `.github/copilot-instructions.md`, duplicate root working documents, `VariableRelationshipMap.md`, and copied instruction files - Replaced by canonical working documentation and cross-environment instruction pointers.
- **REMOVED:** `skills/best-practices/react-best-practices/`, `skills/best-practices/shadcn-best-practices/`, `skills/superpowers/using-superpowers/`, and `skills/toolsskills/caveman/` - Removed skills that did not fit the selected project direction.
- `olditerations/Readme_hackandslash.md`, `olditerations/readmeOffice.md`, and `olditerations/readme_winemaker.md` - Moved predecessor README files out of the active project-documentation surface.

### Notes

- The game remained in documentation-consolidation stage; this commit did not scaffold an Expo application or implement game mechanics.
- Imported predecessor material remained historical reference only and not evidence of Industri Clicker implementation.

---

## Version 0.0001a - Mobile game router migration
**Date:** 2026-07-26 | **Commit(s):** 053828132fb8d599382a58afa91f636fcab066da | **Stats:** +117 / -227

### Summary

- Replaced the inherited web-game router with an Industri Clicker mobile-game router.
- Redirected existing agent and skill references to the new router.

### Changes

- **NEW FILE:** `skills/mobilegamedev-gram/SKILL.md` (90 lines) - Added the initial mobile-first repository router and project conventions.
- **REMOVED:** `skills/webgamedev-gram/SKILL.md` - Replaced the inherited web-game router.
- `AGENTS.md`, `CLAUDE.md`, and selected files under `skills/` - Updated router references so future work starts from the mobile-game context.

### Notes

- This was a routing and instruction migration; it did not add an application scaffold, UI, persistence layer, or game logic.

---

## Version 0.0001 - Imported documentation and skills baseline
**Date:** 2026-07-26 | **Commit(s):** 33c3b03a4e48db4b2b208863042f803db4b7074e | **Stats:** +18731 / -0

### Summary

- Added the initial Industri Clicker repository contents by importing documentation, agent instructions, and skills from predecessor projects.
- Established the raw material later consolidated into the project-specific mobile-first documentation and skill set.

### Changes

- **NEW FILE:** `docs/WorkingDocs/CONTEXT.md` (168 lines), `docs/WorkingDocs/PROJECT_INFO.md` (207 lines), `docs/WorkingDocs/design.md` (220 lines), `docs/WorkingDocs/gameflow.md` (536 lines), and `docs/WorkingDocs/versionlog.md` (144 lines) - Imported the initial working-document set.
- **NEW FILE:** `AGENTS.md` (17 lines), `CLAUDE.md` (17 lines), `.github/copilot-instructions.md` (89 lines), and `.cursor/rules/ai-agent-rule.mdc/airulesVS.instructions.md` (89 lines) - Imported agent instruction files for several environments.
- **NEW FILE:** `readmeOffice.md` (73 lines), `readme_winemaker.md` (84 lines), and `Readme_hackandslash.md` (194 lines) - Imported predecessor project overviews for later consolidation.
- **NEW FILE:** `skills/` (imported collection) - Added the initial router, tool, superpower, JavaScript/TypeScript, React, Shadcn, and Supabase skills.
- **NEW FILE:** `VariableRelationshipMap.md` (126 lines) and root AI/documentation/project-info files - Added imported supporting project documentation for later review.

### Notes

- This baseline intentionally contained overlapping files and predecessor-specific assumptions.
- It introduced documentation and skills only; no Expo app, game source, persistence schema, or playable mechanics were implemented.
