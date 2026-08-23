# Code Cleanup and Optimization Prompt

Use this guide for behavior-preserving cleanup of Industri Clicker.

## Cleanup Targets

 We are looking for illogical or inefficient coding. Simplification or overimplementation. We are looking if it's implemented similarly to the rest of the codebase and obeys project rules and architecture.

- Illogical ownership between React Native UI, game logic, Zustand state, Expo SQLite adapters, types, and constants.
- Duplicate rules, dead code, unused imports, stale exports, or obsolete placeholders.
- Unnecessary rerenders, repeated calculations, or persistence writes on frequent taps.
- Magic balance values and comments that only restate code.

## Areas to Review

- Pure engine/services: progression, economy, tick order, and formulas.
- Zustand state: source-of-truth data, selectors, and update boundaries.
- Expo SQLite adapters: durable reads, writes, and save timing.
- React Native UI: duplicated layouts, large components, and leaked business logic.
- UI styling: styles mixed into oversized screens, duplicated visual tokens, or screen styles incorrectly promoted into shared theme values.
- Types, constants, and tests.

## Cleanup Goals

- Improve clarity, mobile responsiveness, and ownership without changing gameplay.
- Keep rules out of UI and persistence out of game logic.
- Keep shared colors, spacing, typography, and Paper theme configuration in the shared theme module; keep screen-specific `StyleSheet` rules in a styles file beside each screen.
- Do not create a global catch-all stylesheet or move a style into shared theme code unless more than one screen genuinely uses it.
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
