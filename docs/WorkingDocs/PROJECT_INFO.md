# Project Information

Verified repository facts for Industri Clicker. Product choices belong in [design.md](design.md) and mechanics in [gameflow.md](gameflow.md).

## Current Status

- Stage: foundation.
- Product: single-player, mobile-first industrial clicker for Android.
- Implemented foundation: dashboard shell, inventory, facilities, finance, sales contracts, foreground production, company prestige, IndustriPedia, and local saves.
- Deferred: offline catch-up, markets, broader staffing factors, and cloud services.

## Code Size

Measured from the current working tree on 2026-07-30:

- Application source: 3,652 non-empty TypeScript lines across 46 `.ts` and `.tsx` files.
- Project configuration: 96 non-empty lines across `metro.config.js`, `app.json`, `package.json`, and `tsconfig.json`.
- Combined: 3,748 non-empty lines, excluding documentation, skills, lockfiles, and generated output.

## Stack

- Expo SDK 54, React Native, TypeScript, and Expo Router.
- React Native Paper and React Native core components.
- Zustand for runtime state and Expo SQLite for deliberate local saves.
- No cloud backend.

## Repository Shape

```text
app/                  Expo Router screens and providers
ui/dashboard/         Dashboard views, components, and UI helpers
game/                 Game rules, catalogues, time, math, and persistence
stores/               Zustand runtime state
docs/WorkingDocs/     Canonical working documentation
theme.ts              Shared Paper theme and visual tokens
```

## Routes and Commands

- `/` — dashboard with Company, Inventory, Production, Finance, Profile, and IndustriPedia views.
- `npm run start` — Expo development server for Expo Go.
- `npm run android` — optional Android emulator shortcut.
- `npm run web` — local browser development preview.
- `npm run typecheck` — TypeScript validation without emitting files.

## Documentation

- [CONTEXT.md](CONTEXT.md): terminology.
- [design.md](design.md): player-facing direction.
- [gameflow.md](gameflow.md): system rules and lifecycle.
- [VariableRelationshipMap.md](VariableRelationshipMap.md): variable relationships.
- [AIpromt_docs.md](AIpromt_docs.md): documentation ownership rules.
