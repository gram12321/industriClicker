# Economy Ecosystem Brainstorm: Private Circular Economy

This document records the conclusions from the economy-design discussion prompted by a review of the local `simulus` project. It is a design-brainstorm summary, not an implementation plan and not yet an authority for runtime formulas.

The immediate direction is to explore a private economy first: player-owned production facilities, paid workers, household disposable income, population demand, and resource markets. Public finance, taxation, municipal budgets, unemployment benefits, city buildings, and politics are intentionally outside this first scope.

## 1. Lessons from Simulus

Simulus has a more developed demand side than Industri Clicker. Its population is divided by age and income/education strata, and those groups consume resource baskets with different multipliers. Demand is adjusted by price elasticity and substitution between related resources. Consumption removes leaf resources from the local market, which creates price pressure for the production system.

Its production and population systems therefore form a useful supply-and-demand model:

```text
Population demographics -> resource demand -> market supply falls -> prices change
Production facilities    -> resource supply -> market supply rises -> prices change
```

Simulus also has a tax-funded city economy. Resident income is taxed into a city treasury, which pays city-building wages, wage subsidies, and unemployment benefits. The treasury affects city employment and public-building affordability.

The important failure for Industri Clicker is that Simulus does not close the private monetary loop:

- Private-facility workers receive wages, but the facilities do not pay those wages from company funds.
- Taxes are credited to the city treasury without reducing residents' recorded income.
- Population demand is based on gross income, age, and strata rather than an actual disposable-income budget.
- Resource consumption is a supply subtraction, not a purchase that transfers money to a seller.

The lesson is not to copy Simulus's tax system at this stage. The valuable lesson is to connect production, income, purchasing power, demand, and resource consumption explicitly.

## 2. Cash-free local-market clearing

The current private model uses a cash-free Local Market clearing convention. The market is a resource reservoir and exchange, not a cash-holding actor: company sales credit company Finance when stock enters Local Market, and population purchases debit household cash when stock leaves it. Those are the two sides of the market clearing flow, but the market persists neither a cash balance nor seller ownership. The current model distinguishes:

- The player company: facility cash, inventories, capital, and financial obligations.
- Households/workers: wages received, disposable income, and consumer spending.
- Local Market: the cash-free clearing reservoir for company and household trades.
- Eventually, a shared global/external sector: inter-company trade, imports, and exports.

The current accounting boundary is:

```text
Company cash and household cash are recorded; Local Market inventory is recorded, while its balancing cash and seller position are intentionally not persisted.
```

This is a deliberate simplification for the local-first stage. A future shared or external market must introduce its own explicit settlement rules rather than inheriting an implicit cash balance from Local Market.

Examples:

| Event | Company | Households / private market |
| --- | ---: | ---: |
| Facility pays €100 wages | -100 | +100 |
| Company sells €100 of goods into Local Market | +100 | — |
| Population buys €100 from Local Market | — | -100 |
| Production transforms inputs into output | no cash change | no cash change |

Physical resources do not have to be conserved in the same way. Household consumption is a legitimate final sink. Construction materials and machines become embodied in productive capital. Extraction, imports, quality loss, maintenance, and final consumption need explicit material sources and sinks, but they need not preserve every physical unit forever.

This distinction is important: a resource can disappear through final consumption while its purchase money moves to the resource owner. A euro cannot simply disappear because a facility paid an expense.

## 3. The first economy scope

The first useful loop is private and deliberately excludes government:

```text
Private production -> paid wages -> household disposable income
        ^                                      |
        |                                      v
   company sales <- population purchases <- resource demand
```

Industri Clicker's existing facility wage model should remain the basis. A facility pays the configured wage as a real company expense. The identical amount is credited to the worker/household side. Employment therefore creates both:

- A cost that the facility must sustain.
- Purchasing power that can return to companies through consumer demand.

Population demand should be budget-constrained. A household or cohort may have desired quantities, but it cannot purchase more than its disposable-income balance permits. Unspent income can remain as savings rather than being forced into demand.

For the initial model, aggregate household or population cohorts are sufficient; individual bank accounts are not required. The model should still preserve the distinction between gross wages, disposable income, desired demand, fulfilled purchases, and savings.

