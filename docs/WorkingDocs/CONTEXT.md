# Industri Clicker Context

Canonical terminology and naming for Industri Clicker. Design decisions belong in [design.md](design.md), mechanics in [gameflow.md](gameflow.md), variable details in [VariableRelationshipMap.md](VariableRelationshipMap.md), and verified implementation status in [PROJECT_INFO.md](PROJECT_INFO.md).

## Core Terms

| Term | Meaning |
|---|---|
| Industrial clicker | The game genre and setting direction. |
| Resource | A typed item the player can gain, spend, transform, and hold in inventory. |
| Grain, Bread, Water, Electricity, Sugar, Coal, Cake | Current resource names. |
| Inventory | Player-owned resource quantities and their associated quality. |
| Resource quality | A property of an inventory entry; its gameplay rule is not yet designed. |
| Recipe | A named production transformation with inputs, output, and work amount. |
| Facility | A player-owned production unit. Current types are Farm, Bakery, Small Utility Works, Mine, Water Well, and Power Plant. |
| Euro (€) | The company currency. |
| Finance | Company balance and its append-only balance-change record. |
| Sales contract | A customer request for a resource and integer quantity, retained as offered, completed, or rejected. |
| Speed upgrade / Output upgrade | Money-funded facility levels that respectively improve work speed or recipe output. |
| Assigned workers / Required workers | The local worker count and calculated staffing target for a facility. |
| Building efficiency | The production-speed multiplier derived from staffing. |
| Company prestige | An informational company-standing value derived from prestige events. |
| Prestige event | A company-level prestige source that may decay with active foreground time. |

## Time, State, and Persistence

| Term | Meaning |
|---|---|
| Runtime state | Current in-memory game state while the app is open. |
| Tick | One controlled advancement of game time or a time-based rule. |
| Elapsed-time catch-up | Approved progression applied while the app was inactive. |
| Save boundary | An intentional point at which runtime state is written to durable storage. |
| Resume | Restoring a saved game and applying any approved catch-up rule. |
| Source of truth / Derived value | An authoritative stored value / a value calculated from it. |
| Command | A typed request from UI or a system event to change game state. |
| Snapshot | The durable representation of current-version game state. |
| Runtime store / Local save | The Zustand-managed state / the device-local Expo SQLite snapshot. |

## UI Terms

- **Primary action:** the most important touch action on the current screen.
- **Feedback:** visible response to a player action or state change.
- **Portrait baseline:** the narrow phone layout supported first.
- **View model:** UI-ready state derived without owning game rules.
