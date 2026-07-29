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
| `facility.speedUpgradeLevel` | Purchased speed-upgrade count | Stored | `Facility` in Zustand | Accepted Speed upgrade | Upgrade UI and production speed | Yes, via facility snapshot | Implemented |
| `facility.outputUpgradeLevel` | Purchased output-upgrade count | Stored | `Facility` in Zustand | Accepted Output upgrade | Upgrade UI and recipe output | Yes, via facility snapshot | Implemented |
| `facility.assignedWorkers` | Local workers allocated to one facility | Stored | `Facility` in Zustand | Player staffing command | Staffing UI and efficiency | Yes, via facility snapshot | Implemented |
| `salesContracts.offered` | Unfulfilled customer resource contracts | Stored | `SalesContracts` in Zustand | Successful foreground-minute offer roll | Sales UI and fulfilment validation | Yes, via `SalesContractsSnapshot` | Implemented |
| `salesContracts.completed` | Fulfilled customer contracts | Stored | `SalesContracts` in Zustand | Accepted contract fulfilment | Completed sales UI | Yes, via `SalesContractsSnapshot` | Implemented |
| `salesContracts.nextCustomerNumber` | Number assigned to the next generated customer | Stored | `SalesContracts` in Zustand | Contract generation | Customer label and contract identifier | Yes, via `SalesContractsSnapshot` | Implemented |
| `customerPipelineProgress` | Visual 0–1 estimate toward the next customer | Stored | Zustand game store | Global foreground-time advance or successful offer | Sales pipeline progress bar | Yes, via `GameTimeSnapshot` | Implemented |
| `lastProcessedAtMs` | Logical foreground game time in epoch milliseconds | Stored | Zustand game store | Realtime or fast-forward global-time advance | Snapshot, global-time command | Yes, via `GameTimeSnapshot` | Foreground-only |
| `lastObservedAtMs` | Last foreground wall-clock observation in epoch milliseconds | Runtime state | Zustand game store | Foreground timer or lifecycle transition | `TimeManager` | No | Foreground-only |
| `unprocessedWorkMs` | Foreground milliseconds retained until a complete work minute | Stored | Zustand game store | Global foreground-time advance | Production timing | Yes, via `GameTimeSnapshot` | Implemented |

## Dependency Table

| Output variable | Depends on | Relationship/formula | Limits and rounding | Update trigger |
|---|---|---|---|---|
| Inventory quantity | Resource command or completed recipe | Add/remove the requested finite amount | Removal requires sufficient quantity | Command or production completion |
| Inventory entry quality | Resource type | Placeholder value `1` | Must be finite and greater than zero when restored | Inventory construction or restore |
| Facility recipe catalogue | Facility type | Code-owned recipe list for each facility | Not player-mutable in runtime | Catalogue load |
| Company balance | Prior balance, signed transaction amount | `balanceAfter = balance + amount` | Balance must remain finite and at least €0 | Accepted transaction |
| Recipe progress | Prior progress, work units, recipe work amount | Progress advances by one work unit per eligible tick | Completion resets progress and grants output | Production tick |
| Required workers | Facility base workers, speed level, output level | `base + levels + ceil(base × 1.15^levels - base)` | Non-negative integer | Construction or accepted upgrade |
| Staffing efficiency | Assigned workers, required workers | Understaffing uses a power penalty; overstaffing uses a capped exponential bonus | Minimum 1%; above-target bonus is below 25% | Staffing command or accepted upgrade |
| Production work | Base work, staffing efficiency, speed level | `baseWork × staffingEfficiency × speedMultiplier` | Positive fractional work is supported | Production tick |
| Production output | Recipe inputs, output level, completion state | `baseOutput × outputMultiplier` after required work | Inputs are paid at cycle start; missing inputs stall | Cycle start or completion |
| Contract reward | Requested quantity | `quantity × €1` | Quantity is an integer from 1 through 10 | Contract generation |
| Customer offer chance | Unfulfilled contract count, Sales control points | `1 - asymmetricalScaler(controlPointNormalize(unfulfilledContracts))` | 0, 3, 5, 10, and 1,000,000 contracts map to approximately 100%, 63%, 30%, 8%, and effectively 0% chance | Each foreground minute |

## Command Effects

