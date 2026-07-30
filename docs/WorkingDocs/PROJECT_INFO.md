# Project Information

This is the factual implementation map for Industri Clicker: repository shape, commands, routes, stack, and verified implementation status. Product direction belongs in `design.md`; mechanics belong in `gameflow.md`; stable terms belong in `CONTEXT.md`.

## Current Status

- Project stage: foundation.
- Product: single-player, mobile-first industrial clicker for Android.
- Implemented foundation: dashboard shell, resource/inventory, facilities, finance, sales contracts, foreground production, company prestige, IndustriPedia, and local saves.
- Deferred: offline catch-up, markets, additional staffing factors, and cloud services.

## Code Size At 0.00053

Measured from the latest repository commit (`89309b4`, version `0.00053`, dated 2026-07-30):

- Application source: **3,486 non-empty TypeScript lines** across 45 `.ts`/`.tsx` files.
- Project configuration: **96 non-empty lines** across `metro.config.js`, `app.json`, `package.json`, and `tsconfig.json`.
- Combined application source and project configuration: **3,582 non-empty lines**.

These counts exclude Markdown documentation, agent skills, dependency lockfiles, and generated `.tmp-web-export` output.

## Locked Stack

- Expo SDK 54 with React Native, TypeScript, and Expo Router.
- React Native Paper and React Native core components.
- Zustand for runtime state.
- Expo SQLite for deliberate local saves.
- Supabase is deferred until an approved cloud requirement exists.

## Repository Shape

```text
readme.md                         Project overview and stack decision
docs/WorkingDocs/                 Canonical working documentation
skills/                           Router and local specialist skills
olditerations/                    Archived predecessor reference material
app/                              Expo Router screens and root provider
ui/dashboard/                     Dashboard views, reusable components, and UI helpers
theme.ts                          Shared visual tokens and Paper theme
game/                             Resource, recipe, facility, finance, sales, prestige, time, math, and persistence logic
stores/                           Zustand runtime state
assets/                           Expo application icons and splash asset
app.json                          Expo application configuration
package.json                      Dependencies and development commands
```

## Current App Routes

- `/` — dashboard with Company, Inventory, Production, Finance, Profile, and IndustriPedia views.

## Available Commands

- `npm run start` — start Expo development server.
- `npm run android` — optional emulator shortcut; physical devices use Expo Go through `npm run start`.
- `npm run web` — start browser development preview.
- `npm run typecheck` — TypeScript validation without emitting files.

## Documentation Map

- [CONTEXT.md](CONTEXT.md) — canonical domain language.
- [design.md](design.md) — durable player-facing direction and decisions.
- [gameflow.md](gameflow.md) — mechanics, formulas, tick order, state, and persistence flow.
- [VariableRelationshipMap.md](VariableRelationshipMap.md) — concrete variable ownership and dependencies.
- [AIpromt_docs.md](AIpromt_docs.md) — documentation boundaries and maintenance rules.

## Maintenance Notes

Update this document when the scaffold, source layout, commands, routes, or verified implementation status changes. Do not copy detailed product rules here; link to the owning working document instead.
