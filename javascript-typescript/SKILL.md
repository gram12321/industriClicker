---
name: javascript-typescript
description: JavaScript and TypeScript development for this repository. Use when working on frontend, backend, tests, tooling, React, Vite, Node.js, or shared TypeScript code.
---

# JavaScript/TypeScript Development

Use this skill for JavaScript and TypeScript work in this repository.

## Required Context

Read docs progressively based on the change:

1. Always read `readme.md` for project baseline.
2. Read `docs/copilot-instructions.md` for agent rules and architecture conventions.
3. Read `docs/AIDescriptions_coregame.md` when touching game mechanics, tick order, balancing, persistence, or cross-system behavior.
4. Read `docs/PROJECT_INFO.md` when adding folders, scripts, or architecture.

Do not copy assumptions from older projects into this one.

## Execution Rules

- Keep game mechanics out of UI components.
- Keep formulas and balance values in constants or structured data.
- Prefer deterministic, testable services or engine modules for core rules.
- Use TypeScript types to describe domain concepts explicitly.
- Avoid `any` unless isolating unknown external data.
- Preserve local formatting style and avoid unrelated refactors.
- Prefer barrel exports only where the project has established them.
- Update docs when commands, architecture, or conventions change.

## React Guidance

- Components render state and collect user input.
- Hooks adapt services/state to UI.
- Services or engine modules own business rules.
- Keep responsive UI simple until the interaction model needs separate mobile and desktop components.

## Validation

Run the narrowest relevant checks available in the repository. As the project matures, prefer:

- Type checking
- Unit tests for mechanics
- Linting
- Build verification

If no scripts exist yet, state that validation was limited to file review.
