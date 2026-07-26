# Project Information

This is the living implementation map for Industri Clicker. Keep it factual and current; product direction belongs in `design.md`, mechanics and state flow in `gameflow.md`, and stable terms in `CONTEXT.md`.

## Current Status

- Project stage: foundation; Expo application scaffold and counter proof of concept are implemented.
- Product: single-player, mobile-first industrial clicker for Android.
- No persistence schema or game systems are implemented yet.

## Repository Size At 0.000d

Measured from the committed `0.000d` tree (`96c190e534516e5410de01fb2624d36eb946fb2d`):

- Tracked files: **91** (`77` Markdown, `13` YAML, and `1` JSON file).
- Estimated repository lines: **~3,155 non-empty text lines** (`4,314` total text lines including blank lines).
- Code-like/configuration lines: **45 non-empty lines** across YAML and JSON; there were no TypeScript, React Native, or application source files yet.

This is a repository-content estimate that includes documentation and agent skills. It is not an estimate of implemented game code; implemented application LOC is currently zero.

## Locked Stack

- Expo + React Native + TypeScript + Expo Router.
- React Native Paper and React Native core components.
- Zustand for runtime state and Expo SQLite for deliberate local saves.
- Supabase is deferred until an approved cloud requirement exists.

## Current Repository Shape

```text
readme.md                         Project overview and stack decision
VariableRelationshipMap.md        Variable dependency template
docs/WorkingDocs/                 Canonical working documentation
skills/                           Router and local specialist skills
olditerations/                    Archived predecessor reference material
```

```text
app/                              Expo Router screens and root provider
stores/                           Zustand runtime state
assets/                           Expo application icons and splash asset
app.json                          Expo application configuration
package.json                      Dependencies and development commands
```

## Current App Routes

- `/` â€” counter proof-of-concept screen.

## Available Commands

- `npm run start` â€” start Expo development server.
- `npm run android` â€” start Expo and open Android preview.
- `npm run web` â€” start browser development preview.
- `npm run typecheck` â€” TypeScript validation without emitting files.

## Documentation Map

- `CONTEXT.md` — canonical domain language.
- `design.md` — durable product direction.
- `gameflow.md` — mechanics, tick order, formulas, state, and persistence flow.
- `../../VariableRelationshipMap.md` — variable ownership, dependencies, command effects, and persistence relationships.
- `AIDescriptions_coregame.md` — verified implementation status and deferred areas.
- `AI_AGENT_INSTRUCTIONS.md` — concise AI working rules.
- `AIpromt_codecleaning.md` — cleanup workflow.
- `AIpromt_docs.md` — documentation-maintenance workflow.
- `versionlog.md` — commit-backed change history.

## Core Gameplay Direction

Planned: an industrial clicker with explicit progression, economy, and time-controlled game flow. Define concrete systems in `design.md` and `gameflow.md` before marking them implemented here.

## AI Development Priorities

1. Keep game mechanics testable outside the UI.
2. Keep UI, game logic, Zustand state, and Expo SQLite adapters separate.
3. Prefer deterministic formulas and named balance values.
4. Keep the game local-first; do not add cloud infrastructure without approval.
5. Keep documentation tied to verified code and tests.

## Implementation Status Labels

- **Planned** — agreed direction, not built.
- **In Progress** — partially built and changing.
- **Implemented** — built and covered by relevant verification.
- **Deferred** — intentionally postponed.

## Implemented Systems

- **Counter proof of concept** â€” Implemented. The `/` route renders a React Native Paper button that increments Zustand-managed in-memory state. Verified with `npm run typecheck` and `npx expo export --platform web`.

## Maintenance Notes

Update this document when the scaffold, source layout, commands, routes, major ownership boundaries, or verified systems change.
