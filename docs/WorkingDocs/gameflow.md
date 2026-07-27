# Industri Clicker Gameflow And Variable Relationship Map

This document is the canonical home for mechanics flow, formulas, state ownership, tick order, and persistence boundaries. Use the companion root `VariableRelationshipMap.md` for the variable-by-variable dependency map.

## How To Use This Document

- Add concrete mechanics only after they are agreed in `design.md`.
- Keep the variable-by-variable ownership, type/unit, source of truth, update triggers, persistence status, and derived relationships in `VariableRelationshipMap.md`.
- Keep formulas deterministic and write down rounding, minimum/maximum, and invalid-input behavior.
- Update this document with any change to a game command, tick, save boundary, or resource relationship.

## Current Status

Resource, inventory, facility, finance, recipe, and foreground realtime-production foundations are implemented. The closed catalogue contains Grain, Bread, Water, and Electricity; Farm, Bakery, and Small Utility Works execute their selected recipe definitions. A Zustand store owns the live `Finance`, `Inventory`, `FacilityCollection`, and foreground clock anchor. Market, offline catch-up, persistence adapter, and SQLite schema remain deferred.

## Planned Gameflow

```text
Player input or system event
        -> typed game command
        -> pure game-rule evaluation
        -> updated Zustand runtime state
        -> derived UI view model and player feedback

Approved save boundary
        -> Expo SQLite snapshot
        -> restore on later launch or resume

Elapsed time (only when designed)
        -> validated catch-up calculation
        -> same game-rule evaluation path
```

## State Ownership

| Concern | Planned owner | Persisted? | Notes |
|---|---|---|---|
| Game configuration and balance values | Typed TypeScript game configuration | No | Versioned with the app; use named constants. |
| Runtime game state | Zustand | Not directly | Holds the active in-memory session. |
| Foreground clock anchor | Zustand `lastProcessedAtMs` | No | Runtime-only wall-clock anchor; reset on resume so inactive time grants no work. Offline catch-up is planned separately. |
| Player finance | `Finance` class in the Zustand game store | Not yet | Starts at €10,000 and records accepted balance changes. |
| Player resource inventory | `Inventory` class in the Zustand game store | Not yet | Quantity and placeholder quality are one inventory entry per `ResourceType`. |
| Constructed facilities | `FacilityCollection` class in the Zustand game store | Not yet | Holds at most one Farm and one Bakery, with their selected-recipe and active-state data. |
| Facility catalogue | Typed facility registry | No | Farm, Bakery, and Small Utility Works definitions are code-owned and must not be stored in a future player save. |
| Resource catalogue | `Resource` instances in the resource registry | No | Grain and Bread definitions are code-owned and must not be stored in a future player save. |
| Recipe catalogue | Typed code-owned recipe definitions | No | Execution and production scheduling are deferred. |
| Player command | UI or system event, passed to game logic | No | UI must not directly mutate rules-owned values. |
| Rule result | Pure TypeScript game logic | No | Validates inputs and returns deterministic changes. |
| Derived display values | Selectors/view-model helpers | No | Recalculate from source-of-truth state where practical. |
| Durable progress snapshot | Expo SQLite adapter | Yes, at deliberate boundaries | Exact shape is not designed. |
| Cloud state | None | No | Supabase remains deferred. |

## Variable Relationship Map

Maintain concrete variables and their dependencies in the root `VariableRelationshipMap.md`. Keep this document focused on system-level flow, formulas, ticks, and persistence boundaries.

## Production Relationship Template

For every approved production step, specify:

```text
Inputs + valid player/system action + applicable time
    -> validation and cost calculation
    -> output calculation (with caps, rounding, and modifiers)
    -> updated source-of-truth state
    -> derived UI feedback and any unlock checks
```

Record the concrete inputs, outputs, modifiers, limits, and unlock dependencies in a table here. Do not assume a facility, currency, or automation system until the design adopts it.

## Current Resource And Inventory Rules

