# Industri Clicker Gameflow

This is the canonical home for system mechanics, formulas, tick order, state ownership, and persistence boundaries. `VariableRelationshipMap.md` holds the detailed variable-by-variable map.

## How To Use This Document

- Add mechanics only after they are agreed in `design.md`.
- Keep concrete variables, types, units, dependencies, update triggers, and save mappings in `VariableRelationshipMap.md`.
- Keep formulas deterministic and specify rounding, limits, and invalid-input behavior.
- Keep repository and verification facts in `PROJECT_INFO.md`.

## System Flow

```text
Player input or system event
        -> typed game command
        -> pure game-rule evaluation
        -> updated Zustand runtime state
        -> derived UI view model and feedback

Approved save boundary
        -> Expo SQLite snapshot
        -> restore on later launch or resume

Elapsed time
        -> validated foreground elapsed-time calculation
        -> same production rule path
```

## State Ownership

| Concern | Owner | Persisted? |
|---|---|---|
| Game configuration and balance values | Typed TypeScript configuration | No |
| Runtime game state | Zustand | Through a snapshot |
| Foreground clock anchor | Zustand `lastProcessedAtMs` | No |
| Player finance | `Finance` in the Zustand store | Yes |
| Player inventory | `Inventory` in the Zustand store | Yes |
| Constructed facilities | `FacilityCollection` in the Zustand store | Yes |
| Resource, recipe, and facility catalogues | Typed code-owned definitions | No |
| Player commands and rule results | UI/system event plus pure TypeScript game logic | No |
| Derived display values | Selectors/view-model helpers | No |
| Durable progress snapshot | `gameSaveRepository` Expo SQLite adapter | Yes |
| Cloud state | None | No |

## Production Rule

For each approved production step:

```text
inputs + valid action + applicable time
    -> validation and cost calculation
    -> output calculation with limits and rounding
    -> updated source-of-truth state
    -> derived feedback and unlock checks
```

Current foundation rules:

- `GrowGrain` consumes 1 Water and 1 Electricity and produces 1 Grain after 5 work units.
- `BakeBread` consumes 2 Grain, 1 Water, and 1 Electricity and produces 1 Bread after 10 work units.
- `ProduceWater` and `ProduceElectricity` each produce 1 utility resource after 5 work units.
- `GrowSugar` consumes 4 Water and produces 1 Sugar after 3 work units.
- `MineCoal` consumes 3 Electricity and produces 1 Coal after 3 work units.
- `BakeCake` consumes 1 Grain, 0.5 Sugar, 2 Electricity, and 2 Water and produces 1 Cake after 15 work units.
- `ManualPumping` produces 1 Water after 1 work unit; `ElectricPumping` consumes 1 Electricity and produces 5 Water after 0.5 work units.
- `CoalPower` consumes 1 Coal and 2 Water and produces 10 Electricity after 5 work units; `SolarPower` produces 1 Electricity after 10 work units.
- Inputs are paid at cycle start. If inputs are missing, the facility stalls and does not bank work.

## Finance Formula

Name: Facility construction balance change

Inputs and units: Current balance (€), facility construction cost (€)

Formula: `newBalance = currentBalance - constructionCost`

Rounding and limits: Costs are whole euros. Reject construction when the current balance is less than the cost; balance cannot become negative.

Invalid-input behavior: Reject non-finite transaction amounts and empty descriptions.

## Tick Order and Foreground Time

1. While the app is active, the runtime timer reads `Date.now()`.
2. `TimeManager` calculates whole elapsed minutes and retains the partial-minute remainder.
3. For each elapsed minute, active facilities receive one work unit in fixed order: Small Utility Works, Farm, Bakery.
4. The Fast-forward 1 minute control invokes the same production path once.
5. On background or resume, the runtime clock anchor resets; inactive time awards no work.

Offline catch-up is not part of this flow yet. When designed, it must validate elapsed time and use the same production rule path.

## Persistence Boundaries

| Event | Behavior | Status |
|---|---|---|
| Normal action | Update runtime state; batch the current snapshot for one second. | Implemented |
| Meaningful checkpoint | Write the current single-record snapshot. | Implemented |
| App background/resume | Flush the snapshot, reset the foreground clock, and award no background work. | Implemented foreground-only |
| App launch | Restore a valid current-version snapshot before interaction; apply no catch-up. | Implemented |
| Invalid/corrupt save | Ignore it and start fresh; leave it untouched until a successful save. | Implemented |

## Formula Template

```text
Name:
Inputs and units:
Formula:
Rounding and limits:
Invalid-input behavior:
Tests/examples:
```

## Mechanics Update Checklist

- Add or update canonical terms in `CONTEXT.md`.
- Record the player-facing decision in `design.md`.
- Add concrete dependencies and command effects to `VariableRelationshipMap.md`.
- Add verified implementation facts to `PROJECT_INFO.md` only after they exist.
