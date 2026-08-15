# Project Information

Verified repository facts for Industri Clicker. Product choices belong in [design.md](design.md) and mechanics in [gameflow.md](gameflow.md).

## Current Status

- Stage: foundation.
- Product: single-player, mobile-first industrial clicker for Android.
- Implemented foundation: dashboard shell, local player/company selection, company-keyed local saves, standard-start onboarding, tutorial-guide placeholder, inventory with categorized foreground-time flow history, local/regional/global market, facilities, classified finance statements and rolling cash flow, local loans and credit ratings, customer orders and relationships, foreground production with multi-output recipes, tiered company achievements, company prestige, local-first progression gates and grants, foreground research, IndustriPedia, and local saves.
- Deferred: offline catch-up, broader workforce systems and maintenance interactions, and cloud services.

## Code Size

Measured from the current working tree on 2026-07-31:

- Application source: 4,281 non-empty TypeScript lines across 58 `.ts` and `.tsx` files.
- Project configuration: 96 non-empty lines across `metro.config.js`, `app.json`, `package.json`, and `tsconfig.json`.
- Combined: 4,377 non-empty lines, excluding documentation, skills, lockfiles, and generated output.

## Stack

- Expo SDK 54, React Native, TypeScript, and Expo Router.
- React Native Paper and React Native core components.
- Zustand for runtime state and Expo SQLite for deliberate local saves.
- No cloud backend.

Public import barrels are `game/core/index.ts`, `game/index.ts`, and `ui/index.ts`. They use wildcard re-exports; internal modules may retain leaf imports to avoid dependency cycles.

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

- `/` — local player/company selection until a company is active, then the dashboard with Company, Inventory, Production, Finance, Sales, Profile, Settings, Leaderboard placeholder, Achievements, Research, and IndustriPedia views.
- `npm run start` — Expo development server for Expo Go.
- `npm run android` — optional Android emulator shortcut.
- `npm run web` — local browser development preview.
- `npm run typecheck` — TypeScript validation without emitting files.
- `npm test` — deterministic Vitest checks for game-engine rules and recipe balance.
- `npm run economy:report` — prints recipe margins, market pressure, maintenance, break-even, payback, and upgrade-level tables, and writes `economy-report.md` for economy balancing.

## Android Distribution

- `eas.json` defines an internal `preview` profile that creates an APK for direct Android-device installation without Expo Go or a development server.
- Run `npx eas-cli@latest build --platform android --profile preview` to create the APK through EAS Build. The first run signs in to Expo and associates the project with an Expo account.
- The current Android application ID is the provisional `com.industriclicker.facilities`; it must be kept stable after the first Google Play upload.

## Documentation

- [CONTEXT.md](CONTEXT.md): terminology.
- [design.md](design.md): player-facing direction.
- [gameflow.md](gameflow.md): system rules and lifecycle.
- [VariableRelationshipMap.md](VariableRelationshipMap.md): variable relationships.
- [AIpromt_docs.md](AIpromt_docs.md): documentation ownership rules.
