# Industri Clicker Variable Relationship Map

Concrete data relationships for rules defined in [gameflow.md](gameflow.md). This map owns variable-level state and command effects, not player rationale or full formulas.

## Stored and Runtime State

| State | Kind | Owner | Changes through | Saved as |
|---|---|---|---|---|
| `inventory.entries.*.quantity`, `.quality` | Stored | `Inventory` | Resource commands and production | `InventorySnapshot` |
| `finance.balance`, `.transactions` | Stored | `Finance` | Accepted transactions | `FinanceSnapshot` |
| `facilities[FacilityType]` and recipe progress | Stored | `FacilityCollection` | Construction, setup, upgrades, and production | Facility snapshot |
| Facility upgrade levels and assigned workers | Stored | `Facility` | Upgrade and staffing commands | Facility snapshot |
| `salesContracts.offered`, `.completed`, `.nextCustomerNumber` | Stored | `SalesContracts` | Offers and contract actions | `SalesContractsSnapshot` |
| `achievements.unlocks` | Stored | `AchievementLedger` | Post-command achievement evaluation | `AchievementLedgerSnapshot` |
| `productionStatistics.producedByResource` | Stored | `ProductionStatistics` | Completed facility recipe output only | `ProductionStatisticsSnapshot` |
| `prestige.events` | Stored | `PrestigeLedger` | Balance changes and fulfilled sales | `PrestigeLedgerSnapshot` |
| `companyStartedAtGameTimeMs`, `lastProcessedAtMs`, `unprocessedWorkMs`, `customerPipelineProgress` | Stored | Zustand game store | Company reset and global time advance | `GameTimeSnapshot` |
| `lastObservedAtMs` | Runtime | Zustand game store | Foreground observation and lifecycle | No |
| Local profile, company record, tutorial state, device session | Stored | Company domain SQLite adapters | Local player/company commands | Dedicated local tables |

Derived values include staffing efficiency, production work/output, contract reward and offer chance, current prestige, and UI view models.

## Command Effects

| Command | Reads | Writes |
|---|---|---|
| `setInventoryAmount` | Resource and amount | Inventory |
| `buildFacility`, `destroyFacility`, `setFacilityRecipe`, `setFacilityWorkers`, `upgradeFacility` | Facility definition; balance where applicable | Facilities; Finance where applicable |
| `advanceRealtime`, `advanceGameTime`, `fastForwardOneMinute` | Time anchors and all timed state | Game time, pipeline, facilities, inventory, sales contracts |
| Completed production output | Facility output and output multiplier | Production statistics; production achievements |
| `fulfillSalesContract`, `rejectSalesContract` | Contract; inventory and finance where applicable | Sales contracts; inventory and finance where applicable |
| Achievement evaluation | Post-command domain state | Achievement unlocks; idempotent achievement prestige events |
| `createSalesContractRequest` | Selected resource and quantity | Sales contracts and pipeline |
| `activateCompany` | Selected profile, outgoing snapshot, requested company snapshot | Device session; complete runtime game state |
| `resetActiveCompany` | Active company ID | Active company's snapshot and runtime game state |

All normal state changes batch persistence; background and explicit checkpoints flush it. UI issues commands and does not mutate state directly.

## Persistence Mapping

| State group | Save representation | Restore |
|---|---|---|
| Inventory, finance, facilities, sales contracts, achievements, production statistics, prestige | Respective snapshot inside a company-keyed `GameSnapshot` | Restore the active company's valid current-version snapshot |
| Foreground game time and pipeline | `GameTimeSnapshot` | Restore logical/partial time and pipeline; reset observation anchor |
| Catalogues and balance configuration | Typed code definitions | Reload from the app version; never save |
| Player/company/session/tutorial metadata | Dedicated company-domain SQLite records | Load before an active company runtime session begins |
