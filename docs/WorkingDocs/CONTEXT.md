# Industri Clicker Context

This is the canonical glossary for Industri Clicker. Use it for stable game, UI, state, and persistence language.

## How To Use This Document

- Add a term once its meaning is agreed and durable.
- Define the player-facing meaning first; add a short implementation note only when it prevents ambiguity.
- Mark examples as examples and do not treat them as confirmed game content.
- Put decisions in `design.md`, system rules in `gameflow.md`, variable dependencies in `VariableRelationshipMap.md`, and verified code facts in `PROJECT_INFO.md`.

## Core Game Concepts

| Term | Meaning | Status |
|---|---|---|
| Industrial clicker | The planned single-player game genre and setting direction. | Confirmed direction |
| Player action | A deliberate player input, such as a tap or selected command. | Generic term |
| Resource | A code-defined resource type that the player can gain, spend, transform, and track in inventory. | Confirmed direction |
| Grain | The first raw resource type. | Implemented definition |
| Bread | The first processed resource type. | Implemented definition |
| Water | A utility resource produced by Small Utility Works and consumed by production recipes. | Implemented definition |
| Electricity | A utility resource produced by Small Utility Works and consumed by production recipes. | Implemented definition |
| Sugar | A farm-grown ingredient for cake production. | Implemented definition |
| Coal | A mined fuel used by the coal power recipe. | Implemented definition |
| Cake | A baked product made from Grain, Sugar, Water, and Electricity. | Implemented definition |
| Inventory | Player-owned quantities and associated quality, owned together by the `Inventory` game-domain class. | Implemented model |
| Resource quality | A property of one inventory entry. Its current value is a placeholder until quality rules are designed. | Placeholder |
| Recipe | A named production transformation with typed inputs, output, and work amount. | Implemented definition |
| Facility | A player-owned production unit. The catalogue contains Farm, Bakery, Small Utility Works, Mine, Water Well, and Power Plant. | Implemented foundation |
| Farm | The facility type assigned to the Grow Grain recipe. | Implemented definition |
| Bakery | The facility type assigned to the Bake Bread recipe. | Implemented definition |
| Small Utility Works | The facility type assigned to the Produce Water and Produce Electricity recipes. | Implemented definition |
| Mine | The facility type assigned to the Mine Coal recipe. | Implemented definition |
| Water Well | The facility type assigned to the Manual Pumping and Electric Pumping recipes. | Implemented definition |
| Power Plant | The facility type assigned to the Coal Power and Solar Power recipes. | Implemented definition |
| Euro (€) | The initial player currency. | Implemented foundation |
| Finance | Player balance plus an append-only record of balance-changing transactions. | Implemented model |
| Sales contract | A customer request for one resource and an integer quantity. A contract remains unfulfilled until the player supplies the full quantity, then moves to completed and pays its fixed reward. | Implemented foundation |
| Speed upgrade | A money-funded facility level that raises production work rate with diminishing returns and raises staffing requirements. | Implemented model |
| Output upgrade | A money-funded facility level that raises recipe output with diminishing returns and raises staffing requirements. | Implemented model |
| Assigned workers | The local worker count allocated to one facility. It may be below or above that facility's requirement. | Implemented model |
| Required workers | The calculated staffing target for a facility's base staffing plus its speed and output upgrade levels. | Implemented model |
| Building efficiency | The production-speed multiplier currently calculated from assigned versus required workers. Other efficiency factors are deferred. | Implemented model |
| Progression | A durable increase in available options, capacity, efficiency, or player reach. | Generic term |

## Economy Language

These are working definitions, not confirmation that every system will be used:

- **Currency:** a resource used to pay for an action or unlock.
- **Cost:** the amount removed to perform an action.
- **Income:** the amount gained from a completed action, production step, or timed event.
- **Rate:** a quantity gained, consumed, or transformed per defined unit of time.
- **Capacity:** the maximum stored, processed, or queued amount.
- **Unlock:** a requirement that makes new content or an option available.
- **Balance value:** a named, tunable value that controls an economy formula.

## Time, State, and Persistence Language

| Term | Meaning |
|---|---|
| Runtime state | Current in-memory game state while the app is open. |
| Tick | One controlled advancement of game time or a time-based rule. |
| Elapsed-time catch-up | Applying approved progression for time passed while the app was inactive. |
| Save boundary | An intentional point at which runtime state is written to durable storage. |
| Resume | Restoring a saved game and applying any approved catch-up rules. |
| Foreground realtime progression | Progression awarded while the app is active according to the implemented real-time rule. |
| Contract offer interval | Five foreground game minutes between new sales-contract offers. Fast-forward time also counts. |
| Source of truth | The authoritative value from which other values are derived. |
| Derived value | A display or convenience value calculated from source-of-truth state. |
| Command | A typed request from UI or a system event to change game state. |
| Snapshot | The deliberate local-save representation of durable game state. |
| Runtime store | Zustand-managed in-memory state. |
| Local save | The device-local Expo SQLite record used to restore a current-version game snapshot. |

## UI and Mobile Language

- **Primary action:** the most important action on the current screen, designed for easy touch input.
- **Feedback:** visible, readable response to a tap, state change, completion, or blocked action.
- **Portrait baseline:** the narrow phone layout that player-facing screens support first.
- **View model:** UI-ready data derived from game state; it does not own game rules.

## Open Terminology Questions

| Question | Status |
|---|---|
| What is the first player-controlled production activity? | Open |
| Which resources and currencies exist beyond the current foundation? | Open |
| Which catch-up limits and device-clock rules apply while the app is closed? | Open |