- `ResourceType` is a closed enum: `grain`, `bread`, `water`, and `electricity` currently exist.
- An `Inventory` owns one `{ quantity, quality }` entry for every resource type.
- Inventory `add` accepts only finite positive amounts. `remove` succeeds only when the player holds a finite positive requested amount.
- Quality is stored as `1` by default and does not yet affect any calculation.
- `Inventory.toSnapshot()` returns plain enum-keyed data for a future Expo SQLite adapter. No save or restore boundary has been introduced yet.
- `GrowGrain` consumes one Water and one Electricity to output one Grain after five work units. `BakeBread` consumes two Grain, one Water, and one Electricity to output one Bread after ten work units. `ProduceWater` and `ProduceElectricity` each output one utility resource after five work units.
- `FacilityType` is a closed enum: Farm, Bakery, and Small Utility Works currently exist. A Farm accepts `GrowGrain`; a Bakery accepts `BakeBread`; Small Utility Works accepts `ProduceWater` or `ProduceElectricity`.
- Farm construction costs €60; Bakery construction costs €300. `buildFacility` accepts the command only if the type is unconstructed and `Finance` can afford its code-defined cost.
- Construction writes one negative finance transaction using the facility name and cost. The UI exposes touch-friendly build controls and disables unaffordable choices.
- `destroyFacility` removes a constructed facility without changing Finance. The UI requires a second explicit confirmation tap before it calls this command.
- `FacilitySnapshot` preserves active state plus per-recipe work progress. `GameSnapshot` joins `FinanceSnapshot`, `InventorySnapshot`, and `FacilityCollectionSnapshot` for the future Expo SQLite adapter.

## Finance Formula

Name: Facility construction balance change

Inputs and units: Current balance (€), facility construction cost (€)

Formula: `newBalance = currentBalance - constructionCost`

Rounding and limits: Facility costs are whole euros. Construction is rejected when `currentBalance < constructionCost`; balance cannot become negative.

Invalid-input behavior: Non-finite transaction amounts and empty descriptions are rejected.

## Tick And Catch-Up Flow

1. While React Native reports the app as active, a lightweight runtime timer reads `Date.now()`.
2. `TimeManager` calculates whole elapsed minutes and retains partial-minute remainder to avoid timer-drift loss.
3. For each elapsed minute, every active facility receives one work unit in fixed order: Small Utility Works, Farm, Bakery.
4. A recipe pays all inputs at the beginning of a cycle, advances its stored progress, and grants output on completion. A missing input stalls that facility and does not bank work.
5. The temporary Fast-forward 1 minute UI action invokes this identical production path once.
6. On background or resume, the runtime clock anchor resets. This first implementation deliberately awards no background/offline work.

Planned offline catch-up: persist a timestamp with the eventual SQLite snapshot, validate elapsed time, apply an approved cap and device-clock policy, then invoke the same production path. Those policy details are not implemented.

## Persistence Boundaries

| Event | Planned behavior | Status |
|---|---|---|
| Normal tap/action | Update runtime state; do not assume an immediate SQLite write | Template |
| Meaningful checkpoint | Create a deliberate SQLite snapshot when designed | Template |
| App background/resume | Reset the foreground clock; award no background work. Offline catch-up is planned separately. | Implemented foreground-only |
| App launch | Restore a valid snapshot and apply approved catch-up | Template |
| Invalid/corrupt saved data | Define recovery and player feedback before implementation | Open |

## Formula Template

Document each formula in this format:

```text
Name:
Inputs and units:
Formula:
Rounding and limits:
Invalid-input behavior:
Tests/examples:
```

## Mechanics Update Checklist

- Add or update the canonical terms in `CONTEXT.md`.
- Record the player-facing decision in `design.md`.
- Add variables and dependency details to `VariableRelationshipMap.md`; add formula, command, tick, and save impacts here.
- Add implementation facts and verification to `PROJECT_INFO.md` only after they exist.