Population consumption is treated as a household purchase followed by a final resource sink:

1. A household budget is debited at the Local Market execution price.
2. The purchased resource is removed from Local Market stock as consumption.
3. Local Market itself records neither cash nor seller ownership.

The convention deliberately keeps Local Market as an exchange rather than a separate economy actor.

## 4. Market layers and where population buys

Industri Clicker has three intended market layers:

| Layer | Intended role | Initial economic boundary |
| --- | --- | --- |
| Local | Player-facing retail market and fast price signal | Private/company-facing |
| Regional | Larger private buffer and wholesale balancing reservoir | Private to the player/company or private region |
| Global | Eventual shared inter-company market | Shared across companies |

The design conclusion is to use a layered, price-routed model rather than a fixed percentage of demand assigned to each market.

```text
Facility output -> Local market -> local population demand
                     ^                 |
                     |                 v
              Regional replenishment  final consumption
                     ^
                     |
          Global imports when local/private supply is too expensive
```

The proposed first behavior is:

1. Population demand attempts to buy through the local market.
2. The regional market replenishes local supply and absorbs local excess.
3. If local/private supply is unavailable or its landed price is sufficiently high, demand may be served from the global market.

The source decision should depend on availability, landed price, and access/logistics friction. It should not be an arbitrary fixed split such as “20% local, 30% regional, 50% global.” A fixed split hides why goods move and can create discontinuities when one reservoir is empty.

A simple future rule is:

- Use local supply while it is available and not materially more expensive than regional supply.
- Use regional supply when local supply is short or overpriced.
- Use global supply only when the global landed price, including trade/logistics cost, is competitive with or better than the private sources.

A smooth price-weighted split may eventually be preferable to a hard winner-takes-all rule, but the economic reason for the split should remain visible.

## 5. Private versus shared demand

There are three broad choices:

### Private demand from local or regional supply

Each company owns its population and demand. Its population consumes from the company's local/private market. This gives the clearest wage-to-demand loop and keeps one company's early growth from draining every other company's consumer market.

### Fully shared global demand

Every company's population contributes to a shared global population and demand pool. This creates a genuine multi-company macroeconomy, but it requires shared authoritative state, aggregate population progression, shared demand settlement, and a server-owned or otherwise synchronized global market. It is not suitable for the current local-first stage.

### Hybrid demand

Population is private, but it can buy from the shared global market when local/private landed prices are too high. The population remains a company-owned demand source while the global market acts as a trade and fallback layer.

The preferred direction is the hybrid model, introduced in stages: private population demand first, with local and regional fulfilment; explicit global imports/exports later. When the global market becomes shared, the closed system expands to include all companies, populations, and the global market. A single company is then an open participant in that larger closed economy.

## 6. How the economy can grow

Real economic growth does not require every period to produce more physical goods than are consumed. Growth comes from increasing productive capacity and producing more value per unit of labour, material, and time.

The game's growth channels should be explicit:

- More population and employment provide more labour and more consumers.
- Retained company profit funds new facilities and productive capital.
- Research and upgrades increase output, quality, efficiency, or the range of viable production.
- Higher-quality or more advanced goods create additional value and demand.
- Later, wider market access and global trade can expand the reachable demand pool.

This means production can exceed current consumption temporarily and become inventory or capital. It should not automatically become infinite wealth. The stabilisers are:

- Household purchases are limited by disposable income.
- Desired demand is budget-capped rather than “buy all available supply.”
- Facility wages, inputs, maintenance, and capital costs are real expenses.
- Higher prices reduce affordable quantity and encourage substitution.
- Wage increases have diminishing productivity benefits and cannot be assumed to create free demand.
- Population, capacity, technology, and market access expand through explicit progression rather than cash alone.

The intended positive loop is therefore:

```text
Profitable production -> wages and retained profit
Wages -> household purchasing power
Purchasing power -> demand for useful goods
Demand -> sales and price signals
Sales/profit -> capacity and technology investment
Capacity/technology -> more valuable production
```

The loop remains bounded by labour, budgets, resource availability, prices, facility costs, and diminishing returns.

## 7. Resource tiers, meaningful units, and bundles

