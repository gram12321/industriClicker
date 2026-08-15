# Industri Clicker Variable Relationship Map

Concrete data relationships for rules defined in [gameflow.md](gameflow.md). This map owns variable-level state and command effects, not player rationale or full formulas.

## Resource Production Map

The catalogue in `game/resources/resourceConstants.ts` is the source of truth for resource identities and market seeds; `game/recipes/recipeConstants.ts` owns the exact recipes. The table is a compact index of every current output. The diagram shows every direct production dependency; resources with no outgoing arrows have no current recipe consumer.

| Resource | Produced by | Inputs per cycle |
|---|---|---|
| Water | Small Utility Works: Produce Water; Water Well: Manual / Electric Pumping | None / None / 1 Electricity |
| Electricity | Small Utility Works: Produce Electricity; Power Plant: Coal / Solar Power | None / 0.5 Coal, 1 Water / None |
| Grain | Farm: Grow Grain | 1 Water, 1 Electricity, 0.025 Fertilizer |
| Sugar | Farm: Grow Sugar | 3 Water, 0.04 Fertilizer |
| Fruit | Farm: Grow Fruit | 2 Water, 0.03 Fertilizer |
| Meat | Animal Farm: Raise Cattle / Sheep / Chicken | 12 / 8 / 4 Grain, 8 / 6 / 4 Water, 5 / 4 / 3 Electricity |
| Milk | Animal Farm: Raise Cattle | 12 Grain, 8 Water, 5 Electricity |
| Wool | Animal Farm: Raise Sheep | 8 Grain, 6 Water, 4 Electricity |
| Eggs | Animal Farm: Raise Chicken | 4 Grain, 4 Water, 3 Electricity |
| Bread | Bakery: Bake Bread | 1.5 Grain, 1 Water, 1 Electricity |
| Cake | Bakery: Bake Cake | 1 Grain, 0.5 Eggs, 2 Water, 2 Electricity |
| Premium Cake | Bakery: Bake Premium Cake | 1 Grain, 0.5 Eggs, 1 Fruit, 1 Milk, 2 Water, 2 Electricity |
| Meat Pie | Bakery: Bake Meat Pie | 1 Grain, 1 Meat, 1 Water, 2 Electricity |
| Coal | Mine: Mine Coal | 1 Water, 2 Electricity |
| Iron | Mine: Mine Iron | 2 Water, 4 Electricity, 0.1 Chemicals |
| Copper | Mine: Mine Copper | 2 Water, 5 Electricity, 0.1 Chemicals |
| Gold | Mine: Mine Gold | 3 Water, 8 Electricity |
| Sand | Quarry: Quarry Sand | 1 Water, 1 Electricity |
| Clay | Quarry: Quarry Clay | 2 Water, 1 Electricity |
| Stone | Quarry: Quarry Stone | 1 Water, 4 Electricity |
| Minerals | Quarry: Quarry Minerals | 1 Water, 2 Electricity |
| Steel | Industrial Processing Factory: Produce Steel | 2 Iron, 1 Coal, 2 Water, 6 Electricity |
| Electric Circuits | Industrial Processing Factory: Produce Electric Circuits | 2 Copper, 1 Silicon, 1 Plastic, 1 Water, 4 Electricity |
| Chemicals | Chemical Plant: Produce Chemicals | 2 Minerals, 2 Water, 4 Electricity |
| Fertilizer | Chemical Plant: Synthesize Fertilizer; Animal Farm: Raise Cattle / Sheep / Chicken | 1 Chemicals, 1 Minerals, 1 Water, 2 Electricity / respective Grain, Water, and Electricity inputs |
| Plastic | Chemical Plant: Produce Plastic | 2 Chemicals, 1 Water, 3 Electricity |
| Silicon | Electronics Factory: Produce Silicon | 3 Minerals, 3 Sand, 5 Electricity |
| Advanced Components | Electronics Factory: Produce Advanced Components | 2 Electric Circuits, 2 Silicon, 0.1 Gold, 1 Water, 4 Electricity |
| Industrial Machines | Assembly Plant: Assemble Industrial Machines | 6 Steel, 3 Electric Circuits, 2 Advanced Components, 2 Water, 6 Electricity |
| Bricks | Construction Factory: Produce Bricks | 2 Clay, 1 Sand, 1 Water, 3 Electricity |
| Cement | Construction Factory: Produce Cement | 3 Stone, 1 Clay, 1 Minerals, 1 Water, 5 Electricity |
| Reinforced Concrete | Construction Factory: Produce Reinforced Concrete | 2 Cement, 3 Sand, 2 Stone, 2 Steel, 0.5 Minerals, 0.25 Chemicals, 2 Water, 2 Electricity |
| Construction Materials | Construction Factory: Produce Construction Materials | 2 Bricks, 1 Reinforced Concrete, 1 Steel, 1 Sand, 1 Cement, 0.1 Chemicals, 0.2 Plastic, 2 Electricity |

