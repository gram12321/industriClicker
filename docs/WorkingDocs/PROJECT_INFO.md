# Project Information

This is the living implementation map for Industri Clicker. Keep it factual and current; product direction belongs in `design.md`, mechanics and state flow in `gameflow.md`, and stable terms in `CONTEXT.md`.

## Current Status

- Project stage: foundation; Expo application scaffold and first dashboard UI shell are implemented.
- Product: single-player, mobile-first industrial clicker for Android.
- The class-based resource, inventory, facility, and finance foundations are implemented. Durable persistence and production execution remain deferred.

## Repository Size At 0.000d

Measured from the committed `0.000d` tree (`96c190e534516e5410de01fb2624d36eb946fb2d`):

- Tracked files: **91** (`77` Markdown, `13` YAML, and `1` JSON file).
- Estimated repository lines: **~3,155 non-empty text lines** (`4,314` total text lines including blank lines).
- Code-like/configuration lines: **45 non-empty lines** across YAML and JSON; there were no TypeScript, React Native, or application source files yet.

This is a repository-content estimate that includes documentation and agent skills. It is not an estimate of implemented game code; implemented application LOC is currently zero.

## Locked Stack

- Expo SDK 54 + React Native + TypeScript + Expo Router.
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
app/index.styles.ts               Dashboard screen-specific styles
theme.ts                          Shared visual tokens and React Native Paper theme
game/resources/                   Resource enum, class definitions, registry, and display icons
game/inventory/                   Player inventory domain class and plain snapshot shape
game/recipes/                     Recipe enum, definitions, and typed contracts
game/facilities/                  Facility types, definitions, player state, and snapshot shapes
game/finance/                     Player balance, transaction ledger, and snapshot shape
game/state/                       Top-level plain runtime snapshot contracts
stores/                           Zustand runtime state
assets/                           Expo application icons and splash asset
app.json                          Expo application configuration
package.json                      Dependencies and development commands
```

## Current App Routes

- `/` â€” dashboard UI shell with Company, Production, and Finance views.

## Available Commands

- `npm run start` â€” start Expo development server.
- `npm run android` â€” optional emulator shortcut; for a physical phone, use `npm run start` and open the QR code in Expo Go.
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

- **Dashboard UI shell** â€” Implemented. The `/` route renders a safe-area-aware top bar, live balance overview, profile menu, notification control, and locally switched Company, Production, and Finance tabs. Shared visual tokens live in `theme.ts`; dashboard layout rules live in `app/index.styles.ts`. The Company tab reads the resource inventory from Zustand; persistence remains deferred. Verified with `npm run typecheck`.

## Resource And Inventory Foundation

- **Implemented:** `ResourceType` is a closed enum containing Grain and Bread; code-owned `Resource` instances live in a registry.
- **Implemented:** The Zustand game store owns an `Inventory` class that keeps each resource quantity with its placeholder quality (`1`) and exposes typed add/remove commands.
- **Implemented:** `InventorySnapshot` is a plain data shape reserved for a later Expo SQLite adapter. Grain and Bread recipe definitions are code-owned and exposed to their facilities; production execution remains deferred.
- **Implemented:** The Company tab displays the two empty inventory entries using the familiar Grain and Bread symbols from Baseclicker.
- **Deferred:** Local/global markets and durable persistence.

## Facility Foundation

- **Implemented:** `FacilityType` is a closed enum containing Farm and Bakery. Their code-owned definitions expose compatible recipe identifiers and Material Design icons.
- **Implemented:** `Facility` and `FacilityCollection` own player construction, selected-recipe, and active-state data. The Zustand game store exposes typed build and recipe-selection commands, replacing class instances after changes so selectors update.
- **Implemented:** `GameSnapshot` combines inventory, facility, and finance snapshots; a later Expo SQLite adapter can persist all three state groups together.
- **Implemented:** The Production tab displays Farm and Bakery construction status. Its touch-friendly build controls open a confirmation dialog with the cost and resulting balance before construction is applied.
- **Implemented:** Constructed facilities show a destructive action that requires a second confirmation. Demolition removes the facility and does not refund its construction cost.
- **Deferred:** Recipe execution, production timing, upgrades, and the Expo SQLite repository.

## Finance Foundation

- **Implemented:** `Finance` starts at €10,000 and records accepted signed transactions with their balance-after value and timestamp. Negative balances are rejected.
- **Implemented:** Farm and Bakery construction costs are €60 and €300, respectively. Their cost is checked and recorded by the Zustand-owned `buildFacility` command.
- **Implemented:** The header shows the live balance; the Finance tab shows the current balance and three most recent transactions.

## Maintenance Notes

Update this document when the scaffold, source layout, commands, routes, major ownership boundaries, or verified systems change.

The preferred native development loop is Expo Go on a physical Android device. The Android Emulator is optional, and Expo web is a development aid rather than a release target.
