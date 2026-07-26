# Industri Clicker Gameflow And Variable Relationship Map

This document is the canonical home for mechanics flow, variables, formulas, state ownership, tick order, and persistence boundaries. It replaces the imported root `VariableRelationshipMap.md`.

## How To Use This Document

- Add concrete mechanics only after they are agreed in `design.md`.
- For each variable, record ownership, type/unit, source of truth, update triggers, persistence status, and derived relationships.
- Keep formulas deterministic and write down rounding, minimum/maximum, and invalid-input behavior.
- Update this document with any change to a game command, tick, save boundary, or resource relationship.

## Current Status

Foundation template. No production chain, resource, formula, route, Zustand store, or SQLite schema is implemented yet.

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
| Player command | UI or system event, passed to game logic | No | UI must not directly mutate rules-owned values. |
| Rule result | Pure TypeScript game logic | No | Validates inputs and returns deterministic changes. |
| Derived display values | Selectors/view-model helpers | No | Recalculate from source-of-truth state where practical. |
| Durable progress snapshot | Expo SQLite adapter | Yes, at deliberate boundaries | Exact shape is not designed. |
| Cloud state | None | No | Supabase remains deferred. |

## Variable Map Template

Use one row for each concrete variable once it exists.

| Variable | Meaning and unit | Source of truth | Changed by | Used by | Persisted? | Status |
|---|---|---|---|---|---|---|
| `exampleResourceAmount` | Example only; replace with a real resource and unit | To be designed | To be designed | To be designed | To be designed | Placeholder |
| `exampleLastSavedAt` | Example timestamp for a deliberate save boundary | To be designed | Save flow | Restore/catch-up flow | To be designed | Placeholder |

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

## Tick And Catch-Up Flow

Planned template:

1. Read a trusted active-session or saved timestamp.
2. Calculate elapsed time with explicit invalid-clock handling.
3. Apply only the approved time-based rules and maximum limits.
4. Run the same validation and calculation rules used by normal gameplay.
5. Update runtime state and derive resume feedback.
6. Save only at the approved boundary.

Open decisions: active tick cadence, offline eligibility, catch-up cap, device-clock policy, and save frequency.

## Persistence Boundaries

| Event | Planned behavior | Status |
|---|---|---|
| Normal tap/action | Update runtime state; do not assume an immediate SQLite write | Template |
| Meaningful checkpoint | Create a deliberate SQLite snapshot when designed | Template |
| App background/resume | Define safe save and restore behavior before implementation | Open |
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
- Add variables, ownership, formula, command, tick, and save impacts here.
- Add implementation facts and verification to `PROJECT_INFO.md` only after they exist.