```mermaid
flowchart LR
  utilityWater([Small Utility Works: Produce Water]) --> water[Water]
  manualPump([Water Well: Manual Pumping]) --> water
  electricity --> electricPump([Water Well: Electric Pumping])
  electricPump --> water

  utilityPower([Small Utility Works: Produce Electricity]) --> electricity[Electricity]
  solarPower([Power Plant: Solar Power]) --> electricity
  coal --> coalPower([Power Plant: Coal Power])
  water --> coalPower
  coalPower --> electricity

  water --> growGrain([Farm: Grow Grain])
  electricity --> growGrain
  fertilizer --> growGrain
  growGrain --> grain[Grain]
  water --> growSugar([Farm: Grow Sugar])
  fertilizer --> growSugar
  growSugar --> sugar[Sugar]
  water --> growFruit([Farm: Grow Fruit])
  fertilizer --> growFruit
  growFruit --> fruit[Fruit]
  grain --> raiseCattle([Animal Farm: Raise Cattle])
  water --> raiseCattle
  electricity --> raiseCattle
  raiseCattle --> meat[Meat]
  raiseCattle --> milk[Milk]
  raiseCattle --> fertilizer
  grain --> raiseSheep([Animal Farm: Raise Sheep])
  water --> raiseSheep
  electricity --> raiseSheep
  raiseSheep --> meat
  raiseSheep --> wool[Wool]
  raiseSheep --> fertilizer
  grain --> raiseChicken([Animal Farm: Raise Chicken])
  water --> raiseChicken
  electricity --> raiseChicken
  raiseChicken --> meat
  raiseChicken --> eggs[Eggs]
  raiseChicken --> fertilizer
  grain --> bakeBread([Bakery: Bake Bread])
  water --> bakeBread
  electricity --> bakeBread
  bakeBread --> bread[Bread]
  grain --> bakeCake([Bakery: Bake Cake])
  eggs --> bakeCake
  water --> bakeCake
  electricity --> bakeCake
  bakeCake --> cake[Cake]
  grain --> bakePremiumCake([Bakery: Bake Premium Cake])
  eggs --> bakePremiumCake
  fruit --> bakePremiumCake
  milk --> bakePremiumCake
  water --> bakePremiumCake
  electricity --> bakePremiumCake
  bakePremiumCake --> premiumCake[Premium Cake]
  grain --> bakeMeatPie([Bakery: Bake Meat Pie])
  meat --> bakeMeatPie
  water --> bakeMeatPie
  electricity --> bakeMeatPie
  bakeMeatPie --> meatPie[Meat Pie]

  water --> mineCoal([Mine: Mine Coal])
  electricity --> mineCoal
  mineCoal --> coal[Coal]
  water --> mineIron([Mine: Mine Iron])
  electricity --> mineIron
  chemicals --> mineIron
  mineIron --> iron[Iron]
  water --> mineCopper([Mine: Mine Copper])
  electricity --> mineCopper
  chemicals --> mineCopper
  mineCopper --> copper[Copper]
  water --> mineGold([Mine: Mine Gold])
  electricity --> mineGold
  mineGold --> gold[Gold]

  water --> quarrySand([Quarry: Quarry Sand])
  electricity --> quarrySand
  quarrySand --> sand[Sand]
  water --> quarryClay([Quarry: Quarry Clay])
  electricity --> quarryClay
  quarryClay --> clay[Clay]
  water --> quarryStone([Quarry: Quarry Stone])
  electricity --> quarryStone
  quarryStone --> stone[Stone]
  water --> quarryMinerals([Quarry: Quarry Minerals])
  electricity --> quarryMinerals
  quarryMinerals --> minerals[Minerals]

  iron --> produceSteel([Industrial Processing Factory: Produce Steel])
  coal --> produceSteel
  water --> produceSteel
  electricity --> produceSteel
  produceSteel --> steel[Steel]
  copper --> produceCircuits
  silicon --> produceCircuits
  plastic --> produceCircuits
  water --> produceCircuits
  electricity --> produceCircuits
  produceCircuits --> circuits[Electric Circuits]

  minerals --> produceChemicals([Chemical Plant: Produce Chemicals])
  water --> produceChemicals
  electricity --> produceChemicals
  produceChemicals --> chemicals[Chemicals]
  chemicals --> synthesizeFertilizer([Chemical Plant: Synthesize Fertilizer])
  minerals --> synthesizeFertilizer
  water --> synthesizeFertilizer
  electricity --> synthesizeFertilizer
  synthesizeFertilizer --> fertilizer[Fertilizer]
  chemicals --> producePlastic([Chemical Plant: Produce Plastic])
  water --> producePlastic
  electricity --> producePlastic
  producePlastic --> plastic[Plastic]
  minerals --> produceSilicon([Electronics Factory: Produce Silicon])
  sand --> produceSilicon
  electricity --> produceSilicon
  produceSilicon --> silicon[Silicon]
  circuits --> produceComponents([Electronics Factory: Produce Advanced Components])
  silicon --> produceComponents
  gold --> produceComponents
  water --> produceComponents
  electricity --> produceComponents
  produceComponents --> advancedComponents[Advanced Components]
  steel --> assembleMachines([Assembly Plant: Assemble Industrial Machines])
  circuits --> assembleMachines
  advancedComponents --> assembleMachines
  water --> assembleMachines
  electricity --> assembleMachines
  assembleMachines --> industrialMachines[Industrial Machines]

  clay --> produceBricks([Construction Factory: Produce Bricks])
  sand --> produceBricks
  water --> produceBricks
  electricity --> produceBricks
  produceBricks --> bricks[Bricks]
  stone --> produceCement([Construction Factory: Produce Cement])
  clay --> produceCement
  minerals --> produceCement
  water --> produceCement
  electricity --> produceCement
  produceCement --> cement[Cement]
  cement --> produceConcrete([Construction Factory: Produce Reinforced Concrete])
  sand --> produceConcrete
  stone --> produceConcrete
  steel --> produceConcrete
  minerals --> produceConcrete
  chemicals --> produceConcrete
  water --> produceConcrete
  electricity --> produceConcrete
  produceConcrete --> reinforcedConcrete[Reinforced Concrete]
  bricks --> produceMaterials([Construction Factory: Produce Construction Materials])
  reinforcedConcrete --> produceMaterials
  steel --> produceMaterials
  sand --> produceMaterials
  cement --> produceMaterials
  chemicals --> produceMaterials
  plastic --> produceMaterials
  electricity --> produceMaterials
  produceMaterials --> constructionMaterials[Construction Materials]
```

