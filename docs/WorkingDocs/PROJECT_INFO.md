# Project Information

This is the factual implementation map for Industri Clicker: repository shape, commands, routes, stack, and verified implementation status. Product direction belongs in `design.md`; mechanics belong in `gameflow.md`; stable terms belong in `CONTEXT.md`.

## Current Status

- Project stage: foundation.
- Product: single-player, mobile-first industrial clicker for Android.
- Implemented foundation: dashboard shell, resource/inventory, facilities, finance, sales contracts, foreground production, and versioned local saves.
- Deferred: offline catch-up, markets, additional staffing factors, and cloud services.

## Code Size At 0.0006a

Measured from the latest recorded version tree (`84d1189409f70caf731050642d7cb8b1a2dc4680`, dated 2026-07-27):

- Application source: **1,646 non-empty TypeScript lines** across 21 `.ts`/`.tsx` files.
- Project configuration: **96 non-empty lines** across `metro.config.js`, `app.json`, `package.json`, and `tsconfig.json`.
- Combined application source and project configuration: **1,742 non-empty lines**.

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
theme.ts                          Shared visual tokens and Paper theme
game/                             Resource, recipe, facility, finance, time, and persistence logic
stores/                           Zustand runtime state
assets/                           Expo application icons and splash asset
app.json                          Expo application configuration
package.json                      Dependencies and development commands
```

## Current App Routes

- `/` — dashboard with Company, Inventory, Production, and Finance views.

## Available Commands

- `npm run start` — start Expo development server.
- `npm run android` — optional emulator shortcut; physical devices use Expo Go through `npm run start`.
- `npm run web` — start browser development preview.
- `npm run typecheck` — TypeScript validation without emitting files.

## Verified Implementation Map

| Area | Current fact | Verification/status |
|---|---|---|
| Dashboard | `/` renders the safe-area-aware dashboard and locally switches Company, Inventory, Production, Sales, and Finance views. | Implemented; typechecked |
| Resources | `ResourceType` contains Grain, Bread, Water, Electricity, Sugar, Coal, and Cake; definitions are code-owned. | Implemented |
| Inventory | Zustand owns an `Inventory` with quantity and placeholder quality; typed add/remove commands exist. | Implemented |
| Facilities | Farm, Bakery, Small Utility Works, Mine, Water Well, and Power Plant definitions plus constructed facility state exist. | Implemented |
| Facility upgrades | Each facility supports money-funded Speed and Output upgrades, locally assigned workers, and staffing-based production efficiency. | Implemented; typechecked |
| Finance | Starts at €10,000 and records accepted signed transactions; Farm and Bakery cost €60 and €300. | Implemented |
| Foreground game time | One global foreground-time command advances logical game time, production in one-second steps, whole-minute sales, and the customer pipeline; fast-forward uses the identical one-second simulation. | Implemented |
| Sales contracts | Each foreground minute rolls a diminishing chance to create a random resource contract; a visual per-second pipeline estimate resets after each created offer. Valid fulfilment removes inventory, credits €1 per unit, and retains a completed record. | Implemented |
| Sales history | The Sales view separates Open and Closed contracts, with Completed/Rejected filtering inside Closed. | Implemented |
| Local save | One versioned `GameSnapshot` persists finance, inventory, facilities/recipes/progress, sales, logical game time, retained partial sales time, and pipeline progress in Expo SQLite. Saves batch for up to five seconds and processes then flushes time on background/provider cleanup. | Implemented |
| Offline production | Background/offline time grants no work. | Deferred |

## Documentation Map

- [CONTEXT.md](CONTEXT.md) — canonical domain language.
- [design.md](design.md) — durable player-facing direction and decisions.
- [gameflow.md](gameflow.md) — mechanics, formulas, tick order, state, and persistence flow.
- [VariableRelationshipMap.md](VariableRelationshipMap.md) — concrete variable ownership and dependencies.
- [AIpromt_docs.md](AIpromt_docs.md) — documentation boundaries and maintenance rules.

## Maintenance Notes

Update this document when the scaffold, source layout, commands, routes, or verified implementation status changes. Do not copy detailed product rules here; link to the owning working document instead.
