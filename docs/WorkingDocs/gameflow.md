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
| Sales contracts | `SalesContracts` in the Zustand store | Yes |
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

## Facility Upgrade and Staffing Rules

Each facility stores `speedUpgradeLevel`, `outputUpgradeLevel`, and `assignedWorkers`; newly constructed facilities and pre-upgrade saves default to level `0` and fully staffed.

- Next Speed or Output upgrade cost: `ceil(constructionCost × 1.5^currentLevel)` euros.
- Speed multiplier: `1 + 0.8 × (1 - e^(-0.22 × speedLevel))`.
- Output multiplier: `1 + 1.0 × (1 - e^(-0.18 × outputLevel))`.
- Required workers, where `levels = speedLevel + outputLevel`: `baseWorkers + levels + ceil(baseWorkers × 1.15^levels - baseWorkers)`.
- Staffing ratio: `assignedWorkers / requiredWorkers`.
  - At or below the target: `0.01 + 0.99 × ratio^1.6` efficiency.
  - Above the target: `1 + 0.25 × (1 - e^(-0.7 × (ratio - 1)))` efficiency.
- Effective work per approved work unit: `baseWork × staffingEfficiency × speedMultiplier`.
- Completed recipe output: `baseOutput × outputMultiplier`.

Levels and worker counts are non-negative integers. A facility with zero required workers has 100% staffing efficiency. Above-target staffing is permitted, but its bonus cannot reach 25%.

## Finance Formula

Name: Facility construction balance change

Inputs and units: Current balance (€), facility construction cost (€)

Formula: `newBalance = currentBalance - constructionCost`

Rounding and limits: Costs are whole euros. Reject construction when the current balance is less than the cost; balance cannot become negative.

Invalid-input behavior: Reject non-finite transaction amounts and empty descriptions.

## Sales Contract Rule

- Each foreground minute rolls the current chance to create one unfulfilled contract for `Customer #n`. With no unfulfilled contracts the chance is 100%.
- Map unfulfilled contracts through Sales control points `0→0`, `3→0.25`, `5→0.50`, `10→0.75`, and `1,000,000→almost 1`; apply `calculateAsymmetricalScaler01`, then invert the result. This gives approximately 100%, 63%, 30%, 8%, and effectively 0% chance at those counts.
- The estimated wait is `1 / currentCustomerChance` foreground minutes; individual waits remain random.
- Customer pipeline progress adds `currentCustomerChance / 60` each foreground second, clamps at 100%, and resets to 0 whenever an offer is created. It is visual runtime state and does not affect the customer roll.
- The requested resource is randomly selected from the code-owned resource catalogue. Quantity is a random integer from 1 through 10.
- Reward is `quantity × €1`.
- Fulfilment first verifies the complete inventory quantity. It then removes the requested resource, records the positive finance transaction, and moves the contract from unfulfilled to completed.
- Rejection moves the offered contract to retained rejected history without changing inventory or finance.
- Contracts have no expiry or pending-offer cap in this foundation implementation.

## Tick Order and Foreground Time

1. While the app is active, the runtime timer reads `Date.now()`.
2. `TimeManager` calculates whole elapsed minutes and retains the partial-minute remainder.
3. For each elapsed minute, active facilities receive one base work unit in fixed order. Each facility applies its staffing efficiency and speed multiplier before progressing its selected recipe.
4. Every foreground second advances the visual customer-pipeline estimate. The same elapsed minutes each roll the current diminishing sales-contract offer chance and reset the estimate after a successful offer.
5. The Fast-forward 1 minute control invokes both production and sales time paths once.
6. On background or resume, the runtime clock anchor resets; inactive time awards no work or contract offers.

Offline catch-up is not part of this flow yet. When designed, it must validate elapsed time and use the same production rule path.

## Persistence Boundaries

| Event | Behavior | Status |
|---|---|---|
| Normal action | Update runtime state; batch the current snapshot for one second. | Implemented |
| Meaningful checkpoint | Write the current single-record snapshot. | Implemented |
| App background/resume | Flush the snapshot, reset the foreground clock, and award no background work. | Implemented foreground-only |
| App launch | Restore a valid current-version snapshot before interaction; apply no catch-up. | Implemented |
| Invalid/corrupt save | Ignore it and start fresh; leave it untouched until a successful save. | Implemented |

The snapshot version is intentionally strict. Older save versions do not restore when the persisted shape changes unless an explicit migration is approved.

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