| Command | Preconditions | Reads | Writes | Derived effects | Save boundary | Status |
|---|---|---|---|---|---|---|
| `addResource` | Amount finite and positive | Resource type, amount | Inventory | UI renders new quantity | No immediate save | Implemented |
| `removeResource` | Amount finite and positive; sufficient quantity | Resource type, amount | Inventory | UI renders new quantity | No immediate save | Implemented |
| `buildFacility` | Type unconstructed; balance covers code-defined cost | Facility type, cost, balance | Facilities and Finance | Construction transaction and UI update | No immediate save | Implemented |
| `destroyFacility` | Facility is constructed | Facility type | Facilities | Facility disappears; no refund | No immediate save | Implemented |
| `setFacilityRecipe` | Facility constructed; recipe belongs to definition | Facility type, recipe | Facilities | Production UI updates | No immediate save | Implemented |
| `setFacilityWorkers` | Facility constructed; non-negative integer worker count | Facility type, worker count | Facilities | Recalculates derived efficiency | No immediate save | Implemented |
| `upgradeFacility` | Facility constructed; balance covers the next code-defined money cost | Facility type, upgrade kind, balance, current level | Facilities and Finance | Upgrade transaction, worker requirement, and production modifiers update | No immediate save | Implemented |
| `recordTransaction` | Valid amount, description, timestamp, and non-negative result | Transaction data | Finance | Balance and ledger update | No immediate save | Implemented |
| `advanceRealtime` | Finite foreground clock input | Observation anchor and global time | Logical time, partial work, pipeline, facilities, inventory, sales contracts | Measures elapsed foreground time, then invokes `advanceGameTime` | Batched save | Implemented |
| `advanceGameTime` | Finite elapsed foreground milliseconds | Global time, partial work, facilities, inventory, sales contracts | Logical time, partial work, pipeline, facilities, inventory, sales contracts | Runs every currently registered timed rule | Batched save | Implemented |
| `fastForwardOneMinute` | None | Global time | Logical time, partial work, pipeline, facilities, inventory, sales contracts | Invokes `advanceGameTime(60,000)` after measuring real foreground time | Batched save | Implemented |
| `fulfillSalesContract` | Contract is unfulfilled; inventory covers its full requested quantity | Contract, inventory, finance | Sales contracts, inventory, finance | Completed contract and positive finance transaction | No immediate save | Implemented |

## Time Effects

| Event | Time input | Variables affected | Limits | Status |
|---|---|---|---|---|
| Global foreground-time advance | Measured foreground milliseconds or 60,000 milliseconds from fast-forward | Logical time, partial work, pipeline, facility progress, inventory, and sales contracts | Work/sales resolve only on whole minutes; partial work is retained | Implemented |
| Resume/background transition | Lifecycle event | Observation anchor and complete save snapshot | Final active time is processed before saving; background minutes produce no work | Implemented foreground-only |
| Offline catch-up | Not approved | None yet | Cap and device-clock policy required | Deferred |

## Persistence Map

| State group | Runtime owner | Local-save representation | Save trigger | Restore behavior | Status |
|---|---|---|---|---|---|
| Resource inventory | Zustand game store | `InventorySnapshot` inside `GameSnapshot` | Batched after changes; immediate on background | Restore valid current-version snapshot | Implemented |
| Finance | Zustand game store | `FinanceSnapshot` inside `GameSnapshot` | Batched after changes; immediate on background | Restore valid current-version snapshot | Implemented |
| Constructed facilities | Zustand game store | `FacilityCollectionSnapshot` inside `GameSnapshot` | Batched after changes; immediate on background | Restore valid current-version snapshot | Implemented |
| Sales contracts | Zustand game store | `SalesContractsSnapshot` inside `GameSnapshot` | Batched after changes; immediate on background | Restore valid current-version snapshot | Implemented |
| Foreground game time | Zustand game store | `GameTimeSnapshot` inside `GameSnapshot` | Batched after completed timed rules; final active interval on background/cleanup | Restore logical time, partial work, and pipeline; reset wall-clock observation anchor | Implemented |
| Code-owned catalogues | Typed TypeScript definitions | Not saved | App version | Loaded from code | Implemented |

## Map Rules

- UI issues commands; it does not directly mutate rules-owned state.
- Derived display values should be recalculated from source-of-truth state where practical.
- Persistence rows contain snapshots, not live class instances or code-owned catalogues.
