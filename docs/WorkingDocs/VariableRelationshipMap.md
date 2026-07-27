# Industri Clicker Variable Relationship Map

This document maps concrete variables, commands, dependencies, time effects, and persistence representations. Player-facing rationale belongs in `design.md`; system flow and formulas belong in `gameflow.md`.

## How To Use This Map

- Add a variable when it becomes part of an approved mechanic, formula, save, or player-facing display.
- Record the source of truth rather than duplicating values without a reason.
- Mark primary state as **stored** and calculated values as **derived**.
- Update this map with `gameflow.md` whenever an action, tick, formula, or save boundary changes.

## Relationship Overview

```text
Player action or time event
    -> command inputs
    -> game-rule calculation
    -> source-of-truth state
    -> derived values and UI feedback
    -> deliberate local save at a save boundary
```

## Variable Register

| Variable | Meaning and unit | Kind | Source of truth | Changes when | Used by | Saved? | Status |
|---|---|---|---|---|---|---|---|
| `inventory.entries[ResourceType].quantity` | Amount of a resource held by the player | Stored | `Inventory` in Zustand | Resource command or production completion | Inventory and UI | Yes, via `InventorySnapshot` | Implemented |
| `inventory.entries[ResourceType].quality` | Quality associated with a held resource | Stored | `Inventory` in Zustand | Inventory initialization; future quality rules | Inventory and UI | Yes, via `InventorySnapshot` | Placeholder `1` |
| `finance.balance` | Available company funds in euros | Stored | `Finance` in Zustand | Accepted finance transaction | Header, finance view, construction validation | Yes, via `FinanceSnapshot` | Implemented |
| `finance.transactions` | Accepted balance changes | Stored | `Finance` in Zustand | Accepted finance transaction | Finance view | Yes, via `FinanceSnapshot` | Implemented |
| `facilities[FacilityType]` | Player-constructed facility state | Stored | `FacilityCollection` in Zustand | Construction, recipe change, or production advance | Facility UI and production rules | Yes, via `FacilityCollectionSnapshot` | Implemented |
| `facility.recipeProgress[RecipeName]` | Work completed on a facility recipe | Stored | `Facility` in Zustand | Foreground elapsed minute or fast-forward | Production view and recipe completion | Yes, via facility snapshot | Implemented |
| `lastProcessedAtMs` | Foreground wall-clock anchor in epoch milliseconds | Runtime state | Zustand game store | Foreground timer or lifecycle transition | `TimeManager` | No | Foreground-only |

## Dependency Table

| Output variable | Depends on | Relationship/formula | Limits and rounding | Update trigger |
|---|---|---|---|---|
| Inventory quantity | Resource command or completed recipe | Add/remove the requested finite amount | Removal requires sufficient quantity | Command or production completion |
| Inventory entry quality | Resource type | Placeholder value `1` | Must be finite and greater than zero when restored | Inventory construction or restore |
| Facility recipe catalogue | Facility type | Code-owned recipe list for each facility | Not player-mutable in runtime | Catalogue load |
| Company balance | Prior balance, signed transaction amount | `balanceAfter = balance + amount` | Balance must remain finite and at least €0 | Accepted transaction |
| Recipe progress | Prior progress, work units, recipe work amount | Progress advances by one work unit per eligible tick | Completion resets progress and grants output | Production tick |
| Production output | Recipe inputs and completion state | Recipe-specific output after required work | Inputs are paid at cycle start; missing inputs stall | Cycle start or completion |

## Command Effects

| Command | Preconditions | Reads | Writes | Derived effects | Save boundary | Status |
|---|---|---|---|---|---|---|
| `addResource` | Amount finite and positive | Resource type, amount | Inventory | UI renders new quantity | No immediate save | Implemented |
| `removeResource` | Amount finite and positive; sufficient quantity | Resource type, amount | Inventory | UI renders new quantity | No immediate save | Implemented |
| `buildFacility` | Type unconstructed; balance covers code-defined cost | Facility type, cost, balance | Facilities and Finance | Construction transaction and UI update | No immediate save | Implemented |
| `destroyFacility` | Facility is constructed | Facility type | Facilities | Facility disappears; no refund | No immediate save | Implemented |
| `setFacilityRecipe` | Facility constructed; recipe belongs to definition | Facility type, recipe | Facilities | Production UI updates | No immediate save | Implemented |
| `recordTransaction` | Valid amount, description, timestamp, and non-negative result | Transaction data | Finance | Balance and ledger update | No immediate save | Implemented |
| `advanceRealtime` | Finite foreground clock input | Clock anchor, facilities, inventory | Facilities, inventory, clock anchor | Advances eligible production by whole minutes | Batched save | Implemented |
| `fastForwardOneMinute` | None | Facilities, inventory | Facilities, inventory | Runs one production minute | Batched save | Implemented |

## Time Effects

| Event | Time input | Variables affected | Limits | Status |
|---|---|---|---|---|
| Foreground elapsed minute | `Date.now()` compared with `lastProcessedAtMs` | Facility progress and inventory | Whole minutes only; partial minute retained | Implemented |
| Resume/background transition | Lifecycle event | Clock anchor and save snapshot | Background minutes produce no work | Implemented foreground-only |
| Offline catch-up | Not approved | None yet | Cap and device-clock policy required | Deferred |

## Persistence Map

| State group | Runtime owner | Local-save representation | Save trigger | Restore behavior | Status |
|---|---|---|---|---|---|
| Resource inventory | Zustand game store | `InventorySnapshot` inside `GameSnapshot` | Batched after changes; immediate on background | Restore valid current-version snapshot | Implemented |
| Finance | Zustand game store | `FinanceSnapshot` inside `GameSnapshot` | Batched after changes; immediate on background | Restore valid current-version snapshot | Implemented |
| Constructed facilities | Zustand game store | `FacilityCollectionSnapshot` inside `GameSnapshot` | Batched after changes; immediate on background | Restore valid current-version snapshot | Implemented |
| Code-owned catalogues | Typed TypeScript definitions | Not saved | App version | Loaded from code | Implemented |

## Map Rules

- UI issues commands; it does not directly mutate rules-owned state.
- Derived display values should be recalculated from source-of-truth state where practical.
- Persistence rows contain snapshots, not live class instances or code-owned catalogues.
