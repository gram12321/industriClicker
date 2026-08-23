# Industri Clicker Variable Relationship Map

This is the authority for concrete variables, dependencies, commands, time effects, and persistence. Names are in [CONTEXT.md](CONTEXT.md); rules/formulas are in [gameflow.md](gameflow.md). Tables are the compact index; Mermaid diagrams visualize the same relationships without replacing exact recipe values.

## Resource Production Map

`game/resources/resourceConstants.ts` owns resource identities/market seeds; `game/recipes/recipeConstants.ts` owns exact recipe values.

| Resource | Produced by | Inputs per cycle |
|---|---|---|
| Water | Small Utility Works: Produce Water; Water Well: Manual / Electric Pumping | None / None / 1 Electricity |
| Electricity | Small Utility Works: Produce Electricity; Power Plant: Coal / Solar Power | None / 0.5 Coal + 1 Water / None |
| Grain | Farm: Grow Grain | 1 Water, 1 Electricity, 0.025 Fertilizer |
| Sugar | Farm: Grow Sugar | 3 Water, 0.04 Fertilizer |
| Fruit | Farm: Grow Fruit | 2 Water, 0.03 Fertilizer |
| Meat | Animal Farm: Raise Cattle / Sheep / Chicken | 3 / 2 / 1 Grain, 2 / 1.5 / 1 Water, 1.25 / 1 / 0.75 Electricity |
| Milk | Animal Farm: Raise Cattle | 3 Grain, 2 Water, 1.25 Electricity |
| Wool | Animal Farm: Raise Sheep | 2 Grain, 1.5 Water, 1 Electricity |
| Eggs | Animal Farm: Raise Chicken | 1 Grain, 1 Water, 0.75 Electricity |
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
| Fertilizer | Chemical Plant: Synthesize Fertilizer; Animal Farm: Raise Cattle / Sheep / Chicken | 1 Chemicals, 1 Minerals, 1 Water, 2 Electricity / animal inputs |
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
  raiseCattle --> fertilizer[Fertilizer]
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
  copper --> produceCircuits([Industrial Processing Factory: Produce Electric Circuits])
  silicon --> produceCircuits
  plastic --> produceCircuits
  water --> produceCircuits
  electricity --> produceCircuits
  produceCircuits --> electricCircuits[Electric Circuits]

  minerals --> produceChemicals([Chemical Plant: Produce Chemicals])
  water --> produceChemicals
  electricity --> produceChemicals
  produceChemicals --> chemicals[Chemicals]
  chemicals --> synthesizeFertilizer([Chemical Plant: Synthesize Fertilizer])
  minerals --> synthesizeFertilizer
  water --> synthesizeFertilizer
  electricity --> synthesizeFertilizer
  synthesizeFertilizer --> fertilizer
  chemicals --> producePlastic([Chemical Plant: Produce Plastic])
  water --> producePlastic
  electricity --> producePlastic
  producePlastic --> plastic[Plastic]

  minerals --> produceSilicon([Electronics Factory: Produce Silicon])
  sand --> produceSilicon
  electricity --> produceSilicon
  produceSilicon --> silicon[Silicon]
  electricCircuits --> produceComponents([Electronics Factory: Produce Advanced Components])
  silicon --> produceComponents
  gold --> produceComponents
  water --> produceComponents
  electricity --> produceComponents
  produceComponents --> advancedComponents[Advanced Components]
  steel --> assembleMachines([Assembly Plant: Assemble Industrial Machines])
  electricCircuits --> assembleMachines
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

| Facility | Consumes | Produces |
|---|---|---|
| Farm | Water, Electricity, Fertilizer | Grain, Sugar, Fruit |
| Animal Farm | Grain, Water, Electricity | Meat, Milk, Wool, Eggs, Fertilizer |
| Bakery | Grain, Eggs, Fruit, Milk, Meat, Water, Electricity | Bread, Cake, Premium Cake, Meat Pie |
| Small Utility Works | None | Water, Electricity |
| Water Well | Electricity (electric mode) | Water |
| Power Plant | Coal and Water (coal mode) | Electricity |
| Mine | Water, Electricity, Chemicals | Coal, Iron, Copper, Gold |
| Quarry | Water, Electricity | Sand, Clay, Stone, Minerals |
| Industrial Processing Factory | Iron, Coal, Copper, Silicon, Plastic, Water, Electricity | Steel, Electric Circuits |
| Chemical Plant | Minerals, Water, Electricity, Chemicals | Chemicals, Fertilizer, Plastic |
| Electronics Factory | Minerals, Sand, Electric Circuits, Gold, Water, Electricity | Silicon, Advanced Components |
| Assembly Plant | Steel, Electric Circuits, Advanced Components, Water, Electricity | Industrial Machines |
| Construction Factory | Clay, Sand, Stone, Steel, Minerals, Chemicals, Plastic, Water, Electricity, Bricks, Cement, Reinforced Concrete | Bricks, Cement, Reinforced Concrete, Construction Materials |

