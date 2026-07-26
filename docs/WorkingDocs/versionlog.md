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
