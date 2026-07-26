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
- Supabase is deferred. Do not add backend, cloud sync, accounts, web release, iOS release, or compatibility layers without explicit approval.
- Do not commit, push, launch a development server, create a release build, or run broad verification unless the user explicitly asks or the task clearly justifies it.
- Use focused verification and report only checks that actually ran.

## Documentation

Read the smallest relevant context from `readme.md` and `docs/WorkingDocs/`. `CONTEXT.md` is the canonical domain glossary.