```mermaid
flowchart LR
  water[Water]
  electricity[Electricity]
  coal[Coal]
  fertilizer[Fertilizer]
  grain[Grain]
  milk[Milk]
  wool[Wool]
  fruit[Fruit]
  eggs[Eggs]
  meat[Meat]
  chemicals[Chemicals]
  iron[Iron]
  copper[Copper]
  gold[Gold]
  sand[Sand]
  clay[Clay]
  stone[Stone]
  minerals[Minerals]
  silicon[Silicon]
  plastic[Plastic]
  electricCircuits[Electric Circuits]
  steel[Steel]
  advancedComponents[Advanced Components]
  bricks[Bricks]
  cement[Cement]
  reinforcedConcrete[Reinforced Concrete]

  utilityWorks([Small Utility Works])
  waterWell([Water Well])
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
  electricity --> waterWell
  coal --> powerPlant
  water --> powerPlant
  powerPlant --> electricity

  water --> farm
  electricity --> farm
  fertilizer --> farm
  farm --> grain
  farm --> sugar[Sugar]
  farm --> fruit
  grain --> animalFarm
  water --> animalFarm
  electricity --> animalFarm
  animalFarm --> meat
  animalFarm --> milk
  animalFarm --> wool
  animalFarm --> eggs
  animalFarm --> fertilizer
  grain --> bakery
  fruit --> bakery
  eggs --> bakery
  milk --> bakery
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
  industrial --> steel
  industrial --> electricCircuits
  minerals --> chemical
  water --> chemical
  electricity --> chemical
  chemicals --> chemical
  chemical --> chemicals
  chemical --> fertilizer
  chemical --> plastic

  minerals --> electronics
  sand --> electronics
  electricCircuits --> electronics
  gold --> electronics
  water --> electronics
  electricity --> electronics
  electronics --> silicon
  electronics --> advancedComponents[Advanced Components]
  steel --> assembly
  electricCircuits --> assembly
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
  bricks --> construction
  cement --> construction
  reinforcedConcrete --> construction
  construction --> bricks
  construction --> cement
  construction --> reinforcedConcrete
  construction --> constructionMaterials[Construction Materials]
```

## Stored and Runtime State

| State | Owner | Changes through | Saved as |
|---|---|---|---|
| `inventory.entries.*.quantity/.quality/.sourceCostPerUnit` | Inventory | Resource commands and production additions/removals | `InventorySnapshot` |
| `facility.recipeInputQ/.recipeInputSourceCost` | Facility | Captured at cycle input consumption; used at completion | Facility snapshot; production-maintenance allocation is added to output source cost |
| Facility upgrade levels, workers, staff wage, condition, auto-repair settings | Facility | Upgrade, staffing/wage, repair, and foreground wear | Facility snapshot |
| Resource-flow buckets and lifetime facility output | ResourceFlowLedger | Inventory-affecting commands and completed output | Game snapshot |
| Finance balance, transactions, loans, lenders, searches, economy phase, staff-wage charges | Finance | Cash commands and foreground finance rules | `FinanceSnapshot` |
| Numbered facilities, recipe order/position/progress, maintenance statistics | FacilityCollection | Construction, cycle setup, upgrades, production, repair | Facility snapshot |
| Offered/completed orders, customer states, next order number | SalesOrders | Create, fulfil, reject, expire, relationship progression | `SalesOrdersSnapshot` |
| Achievements, prestige events, research/grants | Their ledgers | Post-command evaluation and research commands | Their snapshots |
| Market pools, automation, depth multiplier, network activations | Market | Trades, order fulfilment, diffusion, activations | `MarketSnapshot` |
| Logical game time, partial work, customer pipeline | Game store | Company lifecycle and foreground advance | `GameTimeSnapshot` |
| Profile, company, session, tutorial metadata | SQLite adapters | Local identity and tutorial commands | Dedicated local tables |
| Wall-clock observation anchor and UI data | Runtime helpers | App lifecycle and selectors | Not persisted |

Derived values include facility efficiency/output, worker/wage efficiency, production-maintenance allocation, quality ceilings, order cap/rate/selection weights, prestige, market diffusion, market activation progress, research capacity, credit limits, statements, and UI view models.

## Command Effects

| Command/group | Reads | Writes |
|---|---|---|
| Inventory and market trades | Resource, amount, market quote, quality | Inventory, market, Finance, Resource Flow |
| Construction/material purchase | Facility definition, prices, supply, balance | Facilities, market, inventory, Finance |
| Facility commands | Definition, research, inputs, balance, facility state, staff wage | Facility collection, inventory, Finance, Resource Flow |
| Finance commands | Loan/search criteria, lender policies, credit report, active loan | Finance, prestige, achievements |
| Research commands | Catalogue, gates, grants, Finance, research ledger | Research, grants, Finance, prestige, achievements |
| `advanceRealtime` / `advanceGameTime` | Time anchors and all timed state | Time, facilities, staff wages, markets, orders, research, loans, Finance, flow |
| Completed production | Recipe, upgrades, input Q/source cost, production-maintenance allocation, lifetime output | Inventory, flow, Finance performance, achievements |
| Sales commands | Order, inventory, market, current time | Orders, relationships, inventory, global market, Finance, prestige, flow |
| Achievement evaluation | Post-command domain state | Unlocks and idempotent prestige events |
| Company/session commands | Profile/company records and snapshots | SQLite session, company save, runtime state |

UI issues commands; it does not mutate domain state directly.

## Persistence Mapping

| State group | Durable representation | Restore |
|---|---|---|
| Gameplay ledgers and domain state | Company-keyed current `GameSnapshot` | Valid active-company snapshot; invalid current saves are discarded |
| Logical time and pipeline | `GameTimeSnapshot` | Restore time/pipeline; reset observation anchor |
| Profile/company/session/tutorial metadata | Dedicated SQLite tables | Load before activating a company |
| Catalogues and balance values | Typed code constants | Reload from app version; never save |

Normal changes batch saves; background/checkpoints flush after final foreground processing. There is no compatibility migration layer.
