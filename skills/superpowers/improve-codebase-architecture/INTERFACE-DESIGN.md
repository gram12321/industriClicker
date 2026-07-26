# Interface Design For Industri Clicker

Use this reference when an approved architecture review needs alternatives for a real module boundary.

## Process

1. Describe the current caller, owner, inputs, outputs, invariants, and dependencies using `LANGUAGE.md` and `docs/WorkingDocs/CONTEXT.md`.
2. Sketch two small alternatives only when the existing interface cannot meet the approved goal safely.
3. Compare them by player-facing behavior, testability, ownership clarity, and implementation cost.
4. Recommend the smallest interface that hides complexity without creating a speculative layer.

## Project Constraints

- Game-rule interfaces must be independent of React Native, Zustand, Expo SQLite, and display formatting.
- UI interfaces should express events and render-ready data, not persistence or formula details.
- Persistence interfaces should express deliberate snapshots and restore results, not player-facing business rules.
- Do not introduce cloud, account, sync, migration, or multi-agent design work without explicit user approval.

If the user explicitly requests parallel design exploration, use `../dispatching-parallel-agents/SKILL.md` only after dividing the work into non-overlapping research scopes.
