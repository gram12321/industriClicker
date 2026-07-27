# Project Information

This is the factual implementation map for Industri Clicker: repository shape, commands, routes, stack, and verified implementation status. Product direction belongs in `design.md`; mechanics belong in `gameflow.md`; stable terms belong in `CONTEXT.md`.

## Current Status

- Project stage: foundation.
- Product: single-player, mobile-first industrial clicker for Android.
- Implemented foundation: dashboard shell, resource/inventory, facilities, finance, foreground production, and versioned local saves.
- Deferred: offline catch-up, markets, upgrades, and cloud services.

## Repository Size At 0.0006a

Measured from the latest recorded version tree (`84d1189409f70caf731050642d7cb8b1a2dc4680`, dated 2026-07-27):

- Tracked files: **128** (`76` Markdown, `13` YAML, `6` JSON, and `21` TypeScript files).
- Estimated repository lines: **~15,790 non-empty text lines** (`17,207` total text lines including blanks).

This includes documentation, agent skills, configuration, generated inspection output, and application source. It is a repository-content estimate, not a measure of the player-facing feature scope.

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
| Dashboard | `/` renders the safe-area-aware dashboard and locally switches Company, Inventory, Production, and Finance views. | Implemented; typechecked |
| Resources | `ResourceType` contains Grain, Bread, Water, and Electricity; definitions are code-owned. | Implemented |
| Inventory | Zustand owns an `Inventory` with quantity and placeholder quality; typed add/remove commands exist. | Implemented |
| Facilities | Farm, Bakery, and Small Utility Works definitions plus constructed facility state exist. | Implemented |
| Finance | Starts at €10,000 and records accepted signed transactions; Farm and Bakery cost €60 and €300. | Implemented |
| Production | Active facilities advance by one work unit per foreground real minute; inputs are paid at cycle start; fast-forward uses the same path. | Implemented |
| Local save | One versioned `GameSnapshot` persists finance, inventory, facilities, recipes, and progress in Expo SQLite. Saves batch briefly and flush on background/provider cleanup. | Implemented |
| Offline production | Background/offline time grants no work. | Deferred |

## Documentation Map

- [CONTEXT.md](CONTEXT.md) — canonical domain language.
- [design.md](design.md) — durable player-facing direction and decisions.
- [gameflow.md](gameflow.md) — mechanics, formulas, tick order, state, and persistence flow.
- [VariableRelationshipMap.md](VariableRelationshipMap.md) — concrete variable ownership and dependencies.
- [AIpromt_docs.md](AIpromt_docs.md) — documentation boundaries and maintenance rules.

## Maintenance Notes

Update this document when the scaffold, source layout, commands, routes, or verified implementation status changes. Do not copy detailed product rules here; link to the owning working document instead.