## Facility Resource Flow Map

This view uses the same resource-flow model as the recipe diagram, but each facility is represented once even when it has several recipes. Resource arrows therefore show all resources a facility can consume or produce; several Construction Factory resources form intentional within-facility loops.

```mermaid
flowchart LR
  utilityWorks([Small Utility Works])
  waterWell([Water Well])
  copper[Copper]
  coal[Coal]
  sand[Sand]
  iron[Iron]
  stone[Stone]
  clay[Clay]
  gold[Gold]
  minerals[Minerals]

  utilityAlignment[ ]:::hidden
  utilityAlignment --> utilityWorks
  utilityAlignment --> waterWell

  rawAlignment[ ]:::hidden
  rawAlignment --> copper
  rawAlignment --> coal
  rawAlignment --> sand
  rawAlignment --> iron
  rawAlignment --> stone
  rawAlignment --> clay
  rawAlignment --> gold
  rawAlignment --> minerals

  water[Water]
  electricity[Electricity]
  powerPlant([Power Plant])
  farm([Farm])
  animalFarm([Animal Farm])
  bakery([Bakery])
  mine([Mine])
  quarry([Quarry])
  industrial([Industrial Processing Factory])
  chemical([Chemical Plant])
  electronics([Electronics Factory])
  assembly([Assembly Plant])
  construction([Construction Factory])

  utilityWorks --> water
  utilityWorks --> electricity
  waterWell --> water
  water --> powerPlant
  powerPlant --> electricity
  electricity --> waterWell
  coal --> powerPlant

  water --> farm
  electricity --> farm
  fertilizer --> farm
  farm --> grain[Grain]
  farm --> sugar[Sugar]
  farm --> fruit[Fruit]
  grain --> animalFarm
  water --> animalFarm
  electricity --> animalFarm
  animalFarm --> meat[Meat]
  animalFarm --> milk[Milk]
  animalFarm --> wool[Wool]
  animalFarm --> eggs[Eggs]
  animalFarm --> fertilizer[Fertilizer]
  grain --> bakery
  sugar --> bakery
  fruit --> bakery
  eggs --> bakery
  meat --> bakery
  water --> bakery
  electricity --> bakery
  bakery --> bread[Bread]
  bakery --> cake[Cake]
  bakery --> premiumCake[Premium Cake]
  bakery --> meatPie[Meat Pie]

  water --> mine
  electricity --> mine
  chemicals --> mine
  mine --> coal
  mine --> iron
  mine --> copper
  mine --> gold

  water --> quarry
  electricity --> quarry
  quarry --> sand
  quarry --> clay
  quarry --> stone
  quarry --> minerals

  iron --> industrial
  coal --> industrial
  copper --> industrial
  silicon --> industrial
  plastic --> industrial
  water --> industrial
  electricity --> industrial
  industrial --> steel[Steel]
  industrial --> circuits[Electric Circuits]

  minerals --> chemical
  water --> chemical
  electricity --> chemical
  chemical --> chemicals[Chemicals]
  chemicals --> chemical
  chemical --> fertilizer[Fertilizer]
  chemical --> plastic[Plastic]

  minerals --> electronics
  sand --> electronics
  circuits --> electronics
  gold --> electronics
  water --> electronics
  electricity --> electronics
  electronics --> silicon[Silicon]
  electronics --> advancedComponents[Advanced Components]

  steel --> assembly
  circuits --> assembly
  advancedComponents --> assembly
  water --> assembly
  electricity --> assembly
  assembly --> industrialMachines[Industrial Machines]

  clay --> construction
  sand --> construction
  stone --> construction
  steel --> construction
  minerals --> construction
  chemicals --> construction
  plastic --> construction
  water --> construction
  electricity --> construction
  construction --> bricks[Bricks]
  construction --> cement[Cement]
  construction --> reinforcedConcrete[Reinforced Concrete]
  bricks --> construction
  cement --> construction
  reinforcedConcrete --> construction
  construction --> constructionMaterials[Construction Materials]

  linkStyle 0,1,2,3,4,5,6,7,8,9 opacity:0;
  classDef hidden fill:none,stroke:none,color:transparent;
```