Simulus, TraderGame01, and TraderGame04 all use a resource-tier system that Industri Clicker does not currently have. A tier system makes it possible to express population needs at an aggregate level instead of writing direct demand for every leaf resource. For example, a cohort could need a quantity of Food, Materials, Services, and Utilities, while the hierarchy or bundle determines the leaf resources ultimately consumed.

This is valuable because it provides a common consumption language. Simulus could describe a population need in meaningful aggregate units such as food mass, material mass, monetary-value services, or utility units, rather than asking the population to independently desire Grain, Bread, Milk, and every later food resource. A resource inheritance under the same Tier 1 parent had to share a compatible unit, because otherwise the parent bundle could not be added together.

That is a real strength for physically comparable categories, especially food. A Food need expressed in kilograms or another nutrition-aware food unit can be fulfilled by different food products. It is less natural for other domains:

- Food can plausibly use kilograms, calories, or a deliberately designed food-fulfilment unit.
- Materials should not automatically use kilograms just because they are physical. A kilogram of sand and a kilogram of gold do not make comparable contributions to a household material basket.
- Services are usually better represented by value, service credits, or specific delivered activities than by a physical common unit.
- Utilities may use delivered units such as kWh, litres of water, or a normalised utility-service unit, but only where the underlying goods really can be compared.

Simulus exposed the danger of treating a physical unit as a universal aggregate unit. A high-value material such as GoldMaterial, measured in kilograms, can dominate the price of a Materials aggregate even if it is not a meaningful share of ordinary material use. The hierarchy alone does not solve that problem: the aggregate needs an explicit conversion or composition rule that says how much each leaf contributes to one unit of the parent need.

TraderGame04 made this idea clearer by naming parent purchases and stocks as bundles. Its aggregate trade resolves deterministically into fixed fractional leaf quantities, and aggregate stock is calculated with fixed leaf shares. That is a useful distinction from a free-floating parent resource: a `Food Bundle` is not an undifferentiated kilogram of every food, but a defined basket whose composition and conversion factors are deliberately balanced.

Fixed bundles are not automatically a complete solution. A high-priced leaf can still dominate a bundle if its share is poorly chosen. Their advantage is that the share can be extremely small, zero for an ordinary basket, or otherwise calibrated to the intended contribution of that leaf. The composition becomes a visible design choice rather than an accidental result of the leaf's unit price.

For Industri Clicker, true resource tiers remain out of scope. Construction Materials is not a tier resource: it is a produced intermediate with a fixed recipe that bundles domain inputs into a new inventory item, then becomes capital when construction consumes it. It should not yet be treated as evidence that the game already has general parent-resource semantics.

The useful near-term concept is therefore a virtual consumer-need basket, not a new tradable tier-resource catalogue. A future Food need can map existing resources to a common food-fulfilment unit. Each candidate would state how much need it fulfils per market unit and its consumer role, while the physical resources, recipes, and markets stay as they are. This preserves the option of adopting real tiers and explicit bundles later, once their trade and inventory benefits justify their complexity.

## 8. Price elasticity and substitution lessons

The predecessor projects used three different substitution approaches. They should not be treated as the same system.

### Simulus: general pairwise price elasticity within a Tier 1 group

Simulus does not use a hand-authored table of substitution pairs. It groups all consumable leaf resources by their shared Tier 1 ancestor, then evaluates every unique pair within that group. A current price ratio is compared with a configured target-price ratio; demand is shifted from the relatively expensive resource to the relatively cheap one, with a capped and normalised transfer so no resource loses more than its base demand.

This means Simulus is pairwise in calculation, but not pair-authored in design. It currently allows every Food leaf to substitute for every other Food leaf, while preventing Food from substituting for Utilities or Materials. Its source code explicitly notes a possible later refinement: siblings could receive stronger elasticity, cousins a medium value, and resources that only share a Tier 1 ancestor a lower value. That hierarchy-distance weighting was not implemented.

The generality is attractive, but the model moves raw resource quantities one-for-one and does not use a household cash budget. On its own, it cannot reliably model a person replacing one loaf of bread with the appropriate amount of grain, nor the difference between voluntarily preferring bread and being forced to buy grain when poor.

### TraderGame01: explicit resource-pair table

