# Project Information

Verified repository facts. Documentation ownership is defined in the root [readme.md](../../readme.md); product choices are in [design.md](design.md), mechanics in [gameflow.md](gameflow.md), and relationships in [VariableRelationshipMap.md](VariableRelationshipMap.md).

## Status

- Stage: pre-alpha foundation.
- Product: single-player, mobile-first native Android game.
- Implemented domains: local profile/company saves, tutorial onboarding, facilities and production (including staff wages and production-maintenance allocation), inventory/markets/quality, Finance/loans, customer orders, research, achievements, prestige, grants, repairs, and IndustriPedia.
- Deferred: offline catch-up, cloud/accounts, iOS/web release, and workforce systems beyond current staffing and repair automation.

## Code Size

Measured 2026-08-23 from the working tree:

- Application (`app/`, `game/`, `ui/`, root helpers): 15,805 non-empty TypeScript lines in 124 files.
- Tests (`tests/`): 3,093 lines in 22 files.
- Total: 18,898 lines in 146 files; excludes docs, skills, lockfiles, and generated output.

## Stack and Shape

- Expo SDK 54, React Native, TypeScript, Expo Router, React Native Paper, Zustand, Expo SQLite, and Vitest.
- No cloud backend. Public barrels: `game/core/index.ts`, `game/index.ts`, `ui/index.ts`.

```text
app/                  Expo Router screens/providers
ui/dashboard/         Views, components, and presentation helpers
game/                 Rules, catalogues, state, time, and persistence
tests/                Domain and economy checks
tools/                Economy-report wrapper
.github/workflows/    Manual Android APK workflow
docs/WorkingDocs/     Canonical working documentation
theme.ts              Shared Paper theme/tokens
```

## Routes and Commands

- `/`: local player/company selection, then Company, Inventory, Facility, Finance, Sales, Research, Profile, Settings, Achievements, IndustriPedia, and the Leaderboard placeholder. Admin is development-only.
- `npm run start`: Expo Go server. `npm run android`: optional emulator. `npm run web`: browser layout aid.
- `npm run typecheck`: TypeScript check. `npm test`: Vitest suite. `npm run economy:report`: generate economy evidence.

## Android Distribution

- `eas.json` `preview` creates a directly installable APK; the provisional application ID is `com.industriclicker.facilities`.
- `npx eas-cli@latest build --platform android --profile preview` runs the build. `.github/workflows/android-apk.yml` runs a manual local build with `EXPO_TOKEN` and uploads the APK.
