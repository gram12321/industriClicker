---
name: mobilegamedev-gram
description: Use as the default router and project-convention authority for Industri Clicker. Route mobile-first game, mechanics, UI, persistence, documentation, and verification work to the matching local specialist skill.
---

# Mobile Game Development

## Purpose

This is the repository router for Industri Clicker, an early-stage single-player, mobile-first industrial clicker game. It establishes project guardrails and selects specialist skills; it is not a substitute for the game's design or a technology-specific implementation guide.

The repository is being consolidated from prior projects. Their documentation and skills are reference material, not permission to import their domains, architecture, technology, persistence keys, routes, or implementation claims.

## Locked Stack

| Area | Decision |
|---|---|
| Product target | Native Android app first |
| App framework | Expo + React Native |
| Language and navigation | TypeScript + Expo Router |
| UI | React Native Paper + React Native core components |
| Runtime and durable state | Zustand in memory + Expo SQLite for deliberate saves |
| Cloud/backend | None initially; Supabase only for an approved need |
| Development and release | Expo Go on a physical Android device/Fast Refresh; native Android build; no PWA/web release |

- The game is a native Android app first, built with Expo, React Native, TypeScript, and Expo Router.
- Use React Native Paper and React Native core components for the code-defined Material UI. Do not use browser DOM components for native screens.
- Keep current game state in Zustand and durable local data in Expo SQLite. Do not write persistent data on every tap.
- Keep game rules in pure TypeScript engine/service modules. UI components issue commands and render state; persistence adapters own SQLite access.
- Supabase is deferred. Add it only for an explicitly approved cloud requirement, such as backup, cross-device sync, accounts, or server-owned features.
- Expo web is a desktop development aid for fast layout inspection and browser DevTools. It is not a PWA or web-release target.
- Use Expo Go on a physical Android device as the primary native preview and Fast Refresh for ordinary TypeScript/UI edits. Expo web is a lightweight desktop aid. Treat the Android Emulator as optional because it may be too resource-intensive on some development machines. Verify on a physical Android device at meaningful interaction or release checkpoints.

## Stack Rationale

The project needs a native mobile delivery path without bespoke visual design and is maintained entirely by coding agents. Expo and React Native provide native Android UI while preserving the TypeScript and React component model that agents handle well. React Native Paper supplies reusable Material components, and Expo SQLite supports deliberate local saves without introducing a backend.

## Project State

- The game is mobile-first. Design the portrait-phone experience first, then adapt it deliberately for larger screens.
- Treat the user-approved Industri Clicker direction and current repository files as authoritative. Archived predecessor material is not implementation evidence and must not override current project documents.
- Do not invent detailed industrial terminology, currencies, production chains, progression loops, or monetization rules before the design establishes them.

## Default Execution Style

Use `../toolsskills/small-steps/SKILL.md` as the default for routine work. Start with the smallest safe change, inspect only the relevant context, and avoid creating a broad design, plan, refactor, or new abstraction by default.

Escalate to another specialist skill only when the user explicitly asks for it or the task clearly requires its discipline: for example, material product choices need brainstorming, an approved plan needs execution guidance, a defect needs debugging, or a schema/backend change needs explicit review.

## Session Start, Context, and AI check message

Start user-facing work with a short AI check message:

```text
AI check: <1-5> - <brief reason>
```

Use `1` for a clear, low-risk request and `5` for ambiguous or broad work.

The AI must always choose exactly one of the following statements after its AI check message:

1. `This is a research, feedback, or game-design/brainstorming task. I will not edit any code files (.ts/.tsx).`
2. `This task requires a change or addition of code files. I will read the required .md files(listed in mobilegamedev skill) and all relevant context before making any edit to the codebase.`
3. `This task requires a change or addition to database-connecting code. I will read this project's strict policy on isolation of CRUD operations in *Database.ts files. (found in readme.md)`

