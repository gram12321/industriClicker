---
name: improve-codebase-architecture
description: Use for an explicitly requested architecture review or focused cleanup of Industri Clicker's Expo, React Native, TypeScript, Zustand, or Expo SQLite code.
---

# Improve Codebase Architecture

Use this skill only for an explicit architecture/refactor review. It is not a mandatory completion gate and must not broaden a routine task.

## Review Focus

- Keep React Native screens and components focused on rendering and interaction.
- Keep deterministic gameplay, economy, and tick rules in pure TypeScript modules.
- Keep Zustand state focused on runtime source-of-truth data and selectors.
- Keep Expo SQLite reads and writes in dedicated persistence adapters.
- Keep balance values named and outside UI code.
- Prefer clear ownership over needless layers, pass-through wrappers, barrels, or abstractions.

## Workflow

1. Read the relevant current modules, `readme.md`, and domain glossary.
2. Identify concrete friction with file references: unclear ownership, duplicate rules, UI-owned logic, persistence leakage, stale abstractions, or mobile-performance risk.
3. Present only focused candidates with the problem, smallest change, benefits, and risk.
4. Wait for user direction before making a broad refactor.
5. Verify the affected behavior and preserve the locked mobile stack.

## Constraints

- Follow the current Expo project layout and documented ownership; do not invent unapproved layers or conventions.
- Do not introduce Supabase, schema changes, or shared abstractions without explicit approval.
- Do not use subagents unless the user explicitly requests parallel work and `dispatching-parallel-agents` applies.
