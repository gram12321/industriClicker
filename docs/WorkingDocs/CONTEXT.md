# Industri Clicker Context

This is the canonical glossary for Industri Clicker. Use it to keep game, UI, state, and persistence language consistent across design documents and code.

## How To Use This Document

- Add a term once its meaning is agreed and durable.
- Define the player-facing meaning first, then add an implementation note only when it prevents ambiguity.
- Mark examples as examples; do not treat them as confirmed game content.
- Prefer these terms in code, tests, UI copy, and other working documents once they are defined.

## Core Game Concepts

| Term | Meaning | Status |
|---|---|---|
| Industrial clicker | The planned single-player game genre and setting direction. | Confirmed direction |
| Player action | A deliberate player input, such as a tap or a selected command. | Generic term |
| Resource | A code-defined resource type that the player can gain, spend, transform, and track in inventory. | Confirmed direction |
| Grain | The first raw resource type. | Implemented resource definition |
| Bread | The first processed resource type. | Implemented resource definition |
| Inventory | Player-owned quantities and their associated quality, owned together by the `Inventory` game-domain class. | Implemented runtime model |
| Resource quality | A property of one inventory entry. It currently uses the placeholder value `1` until quality rules are designed. | Implemented placeholder |
| Recipe | A named production transformation shape. Recipe identifiers and types are defined, but no production rules have been approved or implemented. | Foundation only |
| Production step | A rule that turns inputs, time, or player actions into outputs. | Example placeholder |
| Facility | A player-owned production unit. The initial catalogue contains Farm and Bakery; no construction cost or production rule is implemented yet. | Implemented foundation |
| Farm | The facility type assigned to the reserved Grow Grain recipe. | Implemented definition |
| Bakery | The facility type assigned to the reserved Bake Bread recipe. | Implemented definition |
| Progression | A durable increase in available options, capacity, efficiency, or player reach. | Generic term |

## Production And Economy Language

Define the following before they appear as concrete mechanics:

- **Currency:** a resource used to pay for an action or unlock.
- **Cost:** the amount removed to perform an action.
- **Income:** the amount gained from a completed action, production step, or timed event.
- **Rate:** a quantity gained, consumed, or transformed per defined unit of time.
- **Capacity:** the maximum stored, processed, or queued amount.
- **Unlock:** a requirement that makes new content or an option available.
- **Balance value:** a named, tunable value that controls an economy formula.

These are working definitions, not confirmation that every system will be used.

## Time And Tick Language

| Term | Meaning |
|---|---|
| Runtime state | The current in-memory game state while the app is open. |
| Tick | One controlled advancement of game time or a time-based rule. |
| Elapsed-time catch-up | Applying approved progression for time passed while the app was inactive. |
| Save boundary | The intentional point at which runtime state is written to durable storage. |
| Resume | Restoring a saved game and applying any approved catch-up rules. |

## State And Persistence Language

- **Source of truth:** the authoritative value from which other values are derived.
- **Derived value:** a display or convenience value calculated from source-of-truth state.
- **Command:** a typed request from UI or a system event to change game state.
- **Snapshot:** the deliberate local-save representation of durable game state.
- **Runtime store:** Zustand-managed in-memory state.
- **Local save:** Expo SQLite data used to restore approved durable progress.

## UI And Mobile Language

- **Primary action:** the most important action on the current screen, designed for easy touch input.
- **Feedback:** visible, readable response to a tap, state change, completion, or blocked action.
- **Portrait baseline:** the narrow phone layout that player-facing screens must support first.
- **View model:** UI-ready data derived from game state; it does not own game rules.

## Relationships

The planned relationship is: UI issues commands, pure game logic applies rules, Zustand holds runtime state, and Expo SQLite stores deliberate snapshots. `gameflow.md` records system flow, formulas, tick order, and save boundaries; `../../VariableRelationshipMap.md` records concrete variables and their dependencies.

## Current Implementation Notes

- The project is in foundation stage with documentation conventions established.
- Grain and Bread are the first concrete resource definitions. Their runtime quantities and placeholder quality are held in the Zustand-owned `Inventory` instance.
- Farm and Bakery have code-owned definitions and can be represented as player-constructed facilities in the runtime store.
- No production rule, construction cost, currency, market, time system, or SQLite persistence adapter is implemented yet.
- Supabase is deferred and is not part of the current game-state vocabulary.

## Flagged Ambiguities

Add unresolved terminology here before agents create competing names.

| Question | Owner/decision | Status |
|---|---|---|
| What is the first player-controlled production activity? | To be designed | Open |
| Which resources and currencies exist? | To be designed | Open |
| Which time rules apply while the app is closed? | To be designed | Open |
