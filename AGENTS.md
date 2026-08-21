# Industri Clicker Agent Instructions

This is the canonical cross-environment instruction set for Industri Clicker.

## Agent Workflow

Start repository work with `skills/mobilegamedev-gram/SKILL.md`. It is the default Industri Clicker router and project-convention authority.

Use `skills/toolsskills/small-steps/SKILL.md` as the default working style. Select another local specialist skill under `skills/` only when the user explicitly requests it or the task clearly requires that discipline.

## Project Rules

- Industri Clicker is a local-first, single-player, mobile-first Android game.
- Use Expo, React Native, TypeScript, Expo Router, React Native Paper, Zustand, and Expo SQLite.
- Keep React Native UI, pure game logic, Zustand state, and Expo SQLite adapters separate.
- Keep formulas deterministic, typed, named, and testable outside UI components.
- Put code-owned domain catalogues, balance values, and deterministic game configuration in that domain's named `*Constants.ts` module. Keep only technical implementation details, such as numerical tolerances and SQLite identifiers, local to their owning module.
- Use `game/core/index.ts`, `game/index.ts`, and `ui/index.ts` as the public barrel surfaces. Prefer wildcard re-exports there; keep internal leaf imports when a barrel would create a dependency cycle.
- Supabase is deferred. Do not add backend, cloud sync, accounts, web release, or iOS release without explicit approval.
- Do not add backward-compatibility layers for code, local-save shapes, tables, or persistence keys. When a persisted shape changes, deliberately version it and allow older saves to be discarded unless the user explicitly approves a migration.
- Do not commit, push, launch a development server, create a release build, or run broad verification unless the user explicitly asks or the task clearly justifies it.
- Choose verification by impact: run focused tests for the files or behavior changed, and do not run the full test suite for every change. Run the full suite only when the change is cross-cutting, affects many domains, or reaches an integration/release checkpoint.
- Run the facility-production and recipe-balance tests when a change can affect facility production, recipe balance, facility work/upgrade formulas, production tick order, or the corresponding tests.
- Use focused verification and report only checks that actually ran.

## Documentation

Read the smallest relevant context from `readme.md` and `docs/WorkingDocs/`. `CONTEXT.md` is the canonical domain glossary.
