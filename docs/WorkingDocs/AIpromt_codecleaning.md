# Code Cleanup and Optimization Prompt

Use this guide for behavior-preserving cleanup of Industri Clicker.

## Cleanup Targets

- Illogical ownership between React Native UI, game logic, Zustand state, Expo SQLite adapters, types, and constants.
- Duplicate rules, dead code, unused imports, stale exports, or obsolete placeholders.
- Unnecessary rerenders, repeated calculations, or persistence writes on frequent taps.
- Magic balance values and comments that only restate code.

## Areas to Review

- Pure engine/services: progression, economy, tick order, and formulas.
- Zustand state: source-of-truth data, selectors, and update boundaries.
- Expo SQLite adapters: durable reads, writes, and save timing.
- React Native UI: duplicated layouts, large components, and leaked business logic.
- Types, constants, and tests.

## Cleanup Goals

- Improve clarity, mobile responsiveness, and ownership without changing gameplay.
- Keep rules out of UI and persistence out of game logic.
- Prefer deletion and simplification over new abstractions.
- Preserve behavior unless the task explicitly includes a behavior change.

## Cleanup Process

1. Read the affected code and relevant working docs.
2. Identify concrete issues with file references.
3. Separate safe cleanup from behavior-risking changes.
4. Make the smallest useful change.
5. Run focused verification.
6. Update docs only when conventions, layout, or behavior changed.

## Import and Export Preferences

Follow the actual Expo project structure. Avoid private deep imports and do not create barrel files, wrappers, aliases, or compatibility layers merely for style.

## Agent Instruction Template

State the subsystem, whether behavior changes are allowed, relevant verification, and known risk areas.
