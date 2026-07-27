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
