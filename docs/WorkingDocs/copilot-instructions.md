# AI Agent Instructions

These instructions are for AI coding agents working on this repository.

Start with `.agents/skills/webgamedev-gram/SKILL.md`. It is the default Office Tycoon router and project-convention authority. Select a local specialist skill only when it matches the task. The `.agents/skills/superpowers/` group is supporting and non-default; do not start ordinary work with `using-superpowers`.

Always read `readme.md`, `docs/WorkingDocs/CONTEXT.md`, `docs/WorkingDocs/design.md`, `docs/WorkingDocs/PROJECT_INFO.md`, and the relevant files in `docs/` before making broad changes. Prefer the current codebase over assumptions from imported documentation.

Never start local dev server or the like unless specifically asked to. User will have dev server open if needed

## Project Direction

This is an early-stage single-player simulation/tycoon game. The current design direction is a software-development/company simulation, but implementation details are still expected to evolve.

Docs may describe intended systems that are not implemented yet. Before claiming something exists, verify it in code and tests.

## Architecture Principles

- Keep game mechanics in engine, service, or domain modules.
- Keep UI components focused on presentation and user interaction.
- Keep persistence behind explicit adapters or services.
- Keep formulas and balance values in named constants or structured data.
- Keep domain types centralized enough that agents do not create duplicate shapes.
- Prefer deterministic mechanics first; add randomness only where it improves gameplay and can be tested.
- Keep calculation helpers numeric. Display formatting helpers such as `formatNumber` should not be used inside engine/store formulas.

Recommended layer direction:

```text
UI/components -> hooks/state actions -> services/engine -> persistence/data
```

Avoid reverse dependencies from engine code into React components.

## Game Loop Guidance

When a tick or progression loop exists, document and preserve its order. New systems should be inserted deliberately.

Typical tick order:

1. Advance time.
2. Progress active work.
3. Complete finished activities.
4. Recalculate quality, bugs, demand, or risk.
5. Process market activity and sales.
6. Process income and expenses.
7. Save or emit state updates.

Add tests when changing tick order or introducing new tick side effects.

## State Management Patterns

- Use focused state modules instead of one large unstructured store.
- Store source-of-truth state, not every derived value.
- Use selectors or services for derived calculations.
- Keep store actions small; complex rules belong in domain services.
- If persisted state is used, clearly define what is saved and what is recalculated on load.
- Do not store functions inside persisted state.

## Hooks and UI Patterns

Use hooks to bridge UI and game state. Hooks may load data, subscribe to updates, expose commands, or format view models.

Keep these boundaries:

- Components render and collect input.
- Hooks adapt state/services to UI.
- Services own rules and side effects.
- Constants/data own tuning values.

For responsive UI, prefer one clear component structure with responsive styles. Split desktop/mobile components only when the interaction model genuinely differs.

## TypeScript Conventions

- Prefer explicit domain types for core game concepts.
- Use discriminated unions for entities with variants.
- Use literal unions for small closed sets.
- Avoid `any` unless isolating unknown external data.
- Validate loaded or external data before trusting it.
- Keep public types stable and avoid duplicating similar interfaces across folders.

## Constants and Balance

All tunable game values should have names and live in a predictable place.

Examples:

- Base prices and development times.
- Software-type reach profiles on software catalog entries.
- Feature complexity weights.
- Quality and bug modifiers.
- Market demand coefficients.
- Finance and cost values.

When adding a magic number, either extract it or explain why it is local and obvious.

Software-specific balance that belongs to one catalog entry can live on that catalog entry. Shared cross-software curves and caps should live in named balance constants.

## Persistence and Database Policy

This project is in early development. Do not overbuild database or migration infrastructure before gameplay needs it.

- Prefer simple local persistence first unless a feature requires a backend.
- If Supabase or another backend is introduced, keep database access out of components.
- During early development, clean schema changes are usually better than compatibility layers.
- Only add migrations, backwards compatibility, or data-preserving workflows when explicitly needed.

## Testing Policy

Because the game may be developed without much UI at first, mechanic tests are mandatory for meaningful systems.

Prioritize tests for:

- Core loop/tick progression.
- Project phase transitions.
- Feature development and completion.
- Quality, bugs, and diminishing returns.
- Sales, demand, and competition formulas.
- Finance and persistence behavior.

Tests should verify player-facing outcomes and edge cases, not just internal implementation.

## Common Pitfalls

- Do not copy old project names, database IDs, routes, tables, or domain entities into this project.
- Do not put business logic in React components.
- Do not add complex persistence before the core mechanics need it.
- Do not claim implementation status from docs alone.
- Do not refactor unrelated systems during feature work.
- Do not hide balance values inside UI code.
- Do not make docs more specific than the current design supports.

## Documentation Rules

- Keep docs agent-readable: clear ownership, expected behavior, test expectations, and file locations.
- Mark planned systems as planned, not implemented.
- Update docs when architecture, commands, or workflow changes.
- Prefer concise instructions over long historical notes.
- Use `docs/WorkingDocs/design.md` for durable product direction, `docs/WorkingDocs/PROJECT_INFO.md` for current implementation status, `docs/WorkingDocs/gameflow.md` for mechanics/data flow, and `docs/WorkingDocs/versionlog.md` for historical change notes.
