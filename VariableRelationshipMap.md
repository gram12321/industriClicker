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
| `exampleResourceAmount` | Example resource amount; replace with the agreed resource and unit | Stored | To be designed | To be designed | To be designed | To be designed | Placeholder |
| `exampleActionCost` | Example cost calculated for a player action | Derived | Formula inputs | Action preview or execution | UI and rule validation | No | Placeholder |
| `exampleProductionRate` | Example output per approved time unit | Derived or stored, as designed | To be designed | To be designed | Tick/catch-up calculation | To be designed | Placeholder |
| `exampleLastSavedAt` | Timestamp of the latest deliberate local snapshot | Stored | Save system | Approved save boundary | Restore and catch-up flow | Yes | Placeholder |

## Relationship Table

Use this table to make each dependency explicit.

| Output variable | Depends on | Relationship/formula | Limits and rounding | Update trigger | Notes |
|---|---|---|---|---|---|
| `exampleActionCost` | `exampleResourceAmount`, balance value | Replace with approved formula | Define minimum, maximum, and rounding | Action preview | Placeholder only |
| `exampleProductionRate` | Player progression, balance values | Replace with approved formula | Define caps and rounding | Unlock or upgrade | Placeholder only |

## Command Effects

Record every game command after it is approved.

| Command | Preconditions | Reads | Writes | Derived effects | Save boundary | Status |
|---|---|---|---|---|---|---|
| `examplePerformAction` | To be designed | To be designed | To be designed | To be designed | To be designed | Placeholder |

## Time And Catch-Up Effects

| Event | Time input | Variables affected | Limits | Player feedback | Status |
|---|---|---|---|---|---|
| Active tick | To be designed | To be designed | To be designed | To be designed | Placeholder |
| Resume catch-up | Validated elapsed time | To be designed | To be designed | To be designed | Placeholder |

## Persistence Map

| State group | Runtime owner | Local-save representation | Save trigger | Restore behavior | Status |
|---|---|---|---|---|---|
| Active game state | Zustand | To be designed | To be designed | To be designed | Placeholder |
| Balance configuration | Typed TypeScript configuration | Not saved | App version | Loaded with app | Confirmed direction |

## Rules And Open Questions

- All production, economy, and progression formulas must be deterministic and specify rounding and boundary behavior.
- UI components issue commands; they do not own calculations or directly mutate rules-owned state.
- Zustand holds runtime state and Expo SQLite holds deliberate local saves.
- Concrete resources, production steps, tick cadence, offline eligibility, and save timing remain open until the game design defines them.