## Stored and Runtime State

| State | Kind | Owner | Changes through | Saved as |
|---|---|---|---|---|
| `inventory.entries.*.quantity`, `.quality` | Stored | `Inventory` | Resource commands and production | `InventorySnapshot` |
| `finance.balance`, `.transactions`, `.loans`, `.lenders`, `.activeLoanSearch`, `.loanSearchOffers`, economy phase, loan-payment history | Stored | `Finance` | Accepted transactions, timed lender searches, loan actions, economy transitions, and foreground repayment attempts | `FinanceSnapshot` |
| Numbered facility instances and recipe progress | Stored | `FacilityCollection` | Construction, setup, upgrades, and production | Facility snapshot |
| Facility upgrade levels, assigned workers, and 0–1 condition | Stored | `Facility` | Upgrade/staffing commands and foreground wear/production tear | Facility snapshot |
| `salesContracts.offered`, `.completed`, `.nextCustomerNumber` | Stored | `SalesContracts` | Offers and contract actions | `SalesContractsSnapshot` |
| `achievements.unlocks` | Stored | `AchievementLedger` | Post-command achievement evaluation | `AchievementLedgerSnapshot` |
| `productionStatistics.producedByResource` | Stored | `ProductionStatistics` | Completed facility recipe output only | `ProductionStatisticsSnapshot` |
| `prestige.events` | Stored | `PrestigeLedger` | Balance changes and fulfilled sales | `PrestigeLedgerSnapshot` |
| `research.completed`, `.active` (including an active project's effective duration) | Stored | `ResearchLedger` | Research start, foreground advance, completion, cancellation | `ResearchLedgerSnapshot` |
| `grants.grants` | Stored | `GrantLedger` | First facility construction and free-action consumption | `GrantLedgerSnapshot` |
| `market.local`, `.regional`, `.global`, `.automation` | Stored | `Market` | Manual local trades, contract fulfilment, and adjacent-pair diffusion | `MarketSnapshot` |
| `startingConditionId` | Runtime | Zustand game store | Company activation/session change | No; source is the local company record |
| `companyStartedAtGameTimeMs`, `lastProcessedAtMs`, `unprocessedWorkMs`, `customerPipelineProgress` | Stored | Zustand game store | Company creation, deletion, and global time advance | `GameTimeSnapshot` |
| `lastObservedAtMs` | Runtime | Zustand game store | Foreground observation and lifecycle | No |
| Local profile, company record, tutorial state, device session | Stored | Company domain SQLite adapters | Local player/company commands | Dedicated local tables |

Derived values include facility efficiency, production work/output, contract reward and offer chance, current prestige, market diffusion amount, completed-research local market depth and local-regional diffusion rate, and UI view models.

## Command Effects

| Command | Reads | Writes |
|---|---|---|
| `setInventoryAmount` | Resource and amount | Inventory |
| `buyMissingConstructionInputs` | Facility definition; local Construction Materials and Industrial Machines prices/supply; balance; inventory | Market; Finance; Inventory |
| `acceptLoanOffer` | Derived credit rating and selected deterministic lender offer | Finance loan/transaction state, prestige, finance achievements |
| `startLoanSearch`, `makeExtraLoanPayment`, `repayLoanInFull` | Selected criteria or active loan, lender policy caps, balance | Search activity/fee or finance transactions, loans, payment history, and derived credit rating |
| `buildFacility`, `destroyFacility`, `repairFacility`, `setFacilityRecipe`, `setFacilityWorkers`, `upgradeFacility` | Facility definition; balance, Construction Materials, and Industrial Machines where applicable | Facilities; Finance; Inventory where applicable |
| `advanceRealtime`, `advanceGameTime`, `fastForwardOneMinute` | Time anchors and all timed state | Game time, pipeline, facility condition, inventory, sales contracts, local/regional/global market, active research, active lender searches, due loan payments |
| Completed production outputs | Recipe outputs and facility output multiplier | Inventory; production statistics; production achievements |
| `fulfillSalesContract`, `rejectSalesContract` | Contract; inventory and finance where applicable | Sales contracts; inventory and finance where applicable |
| Achievement evaluation | Post-command domain state | Achievement unlocks; idempotent achievement prestige events |
| `getResearchAvailability`, `startResearch`, `cancelResearch` | Code catalogue, pure gate context, finance, research ledger, progression grants | Research; grant use; finance/prestige and relevant achievements |
| `createSalesContractRequest` | Selected resource, quantity, derived capacity | Sales contracts and pipeline |
| `activateCompany` | Selected profile, outgoing snapshot, requested company snapshot | Device session; complete runtime game state |
| `deleteActiveCompany` | Active company ID | Removes the active company and returns to local company selection |
| `clearAllLocalData` | All local records | Clears profiles, companies, saves, tutorials, and the device session |

All normal state changes batch persistence; background and explicit checkpoints flush it. UI issues commands and does not mutate state directly.

## Persistence Mapping

| State group | Save representation | Restore |
|---|---|---|
| Inventory, finance (including loans), facilities, sales contracts, achievements, production statistics, prestige, research, progression grants | Respective snapshot inside a company-keyed `GameSnapshot` | Restore the active company's valid snapshot |
| Foreground game time and pipeline | `GameTimeSnapshot` | Restore logical/partial time and pipeline; reset observation anchor |
| Catalogues and balance configuration | Typed code definitions | Reload from the app version; never save |
| Player/company/session/tutorial metadata | Dedicated company-domain SQLite records | Load before an active company runtime session begins |
