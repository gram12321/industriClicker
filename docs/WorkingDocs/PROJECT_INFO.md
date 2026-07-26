# Project Information

This is the living implementation map for Industri Clicker. Keep it factual and current; product direction belongs in `design.md`, mechanics and state flow in `gameflow.md`, and stable terms in `CONTEXT.md`.

## Current Status

- Project stage: foundation and documentation consolidation.
- Product: single-player, mobile-first industrial clicker for Android.
- No application source, routes, persistence schema, or game systems are implemented yet.

## Locked Stack

- Expo + React Native + TypeScript + Expo Router.
- React Native Paper and React Native core components.
- Zustand for runtime state and Expo SQLite for deliberate local saves.
- Supabase is deferred until an approved cloud requirement exists.

## Current Repository Shape

```text
README.md                         Project overview and stack decision
docs/WorkingDocs/                 Canonical working documentation
skills/                           Router and local specialist skills
```

Update this map after the Expo project is scaffolded; do not invent `src/`, routes, scripts, or database folders before then.

## Current App Routes

Planned. Record actual Expo Router routes only after implementation.

## Available Commands

Planned. Record actual package scripts and Expo commands after scaffolding.

## Documentation Map

- `CONTEXT.md` — canonical domain language.
- `design.md` — durable product direction.
- `gameflow.md` — mechanics, tick order, formulas, state, persistence flow, and the variable relationship map.
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

None yet. Add entries only after code and relevant verification exist.

## Maintenance Notes

Update this document when the scaffold, source layout, commands, routes, major ownership boundaries, or verified systems change.
