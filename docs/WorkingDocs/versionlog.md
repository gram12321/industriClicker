# Version Log - Office Tycoon

## AI Instructions For New Entries

### Goal
Write clear, factual release notes that explain what changed, where, and why it matters.

### Scope Rules
- Log only meaningful changes (features, refactors, balancing changes, architecture updates, major bug fixes, doc restructures).
- Skip trivial noise (format-only edits, typos, minor wording tweaks) unless bundled with a meaningful change.
- Group related commits into one entry when they represent one logical change.

### Evidence Rules
- Use actual repository data before writing (commit hash(es), changed files, basic stats).
- Review the commit patch line-by-line before writing behavior summaries:
  - single commit: `git show --no-color <commit>`
  - grouped commits: run the same for each commit in the group.
- Do not guess file changes.
- Do not claim behavior/mechanics that are not visible in the reviewed diff.
- If commits are grouped, list each commit hash in the entry header.

### Entry Format (required)
Use this exact structure for each entry:

```
## Version <tag> - <short title>
**Date:** YYYY-MM-DD | **Commit(s):** <hash or comma-separated hashes> | **Stats:** <additions/deletions summary>

### Summary
- 1-3 bullets describing intent and outcome.

### Changes
- `path/to/file.ts` - what changed and why it matters.
- `path/to/other.tsx` - what changed and why it matters.
- **NEW FILE:** `path/to/newFile.ts` (<line count> lines) - purpose.
- **REMOVED:** `path/to/oldFile.ts` - reason removed/replaced.

### Notes
- Migration, compatibility, balancing impact, follow-up items, or known limitations.
```

### Writing Rules
- Keep entries concrete and technical.
- Prefer file paths over vague descriptions.
- Use `NEW FILE` and `REMOVED` markers exactly.
- If relevant, call out architecture decisions and intentional deviations from earlier plans.

### Ordering
- Newest entry goes at the top (below this instruction section).
- Keep entries in reverse chronological order.


---

## Version 0.0002 - Base design phase mechanics
**Date:** 2026-05-14 | **Commit(s):** 13f134ab9b3bf802802368d1afb986aba77f15a8 | **Stats:** +3498 / -33

### Summary
- Added the first TypeScript/Vitest project setup and mechanics-only base design loop.
- Implemented software type, feature, and subfeature selection with catalog validation and base design work calculation.
- Added deterministic design progress, design iteration completion, diminishing quality gain, tests, and a terminal demo.

### Changes
- **NEW FILE:** `package.json` (18 lines), **NEW FILE:** `package-lock.json` (2168 lines), and **NEW FILE:** `tsconfig.json` (15 lines) - Add Node/TypeScript/Vitest/tsx tooling and scripts.
- **NEW FILE:** `.gitignore` (1 line) - Ignores `node_modules/`.
- **NEW FILE:** `docs/Designdocs/Basemechanism.md` (9 lines), **NEW FILE:** `docs/superpowers/plans/2026-05-14-base-design-mechanism.md` (126 lines), and **NEW FILE:** `docs/superpowers/specs/2026-05-14-base-design-mechanism-design.md` (90 lines) - Add the initial base-design prompt, implementation plan, and design spec.
- **NEW FILE:** `src/constants/softwareCatalog.ts` (112 lines) - Adds starter software types, features, subfeatures, and complexity values.
- **NEW FILE:** `src/constants/designBalance.ts` (5 lines) and **NEW FILE:** `src/constants/index.ts` (2 lines) - Add tunable design balance values and constants barrel.
- **NEW FILE:** `src/engine/catalogLookup.ts` (72 lines), **NEW FILE:** `src/engine/designEngine.ts` (166 lines), **NEW FILE:** `src/engine/result.ts` (15 lines), and **NEW FILE:** `src/engine/index.ts` (8 lines) - Add catalog validation, project creation, design work progression, iteration completion, quality gain, inert development boundary, result helpers, and engine exports.
- **NEW FILE:** `src/types/catalog.ts` (34 lines), **NEW FILE:** `src/types/project.ts` (63 lines), and **NEW FILE:** `src/types/index.ts` (18 lines) - Add catalog, project, phase, design state, and typed result contracts.
- **NEW FILE:** `utils/calc.ts` (96 lines) - Adds shared diminishing-return and symmetrical multiplier helpers.
- **NEW FILE:** `tests/designEngine.test.ts` (229 lines) and **NEW FILE:** `tests/calc.test.ts` (40 lines) - Cover design selection, work progression, quality behavior, the inert development boundary, and shared calculation helpers.
- **NEW FILE:** `src/demo/designLoopDemo.ts` (65 lines) - Adds a scripted terminal demo for the initial design loop.
- `docs/PROJECT_INFO.md`, `docs/design.md`, `docs/versionlog.md`, `progress.md`, and `readme.md` - Update project status, setup commands, documentation links, and version history for the new mechanics foundation.