TraderGame01 contains a manually authored `RESOURCE_ELASTICITY_PAIRS` table. It gives high substitution values to close alternatives such as Grain and Corn or Bread and Corn Bread, lower values across processing levels, and asymmetric values for some ingredient/product relationships.

This has more semantic control than Simulus's current all-within-Tier-1 rule, but it is brittle. Every new resource needs deliberate pair entries, directionality can be duplicated or inconsistent, and the table grows quickly. It is a useful source of examples for relationship strengths, not a preferred structure to copy wholesale.

### ProtoProduction: processing-level matrix

ProtoProduction takes a middle path. Every resource is labelled `raw`, `intermediate`, or `finished`, and a matrix gives the substitution strength between those levels. It therefore allows strong substitution within a processing level, weaker substitution across levels, and compares price movement against a reference ratio.

This is closer to the desired sibling/cousin idea, but it is too broad by itself: every raw resource can substitute for every other raw resource in the active set, even when they satisfy unrelated needs. A processing level says something about production stage, not whether Water and Grain are consumer alternatives. TraderGame04, meanwhile, has tier and fixed-bundle infrastructure but no completed population price-elasticity/substitution system to adopt.

### Direction for Industri Clicker

The best future model combines the useful parts without importing any predecessor system directly:

1. A population demand entry belongs to a consumer-need category, such as Food. Only candidates for the same need are eligible substitutes. This prevents category mistakes that hierarchy or processing level alone cannot prevent.
2. Each candidate provides need fulfilment per unit, consumer rung (`basic`, `finished`, or `luxury`), and a preference or quality value. Prices must be compared per unit of need fulfilment, not as raw market-unit prices.
3. Household disposable income constrains the final choice. As budgets tighten, households reduce luxury consumption first, then trade finished products for basic staples, and finally leave the need partly unfulfilled if even the cheapest viable basket is unaffordable or unavailable.
4. Price elasticity shifts demand among otherwise viable candidates. If real resource tiers are added later, hierarchy distance can contribute to the substitution strength: close siblings high, more distant relatives lower, different top-level needs zero. It should supplement consumer compatibility and affordability rather than replace them.

In this model, Bread-to-Grain substitution is understandable: both fulfil Food, but Bread has a higher preferred consumer rung and Grain is a cheaper basic fallback. The switch happens because the household cannot afford its preferred basket, not because the game arbitrarily treats a bread unit and a grain unit as interchangeable.

## 9. Design boundaries and unresolved choices

The following boundaries are currently agreed:

- Public taxation, municipal treasury, unemployment benefits, city buildings, and politics are out of scope for the first private loop.
- Facility-paid wages remain a real company expense.
- Population demand must eventually be tied to disposable income, not only gross income or population count.
- Population consumption must be a purchase/settlement plus a physical resource sink.
- Local and regional markets are private layers before global demand is shared.
- Global trade must define an explicit settlement rule before it is introduced; it does not inherit a Local Market cash balance.
- Fixed demand fractions across local, regional, and global markets are not preferred.

Choices still requiring detailed design later:

- Whether the first demand implementation consumes physically from local stock, regional stock, or a local retail layer backed by regional stock.
- Whether later market layers need inventory ownership or provenance when households buy goods from different sellers.
- Initial household money/endowments and how they coexist with the company's starting cash and seeded market stock.
- Whether population is represented as aggregate cohorts or eventually as individual residents.
- The exact demand cadence, budget allocation, price response, and source-routing formula.
- The future food-fulfilment unit, its conversion factors for raw and processed foods, and which consumer goods can fulfil it.
- Whether eventual tier resources should use fixed bundles for all parent trade, only selected consumer needs, or no aggregate trading at all.
- How a future substitution strength combines need compatibility, processing/quality rung, recipe relationship, and possible hierarchy distance.
- When and how the shared global market is introduced without requiring premature backend or multiplayer infrastructure.

These are design questions, not commitments for every future layer. The initial consumer implementation now uses the existing resource-domain base basket, a wage-capped per-minute basket, luxury pressure, and reference-price elasticity within each domain. Future work can refine the balance values, candidate set, relationship strength, and market routing without changing that boundary.