Before a change, extended research is normally required. Read at least the following context: Then decide what codefiles the change will impact and these should be read as context. Relevant interrelated coding should also be read for Context. Use this order when the listed documents apply:

1. `readme.md` when it exists; otherwise inspect the root project overview files.
2. `docs/WorkingDocs/CONTEXT.md` for canonical game terminology.
3. `docs/WorkingDocs/design.md` for product or mechanic direction.
4. `docs/WorkingDocs/PROJECT_INFO.md` for the selected stack, repository map, commands, and current implementation facts.
5. `docs/WorkingDocs/gameflow.md` for a change to mechanics, economy, tick order, state flow, or persistence.
6. `docs/WorkingDocs/version-log.md` for the last change to the relevant files. (Most recent commit is often sufficient context)
7. `docs/WorkingDocs/VariableRelationshipMap.md` For a overview of all variable and parameters and thier relationships.
8. `docs/WorkingDocs/AIDescriptions_coregame.md` for the current AI description of the core game.


## Core Rules

- Keep services, database CRUD operation and UI separated in different files. Do not put business logic, validation, calculations, or persistence orchestration in UI components.
- Database-interacting code is allowed only in dedicated, domain-bounded `*Database.ts` files (for example, `production/productionDatabase.ts`). Those files own CRUD operations; business files access database operations only by importing functions from the relevant `*Database.ts` file.
- Keep source-of-truth state explicit. Persist primary state, derive display values where practical, and document save boundaries.
- Prefer the smallest change that serves the current stage of the project. Do not introduce backend changes unless the user explicitly approves them.
- Do not preserve legacy data shapes, database tables, rows, schemas, or persistence keys unless the user explicitly requests it. Database edits must deliberately drop anything made obsolete, invalidating older local saves rather than retaining legacy data or compatibility paths.
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
| Explicit user request for parallel research or development | `../superpowers/dispatching-parallel-agents/SKILL.md` | The tasks are independent and have non-overlapping file ownership |
| Expo or React Native implementation | This router and the current official Expo/React Native documentation | The task affects native app code, Android tooling, or mobile UI; a local Expo specialist skill has not yet been created |
| JavaScript or TypeScript engine implementation | `../best-practices/js-ts-best-practices/SKILL.md` | Game-engine, TypeScript, Zustand, or Expo SQLite work |
| Supabase/Postgres schema, query, RLS, or migration work | `../best-practices/supabase-best-practices/SKILL.md` | Supabase has been explicitly introduced for an approved backend need |
| Routine task with no stronger specialist match | `../toolsskills/small-steps/SKILL.md` | Default working style |
| Architecture review or focused cleanup | `../superpowers/improve-codebase-architecture/SKILL.md` | The task is an architecture/refactor review |
| Branch completion, PR preparation, or review feedback | Matching `superpowers` review/branch skill | The user explicitly requests that workflow |
| Handoff for a later session | `../toolsskills/handoff/SKILL.md` | A durable continuation note is requested |

The `superpowers` group is supporting, not a mandatory session entrypoint. Use one matching specialist skill, not several overlapping workflows, unless the task genuinely needs both.

## Documentation Maintenance

When the relevant documents exist and are current:

- Update `CONTEXT.md` for new canonical game terms.
- Update `design.md` for durable player-facing direction and decisions.
- Update `PROJECT_INFO.md` for the chosen stack, commands, source layout, and verified implementation status.
- Update `gameflow.md` for mechanics, tick order, variables, formulas, state ownership, or persistence changes.
- Keep `readme.md` concise: project purpose, setup, and documentation entry points.
- Record version-log entries only after the corresponding commit exists and only from the reviewed commit diff.

## Verification

Use the smallest useful validation for the change. For code or behavior work, run the focused test, type, or build check that the chosen stack supplies. For documentation-only work, review links and stale project-name references, then run `git diff --check` when handing off.

Before claiming a mobile UI task is complete, verify the intended narrow-phone layout and the interaction path, as well as automated checks appropriate to the selected stack.
