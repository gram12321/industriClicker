---
name: webgamedev-gram
description: Use as the default router and repo skill for this web game project, including feature work, bug fixes, refactors, docs updates, and verification. Route to local specialist skills by task type instead of generic game-engine flows.
---

# Web Game Development

## Purpose

This is the default repo skill for this project. It is both:

1. The project-convention guardrail skill.
2. The router skill that selects other local skills based on the task.

This repo-local router takes precedence over similarly named plugin workflows. Prefer the local skills under `.agents/skills/` over plugin-provided Game Studio, default Superpowers, or broad web-app workflows unless the user explicitly asks for those plugin workflows or a plugin tool is needed.

Route directly to a local specialist skill when the task is already clear. The `superpowers` group is a supporting, non-default set of specialist workflows: select an individual skill only when the user explicitly requests it or the task clearly needs that discipline. Do not invoke `using-superpowers` as a universal session entrypoint.

## Session Start

Start user-facing work with a short AI check message:

```text
AI check: <1-5> - <brief reason>
```

Use `1` for a clear, low-risk request and `5` for ambiguous or broad work.

Before changing code, read the smallest relevant set of docs:

1. `readme.md`
2. `docs/WorkingDocs/CONTEXT.md`
3. `docs/WorkingDocs/PROJECT_INFO.md`
4. `docs/WorkingDocs/gameflow.md` for mechanics changes, or `docs/WorkingDocs/design.md` for product-direction changes

## Routing Matrix

After classifying the user request, route to the matching specialist skills.

| Task type | Primary skill(s) | Secondary skill(s) |
|---|---|---|
| User asks for ideation, option analysis, or design-first discussion | `../superpowers/brainstorming/SKILL.md` | `../superpowers/writing-plans/SKILL.md` |
| Feature design, option exploration, unclear requirements | `../superpowers/brainstorming/SKILL.md` | `../superpowers/writing-plans/SKILL.md` |
| Multi-step implementation from an approved plan | `../superpowers/executing-plans/SKILL.md` | `../superpowers/dispatching-parallel-agents/SKILL.md` |
| React or TypeScript implementation details | `../best-practices/js-ts-best-practices/SKILL.md` | `../best-practices/react-best-practices/SKILL.md` |
| ShadCN component composition and UI consistency | `../best-practices/shadcn-best-practices/SKILL.md` | `../best-practices/react-best-practices/SKILL.md` |
| Rendered frontend QA, UI regression reproduction, interaction checks | `../superpowers/systematic-debugging/SKILL.md` | none |
| Bug reports, regressions, failing tests, unexpected behavior | `../superpowers/systematic-debugging/SKILL.md` | `../superpowers/diagnose/SKILL.md` |
| Database query, schema, index, or RLS performance concerns | `../best-practices/supabase-best-practices/SKILL.md` | repo migration/database tooling guidance |
| User asks for minimal change, small steps, low ceremony, or narrow scope | `../toolsskills/small-steps/SKILL.md` | `../toolsskills/caveman/SKILL.md` when terse style is also requested |
| About to claim completion or fixed status | `../superpowers/verification-before-completion/SKILL.md` | `../superpowers/requesting-code-review/SKILL.md` |
| Writing or fixing skills | `../toolsskills/writeskills-gram/SKILL.md` | none |
| Architecture-level refactor opportunities | `../superpowers/improve-codebase-architecture/SKILL.md` | none |
| User explicitly asks for a grill/interview challenge | `../toolsskills/grill-me/SKILL.md` | none |
| User explicitly asks for compressed/terse style | `../toolsskills/caveman/SKILL.md` | none |
| User explicitly asks to wrap up merge or PR branch flow | `../superpowers/finishing-a-development-branch/SKILL.md` | `../superpowers/requesting-code-review/SKILL.md` |
| Agent is about to claim task completion | `../superpowers/improve-codebase-architecture/SKILL.md` (sanitary sweep mode) | `../superpowers/verification-before-completion/SKILL.md` |

- `../best-practices/js-ts-best-practices/SKILL.md`
- `../best-practices/react-best-practices/SKILL.md`
- `../toolsskills/handoff/SKILL.md`

## Supporting Superpowers Skills

The following are non-default here. Select an individual skill only for an explicit request or a clearly matching task; do not start ordinary repository work through the `superpowers` umbrella.

- `../superpowers/brainstorming/SKILL.md`
- `../superpowers/dispatching-parallel-agents/SKILL.md`
- `../superpowers/diagnose/SKILL.md`
- `../superpowers/executing-plans/SKILL.md`
- `../superpowers/finishing-a-development-branch/SKILL.md`
- `../superpowers/improve-codebase-architecture/SKILL.md`
- `../superpowers/receiving-code-review/SKILL.md`
- `../superpowers/requesting-code-review/SKILL.md`
- `../superpowers/systematic-debugging/SKILL.md`
- `../superpowers/tdd-gram/SKILL.md`
- `../superpowers/using-superpowers/SKILL.md`
- `../superpowers/verification-before-completion/SKILL.md`
- `../superpowers/writing-plans/SKILL.md`

## Core Project Rules

