---
name: mobilegamedev-gram
description: Use as the default router and project-convention authority for Industri Clicker. Route mobile-first game, mechanics, UI, persistence, documentation, and verification work to the matching local specialist skill.
---

# Mobile Game Development

## Purpose

This is the repository router for Industri Clicker, an early-stage single-player, mobile-first industrial clicker game. It establishes project guardrails and selects specialist skills; it is not a substitute for the game's design or a technology-specific implementation guide.

The repository is being consolidated from prior projects. Their documentation and skills are reference material, not permission to import their domains, architecture, technology, persistence keys, routes, or implementation claims.

## Project State

- The game is mobile-first. Design the portrait-phone experience first, then adapt it deliberately for larger screens.
- The technology stack and final architecture have not yet been selected. Do not infer React, Flutter, Supabase, Hive, shadcn, Tailwind, or any other framework from imported files.
- Until the documentation consolidation is complete, treat the user-approved Industri Clicker direction and current repository files as authoritative. Mark inherited material as legacy when it conflicts.
- Do not invent detailed industrial terminology, currencies, production chains, progression loops, or monetization rules before the design establishes them.

## Session Start And Context

For a change, read at least the following docs for relevant context. Large read of codebase is encouraged before starting on a task. The order of reading is:

1. `README.md` when it exists; otherwise inspect the root project overview files.
2. `docs/WorkingDocs/CONTEXT.md` after it has been rewritten for Industri Clicker.
3. `docs/WorkingDocs/design.md` for product or mechanic direction.
4. `docs/WorkingDocs/PROJECT_INFO.md` for the selected stack, repository map, commands, and current implementation facts.
5. `docs/WorkingDocs/gameflow.md` for a change to mechanics, economy, tick order, state flow, or persistence.

Read the code and tests before treating an inherited document as proof that something exists.

## Core Rules

- Keep services, database CRUD operation and UI separated in different files. Do not put business logic, validation, calculations, or persistence orchestration in UI components.
- Keep source-of-truth state explicit. Persist primary state, derive display values where practical, and document save boundaries.
- Prefer the smallest change that serves the current stage of the project. Do not introduce change to backend  unless the user asks for them.
- Do not preserve legacy data shapes, database tables, or persistence keys unless the user explicitly requests it. Do not create compatibility branches or wrappers for old names; correct consumers to use the new names.
- Do not commit, push, launch a development server, or run broad validation by default. The human owns commits unless they explicitly delegate them.

## Mobile-First Rules

Apply these rules to any player-facing UI or interaction work:

- Make portrait phone screens the baseline; verify narrow widths before adding desktop layout enhancements.
- Use touch-friendly controls with clear hit areas, visible feedback, and no hover-only or right-click-only affordances.
- Respect safe areas, keyboard/IME movement, dynamic viewport changes, reduced motion, and text scaling.
- Keep repeated tapping responsive: avoid unnecessary rerenders, allocations, animations, network calls, or persistence writes on each tap.
- Protect gameplay from accidental double taps and rapid input while preserving intentional fast tapping when it is part of the mechanic.
- Use accessible labels, semantic controls, readable contrast, and non-color-only status cues.
- Design for interrupted and offline play: save timing, background/resume behavior, and elapsed-time catch-up must be explicit before they are implemented.
- Avoid fixed desktop-sized panels, dense tiny controls, horizontal scrolling, and interactions that require a mouse.

## Routing Matrix

| Task | Primary skill | Use only when |
|---|---|---|
| Skill creation, migration, consolidation, or verification | `../toolsskills/writeskills-gram/SKILL.md` | Editing a skill or its support files |
| Game direction, economy, mechanics, UX options, or unclear requirements | `../superpowers/brainstorming/SKILL.md` | The user asks for exploration or requirements need design work |
| Approved multi-step implementation plan | `../superpowers/executing-plans/SKILL.md` | A written plan is already approved |
| Bugs, regressions, unexpected behavior, or failed tests | `../superpowers/systematic-debugging/SKILL.md` | Diagnosing or fixing a defect |
| Deep, intermittent, or performance-heavy defect | `../superpowers/diagnose/SKILL.md` | Baseline debugging has not found the cause |
| Test-first implementation or a user request for TDD | `../superpowers/tdd-gram/SKILL.md` | Behavior is changing under tests |
| JavaScript or TypeScript implementation | `../best-practices/js-ts-best-practices/SKILL.md` | That stack is selected and the task uses it |
| React rendering or performance work | `../best-practices/react-best-practices/SKILL.md` | React is selected |
| shadcn/Radix UI work | `../best-practices/shadcn-best-practices/SKILL.md` | That UI system is selected |
| Supabase/Postgres schema, query, RLS, or migration work | `../best-practices/supabase-best-practices/SKILL.md` | Supabase/Postgres is selected |
| Explicitly minimal, narrowly scoped work | `../toolsskills/small-steps/SKILL.md` | The user requests this working style |
| Architecture review or focused cleanup | `../superpowers/improve-codebase-architecture/SKILL.md` | The task is an architecture/refactor review |
| Branch completion, PR preparation, or review feedback | Matching `superpowers` review/branch skill | The user explicitly requests that workflow |
| Handoff for a later session | `../toolsskills/handoff/SKILL.md` | A durable continuation note is requested |

The `superpowers` group is supporting, not a mandatory session entrypoint. Do not use `using-superpowers` as a general wrapper. Use one matching specialist skill, not several overlapping workflows, unless the task genuinely needs both.

## Documentation Maintenance

When the relevant documents exist and are current:

- Update `CONTEXT.md` for new canonical game terms.
- Update `design.md` for durable player-facing direction and decisions.
- Update `PROJECT_INFO.md` for the chosen stack, commands, source layout, and verified implementation status.
- Update `gameflow.md` for mechanics, tick order, variables, formulas, state ownership, or persistence changes.
- Keep `README.md` concise: project purpose, setup, and documentation entry points.
- Record version-log entries only after the corresponding commit exists and only from the reviewed commit diff.

## Verification

Use the smallest useful validation for the change. For code or behavior work, run the focused test, type, or build check that the chosen stack supplies. For documentation-only work, review links and stale project-name references, then run `git diff --check` when handing off.

Before claiming a mobile UI task is complete, verify the intended narrow-phone layout and the interaction path, as well as automated checks appropriate to the selected stack.
