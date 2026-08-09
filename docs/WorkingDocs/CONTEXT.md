# Industri Clicker Context

Canonical terminology and naming for Industri Clicker. Design decisions belong in [design.md](design.md), mechanics in [gameflow.md](gameflow.md), variable details in [VariableRelationshipMap.md](VariableRelationshipMap.md), and verified implementation status in [PROJECT_INFO.md](PROJECT_INFO.md).

## Core Terms

| Term | Meaning |
|---|---|
| Industrial clicker | The game genre and setting direction. |
| Resource | A typed item the player can gain, spend, transform, and hold in inventory. |
| Grain, Bread, Water, Electricity, Sugar, Coal, Iron, Copper, Steel, Electric Circuits, Bricks, Cement, Reinforced Concrete, Construction Materials, Sand, Clay, Stone, Cake | Current resource names. |
| Inventory | Player-owned resource quantities and their associated quality. |
| Resource quality | A property of an inventory entry; its gameplay rule is not yet designed. |
| Logistics multiplier | A resource catalogue value for physical shipping, storage, and market-network constraints on local/global diffusion. |
| Value-density multiplier | A resource catalogue value for the economic value of moving a resource relative to its transport burden. |
| Market urgency multiplier | A bounded, derived diffusion multiplier based on current local/global prices relative to the resource's initial price level. |
| Market-flow diagnostics | Read-only price, balance-target, rate, and multiplier details for one resource's local/global diffusion, shown in IndustriPedia. |
| Recipe | A named production transformation with inputs, output, and required work. |
| Facility | A player-owned production unit. Several of the same type may be constructed; each is numbered by type, such as Mine #1 and Mine #2. Current types are Farm, Bakery, Small Utility Works, Mine, Quarry, Industrial Processing Factory, Construction Factory, Water Well, and Power Plant. |
| Euro (€) | The company currency. |
| Finance | Company balance and its append-only balance-change record. |
| Sales contract | A customer request for a resource and integer quantity, retained as offered, completed, or rejected. |
| Speed upgrade / Output upgrade | Money-funded facility levels that respectively improve work speed or recipe output. |
| Assigned workers / Required workers | The local worker count and calculated staffing target for a facility. |
| Facility condition | A persisted 0–1 measure of a constructed facility's wear state. It begins at 1 and decreases during foreground time and completed production cycles. |
| Building efficiency | The production-speed multiplier formed from staffing efficiency and facility condition. |
| Company prestige | An informational company-standing value derived from prestige events. |
| Local player profile | A device-local, non-authenticated profile that groups one or more companies. |
| Active company | The selected company whose snapshot is restored into runtime state and may advance foreground game time. |
| Device session | The persisted local selection of a player profile and active company; logging out clears this selection only. |
| Starting condition | The named setup definition used when a company is created. `standard` is the only approved condition in v1. |
| Prestige event | A company-level prestige source that may decay with active foreground time. |
| Achievement | A durable company milestone defined in code and unlocked once when its typed condition is met. |
| Achievement unlock | The persisted achievement ID and logical foreground time at which its condition was first met. |
| Production statistics | Lifetime facility output totals by resource, recorded only when a recipe completes output. |
| Progression gate | A pure all-of requirement check over achievements, current prestige, completed research, and a starting condition. |
| Research project | A code-defined, one-time company project with an up-front cost, foreground duration, requirements, and completion effect. |
| Active research | The one paid research project currently accumulating foreground milliseconds for its company. |
| Sales capacity | The derived maximum number of open customer contracts. It starts at one and is raised by completed Sales Capacity research. |

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
| Company save | The validated `GameSnapshot` keyed by one local company ID. |

## UI Terms

- **Primary action:** the most important touch action on the current screen.
- **Feedback:** visible response to a player action or state change.
- **Portrait baseline:** the narrow phone layout supported first.
- **View model:** UI-ready state derived without owning game rules.