- Keep business logic in `src/lib/services/`.
- Keep Supabase reads and writes in `src/lib/database/`.
- Keep pages and UI components focused on presentation and interaction.
- Prefer barrel imports from `@/components/ui`, `@/hooks`, `@/lib/services`, `@/lib/utils`, and `@/lib/constants`.
- Use shared types from `src/lib/types/` and `src/components/UItypes.ts`.
- Follow domain terminology from `docs/WorkingDocs/CONTEXT.md` once defined; do not reuse prior-project domain terms.
- Do not add legacy data-shape support unless explicitly requested.
- Keep persisted gameplay data company-scoped via current company flow.
- Services should trigger global updates for state changes.
- Use `calculateTotalWork()` and established activity work calculators for activity work.
- Use named ES module imports and keep imports at top of file.
- Use `useLoadingState()`, `useGameStateWithData()`, and `useGameState()` where they match local patterns.
- Extract tunable gameplay numbers into named constants.

## Project Preferences

- Do not commit changes unless explicitly asked.
- Human owns git commits by default.
- No AI git commit unless the user explicitly requests it.
- Do not start `npm run dev` unless explicitly asked.
- Do not run `npm run build` by default; use only when asked or when change risk justifies it.
- After major updates, ask whether `readme.md` should be updated.
- Do not run tests, `ESLint`, `typecheck`, or `git diff --check` after every change. Use them when delivering a finished feature, for complex changes, or when the user explicitly requests them.
- For schema changes, update SQL under `migrations/` after validating intended DB changes.
- Keep `docs/WorkingDocs/AIpromt_codecleaning.md` as the detailed cleanup playbook. The completion sanitary gate below runs in parallel and does not supersede it.

## Key Locations

Planned layout from the shared stack workflow. Paths may not exist yet in this repo.

| Area | Path |
|---|---|
| Core types | `src/lib/types/types.ts` |
| UI types | `src/components/UItypes.ts` |
| Core services | `src/lib/services/core/` |
| Domain services | `src/lib/services/<domain>/` |
| Database layer | `src/lib/database/` |
| Game constants | `src/lib/constants/` |
| Pages | `src/components/pages/` |
| Shared UI | `src/components/ui/` |
| Hooks | `src/hooks/` |
| Automated tests | `tests/` |
| Migrations | `migrations/` |

## Domain Workflows

### Weekly Tick Changes

1. Inspect `src/lib/services/core/gameTick.ts`.
2. Keep calculations in domain services, not `gameTick.ts`.
3. Preserve company-scoped behavior and global update flow.

### Gameplay System Changes

1. Update shared types first when domain shape changes.
2. Add constants before wiring numbers in services.
3. Keep DB access in `src/lib/database/` only.
4. Keep page components orchestration-focused.

## Documentation Maintenance

After implementation:

- Update `docs/WorkingDocs/CONTEXT.md` when new domain terminology, variables, or constants are defined.
- Update `docs/WorkingDocs/PROJECT_INFO.md` when files/modules move or ownership changes.
- Update `docs/WorkingDocs/gameflow.md` when implemented mechanics or variable relationships change.
- Keep `readme.md` concise.

## Completion Sanitary Gate (Required)

Before claiming a task is done, run a sanitation sweep through a subagent.

Default sweep path:

1. Spawn an `Explore` subagent for a repo scan.
2. Check and report these violations:
	- Service or business functions inside UI files (not allowed): `src/components/`, `src/components/pages/`, and UI-only modules.
	- CRUD or direct data persistence logic outside `src/lib/database/` (not allowed).
	- Tunable gameplay numbers hardcoded in services or UI when they should live in `src/lib/constants/`.
	- Import/export hygiene drift:
	  - Imports should use project barrel paths where available.
	  - Exports should use `index.ts` barrel exports.
	  - Prefer wildcard barrel exports when safe and appropriate for the module.
3. Apply fixes immediately or document explicit exceptions.
4. Run verification checks before completion claims.

This gate is mandatory for meaningful code changes.

## Version Log Sync Gate (Frequent)

Frequently check whether new commits are missing entries in `docs/WorkingDocs/versionlog.md`, and always check before release-style completion claims.

Versionlog ownership rules:

1. `docs/WorkingDocs/versionlog.md` is updated only after the relevant commit or commits exist.
2. Do not let implementation agents write or append versionlog entries as part of routine feature completion.
3. Versionlog updates happen only after commit(s) exist.
4. Commits are created by the human by default; AI must not commit unless explicitly requested.

Default versionlog path:

1. Compare recent commits with current `docs/WorkingDocs/versionlog.md` coverage.
2. If missing entries exist, update `docs/WorkingDocs/versionlog.md`.
3. Follow the rules at the top of `docs/WorkingDocs/versionlog.md` strictly:
	- Group related commits into one logical version entry when appropriate.
	- Keep claims tied to verified diffs.
4. If no meaningful unlogged commits exist, state that explicitly.

## Verification Minimum

Use the smallest useful set for the change:

```bash
npm test
git diff --check
```

For docs passes, also search for stale names across `docs`, `readme.md`, `docs/WorkingDocs/CONTEXT.md`, `src`, and `tests`.