### Notes
- This commit still kept the browser UI, real development phase, beta/testing, release, persistence, market, finance, and staff systems deferred.
- The terminal demo was later removed when the browser debug UI became the primary inspection surface.

---

## Version 0.0001b - Repository documentation cleanup
**Date:** 2026-05-14 | **Commit(s):** 570625751606f1f52520f453b5a656202107ce57 | **Stats:** +72 / -327

### Summary
- Reworked copied JavaScript/TypeScript skill docs into repository-specific guidance.
- Converted the project map tree to ASCII formatting.
- Reduced `docs/versionlog.md` to the reusable instruction section and example entry, removing copied historical entries from the source project.

### Changes
- `.cursor/skills/javascript-typescript/SKILL.md` - Replaced generic registry-style TypeScript examples with Office Tycoon context requirements, execution rules, React guidance, and validation expectations.
- `.skills/javascript-typescript/SKILL.md` - Aligned the local skill copy with the repository-specific JavaScript/TypeScript guidance.
- `docs/PROJECT_INFO.md` - Replaced Unicode tree glyphs in the expected repository shape with ASCII tree formatting.
- `docs/versionlog.md` - Marked the copied release note as an example and removed old project entries that should not be treated as Office Tycoon history.

### Notes
- This commit cleaned imported documentation but did not add gameplay implementation.

---

## Version 0.00001a - Documentation and utility bootstrap
**Date:** 2026-05-14 | **Commit(s):** 3b786b1fdceff91f66b525e8edcbd09e20218c5c | **Stats:** +1248 / -54

### Summary
- Moved the initial design note into `docs/` and added the first project documentation set for AI-guided development.
- Added JavaScript/TypeScript skill files for Cursor and local agent workflows.
- Added shared TypeScript utility helpers for class merging, number/currency formatting, quality colors, and range ratings.

### Changes
- **NEW FILE:** `.cursor/skills/javascript-typescript/.skill-meta.json` (6 lines) - Cursor skill metadata for the JavaScript/TypeScript guidance.
- **NEW FILE:** `.cursor/skills/javascript-typescript/SKILL.md` (142 lines) - Initial JavaScript/TypeScript skill guidance copied into the Cursor skill location.
- **NEW FILE:** `.skills/javascript-typescript/.skill-meta.json` (6 lines) - Local skill metadata for the JavaScript/TypeScript guidance.
- **NEW FILE:** `.skills/javascript-typescript/SKILL.md` (50 lines) - Initial local JavaScript/TypeScript skill guidance with repository routing notes.
- **REMOVED:** `design.md` - Moved the root design note into `docs/design.md` to centralize documentation.
- **NEW FILE:** `docs/AIDescriptions_coregame.md` (162 lines) - AI-facing core mechanics and architecture guide for the planned tycoon simulation.
- **NEW FILE:** `docs/AIpromt_codecleaning.md` (60 lines) - Cleanup and refactor prompt covering behavior preservation, structure, tests, and docs.
- **NEW FILE:** `docs/PROJECT_INFO.md` (99 lines) - Living project map with status, intended stack, expected repository shape, documentation map, priorities, and maintenance notes.
- **NEW FILE:** `docs/copilot-instructions.md` (130 lines) - Coding-agent instructions for repository context, architecture, documentation, testing, and version logging.
- **NEW FILE:** `docs/design.md` (54 lines) - Preserved the initial game concept and development process notes under `docs/`.
- **NEW FILE:** `docs/versionlog.md` (240 lines) - Added version log instructions and copied example/history content from another project as a starting template.
- **NEW FILE:** `readme.md` (85 lines) - Added the project overview, game direction, lifecycle, development approach, technical direction, architecture intent, and documentation links.
- **NEW FILE:** `utils/utils.ts` (214 lines) - Added shared helpers: `cn`, `formatNumber`, `formatCurrency`, quality color class helpers, and `getRatingForRange`.

### Notes
- Several docs were copied or adapted from another project and were later cleaned up in version `0.0001b`.
- `utils/utils.ts` references `clsx` and `tailwind-merge`; this commit did not add package metadata or install scripts.

---

## Version 0.0001 - Initial design document
**Date:** 2026-05-14 | **Commit(s):** 4b0ba92f1ac09a17716b0efaffcf595480c2ab6d | **Stats:** +54 / -0

### Summary
- Created the first design note for a single-player software development simulation game.
- Defined the planned software project lifecycle: design, development, beta/testing, and release.
- Captured early technology and process preferences for AI-driven development.

### Changes
- **NEW FILE:** `design.md` (54 lines) - Initial design document covering software types, features/subfeatures, pricing and development time, quality and bugs, sales drivers, intended stack, UI goals, and development process constraints.

### Notes
- This was a design-only commit; no application code, tests, package setup, or playable mechanics were added.

---
