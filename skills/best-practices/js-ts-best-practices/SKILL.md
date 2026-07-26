---
name: js-ts-best-practices
description: Use for TypeScript game-engine, Expo/React Native, Zustand, Expo SQLite, shared-type, and safe-refactor work in Industri Clicker.
---

# TypeScript Best Practices

Use this skill for TypeScript implementation after `../../mobilegamedev-gram/SKILL.md` establishes scope. Follow the actual Expo project layout once scaffolded; do not import assumptions from prior web projects.

## Use When

- Writing or refactoring game rules, tick logic, services, types, constants, Zustand state, or Expo SQLite adapters.
- Updating React Native component props, hooks, selectors, or view models.
- Moving code between UI, game logic, state, persistence, constants, and tests.
- Tightening types or reviewing a TypeScript change for safe ownership boundaries.

## Rules

- Keep engine calculations deterministic and independent from React Native, Zustand, SQLite, and display formatting.
- Keep UI components focused on rendering and commands; hooks/selectors adapt state to the UI.
- Keep Zustand state explicit and local persistence behind dedicated Expo SQLite adapters.
- Use explicit domain types, narrow unions, exhaustive handling, and type guards; avoid `any`.
- Put tunable gameplay values in named constants or structured balance data.
- Update shared types before consumers when a domain shape changes. Do not add legacy aliases, wrappers, or compatibility data shapes.
- Avoid unnecessary exports and abstractions. Follow existing module boundaries instead of inventing barrels or folder conventions.
- Supabase is not available by default. Use `../supabase-best-practices/SKILL.md` only after an approved backend task introduces it.

## Workflow

1. Identify the smallest ownership area: UI, engine, state, persistence, constants, types, tests, or docs.
2. Read only the affected modules and their direct contracts.
3. Make the smallest typed change that preserves the engine/UI/persistence separation.
4. Add or update focused tests for player-visible behavior when mechanics change.
5. Run the smallest relevant verification supplied by the scaffolded project.

## Verification

Do not assume scripts before the Expo project exists. Once it does, run the focused type, unit, or UI check appropriate to the change; use `git diff --check` at handoff.
