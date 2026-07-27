# Industri Clicker Variable Relationship Map

Use this document to map the concrete game variables and their dependencies once a mechanic is designed. It intentionally contains examples, not approved game content.

## How To Use This Template

- Add a variable when it becomes part of an approved mechanic, formula, save, or player-facing display.
- Record the source of truth instead of duplicating values without a reason.
- Mark values as **stored** only when they are primary state; mark calculated values as **derived**.
- Update this map alongside `docs/WorkingDocs/gameflow.md` whenever an action, tick, formula, or save boundary changes.

## Relationship Overview

```text
Player action or time event
    -> command inputs
    -> game-rule calculation
    -> source-of-truth state
    -> derived values and UI feedback
    -> deliberate local save when a save boundary is reached
```

## Variable Register

| Variable | Meaning and unit | Kind | Source of truth | Changes when | Used by | Saved? | Status |
|---|---|---|---|---|---|---|---|
| `inventory.entries[ResourceType.Grain].quantity` | Grain held by the player | Stored | `Inventory` in Zustand | Future resource command | Inventory and UI | Not yet | Implemented foundation |
| `inventory.entries[ResourceType.Bread].quantity` | Bread held by the player | Stored | `Inventory` in Zustand | Future resource command | Inventory and UI | Not yet | Implemented foundation |
| `inventory.entries[*].quality` | Quality associated with a held resource | Stored | `Inventory` in Zustand | Inventory initialization; future quality rules | Inventory and UI | Not yet | Placeholder value `1` |
| `InventorySnapshot.entries` | Plain enum-keyed inventory data | Stored snapshot shape | `Inventory.toSnapshot()` | Future deliberate save boundary | Future SQLite adapter | Designed, not written | Implemented shape |
| `facilities[FacilityType]` | Player-constructed Farm or Bakery state | Stored | `FacilityCollection` in Zustand | Future construction command | Facility UI and future production rules | Not yet | Implemented foundation |
| `FacilitySnapshot` | Facility type, selected recipe, and active state | Stored snapshot shape | `Facility.toSnapshot()` | Future deliberate save boundary | Future SQLite adapter | Designed, not written | Implemented shape |

## Relationship Table

Use this table to make each dependency explicit.

| Output variable | Depends on | Relationship/formula | Limits and rounding | Update trigger | Notes |
|---|---|---|---|---|---|
| Inventory entry quality | Resource type | Fixed at `1` until quality rules are approved | Must be finite and greater than zero when restored | Inventory construction or restore | Placeholder only |

## Command Effects

Record every game command after it is approved.

| Command | Preconditions | Reads | Writes | Derived effects | Save boundary | Status |
|---|---|---|---|---|---|---|
| `addResource` | Resource amount must be finite and positive | Resource type, requested amount | A cloned `Inventory` in Zustand | UI can render the new entry | No immediate save | Implemented runtime command |
| `removeResource` | Resource amount must be finite and positive; player must hold enough | Resource type, requested amount | A cloned `Inventory` in Zustand | UI can render the new entry | No immediate save | Implemented runtime command |
| `buildFacility` | Facility type has not already been constructed; a future economy rule must approve construction | Facility type | A cloned `FacilityCollection` in Zustand | UI can render construction state | No immediate save | Implemented foundation |
| `setFacilityRecipe` | Facility must be constructed and recipe must belong to its definition | Facility type, recipe name | A cloned `FacilityCollection` in Zustand | Future production UI can render recipe state | No immediate save | Implemented foundation |

## Time And Catch-Up Effects

| Event | Time input | Variables affected | Limits | Player feedback | Status |
|---|---|---|---|---|---|
| Active tick | To be designed | To be designed | To be designed | To be designed | Placeholder |
| Resume catch-up | Validated elapsed time | To be designed | To be designed | To be designed | Placeholder |

## Persistence Map

| State group | Runtime owner | Local-save representation | Save trigger | Restore behavior | Status |
|---|---|---|---|---|---|
| Active resource inventory | Zustand game store | `InventorySnapshot` | Not yet designed | Not yet implemented | Foundation only |
| Constructed facilities | Zustand game store | `FacilityCollectionSnapshot` inside `GameSnapshot` | Not yet designed | Not yet implemented | Foundation only |
| Balance configuration | Typed TypeScript configuration | Not saved | App version | Loaded with app | Confirmed direction |

## Rules And Open Questions

- All production, economy, and progression formulas must be deterministic and specify rounding and boundary behavior.
- UI components issue commands; they do not own calculations or directly mutate rules-owned state.
- Zustand holds runtime state and Expo SQLite holds deliberate local saves.
- Concrete resources, production steps, tick cadence, offline eligibility, and save timing remain open until the game design defines them.
