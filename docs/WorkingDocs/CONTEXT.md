# Industri Clicker Context

Canonical shared names only. Product direction is in [design.md](design.md), rules and lifecycle in [gameflow.md](gameflow.md), relationships in [VariableRelationshipMap.md](VariableRelationshipMap.md), and verified repository facts in [PROJECT_INFO.md](PROJECT_INFO.md).

## Core Terms

| Term | Meaning |
|---|---|
| Industrial clicker | The game's genre and setting. |
| Resource | A typed item that can be gained, spent, transformed, and stored. Current names: Grain, Bread, Water, Electricity, Sugar, Fruit, Eggs, Meat, Milk, Wool, Cake, Premium Cake, Meat Pie, Coal, Iron, Copper, Gold, Minerals, Steel, Electric Circuits, Chemicals, Fertilizer, Plastic, Silicon, Advanced Components, Industrial Machines, Bricks, Cement, Reinforced Concrete, Construction Materials, Sand, Clay, and Stone. |
| Resource catalogue | Code-owned resource identity, display name, benchmark, supply, logistics, value-density, and market metadata. Exact values live in `game/resources/resourceConstants.ts`. |
| Inventory | Company-owned resource quantity, quality, and quantity-weighted source cost. |
| Resource flow | Categorized signed resource change: production, input, market, customer order, facility spending, or reward. |
| Inventory flow period | Foreground-time reporting window for Resource Flow: 15 seconds, 1 minute, 15 minutes, 1 hour, or all time. |
| Source cost | Historical euro cost per inventory unit: executed market price for purchases; facility output uses consumed input cost plus the projected production-wear repair burden. |
| Direct material cost | Source cost of inputs consumed by one recipe cycle; it excludes maintenance, wages, and capital investment. |
| Production maintenance allocation | Projected cash, Construction Materials, and Industrial Machines repair burden caused by one completed production cycle's wear. Passive or idle wear remains facility maintenance and is not assigned to output. |
| Contribution margin | Current output value minus direct material cost; it is not facility operating profit. |
| Facility operating profit | Selected-period output value minus output source cost, staff wages, and staffing/training expense; actual repair settlements remain visible as maintenance expense, while production-caused wear is already in output source cost. |
| Resource quality | Quantity-weighted Q value on inventory and market reservoirs. It affects sale value and is one input to future facility-output quality. |
| Quality research / quality upgrade | Resource-level research / facility-instance upgrade that raises an output-quality ceiling. |
| Recipe | Named production transformation with inputs, outputs, and required work. Exact relationships are in `VariableRelationshipMap.md`. |
| Production cycle | An ordered, repeating list of researched recipes owned by one facility instance. |
| Facility | Numbered player-owned production unit. Current types: Farm, Animal Farm, Bakery, Small Utility Works, Mine, Quarry, Industrial Processing Factory, Chemical Plant, Electronics Factory, Assembly Plant, Construction Factory, Water Well, and Power Plant. |
| Facility condition | Persisted 0–1 wear state affecting facility efficiency. |
| Assigned workers / required workers | Facility staff count / calculated staffing target; each assigned worker receives the configured staff wage. Workers in training are temporarily unavailable for production and experience. |
| Staff Quality | Facility knowledge level shared by the assigned staff group; training raises it, wage payment drives it over time, and firing removes the fired workers' proportional pooled knowledge share. |
| Facility maintenance statistics | Lifetime repaired condition, largest repair, and repair-value facts owned by Facilities. |
| Repair threshold / target | Auto-repair trigger and selected post-repair condition. |
| Speed / output / condition / quality upgrade | Independent facility upgrade tracks; construction resources are Construction Materials and Industrial Machines. |
| Euro | Company currency. |
| Finance | Company balance, classified ledger, debt, credit, and derived statements. |
| Finance transaction | Signed cash movement with source, accounting kind, detail lines, and foreground logical timestamp. |
| Facility capital investment | Historical construction and upgrade value recorded by Finance. |
| Facility maintenance expense | Historical repair value recorded separately from capital investment. |
| Facility staff wage | Player-set euro wage per assigned worker per foreground minute; paid foreground charges are Finance operating expenses. If wages cannot be paid, production, training, and wage-driven experience/quality progression pause. |
| Facility market revaluation | Informational difference between historical-cost book value and condition-adjusted replacement value at current local prices. |
| Asset value | Derived value of cash, inventory, facilities, or completed research. |
| Finance payment cycle | One foreground game minute used for loan repayment. |
| 52-cycle loan cost | Fee-inclusive loan comparison metric normalized across 52 finance cycles; not an annual rate. |
| Loan offer / loan | Deterministic lender proposal / accepted debt with foreground repayment attempts. |
| Credit rating | Derived score and grade from assets, liquidity, company age, and payment history. |
| Lender search | Paid foreground finance activity that produces offers when its work completes. |
| Economy phase | Persistent crash, recession, stable, expansion, or boom state affecting future offers and acquisition. |
| Local / regional / global market | Player-facing local reservoir and device-local regional/global reservoirs. |
| Local market depth | Research-driven finite foreground activations that add each resource's original local supply and matching benchmark capacity in fixed increments; activations may overlap. |
| Diffusion rate / interval | Research multiplier for local↔regional raw requests / five-second adjacent-market cadence; regional initial supply is the rate base and equilibrium/source caps still apply. |
| Autotrade interval | Per-resource foreground cadence for autobuy and autosell; default five seconds. |
| Customer order | Atomic customer-specific bundle of offerable resource lines with locked prices, bids, quantities, reward, expiry, and full-fulfilment requirement. It is not a future contract. |
| Customer catalogue | Deterministic local buyer definitions; company relationships and order history are saved separately. |
| Customer type / relationship | Buyer behaviour profile / company-specific trust score. |
| Company prestige | Company-standing value affecting discovery, bids, relationships, and order scale; it does not alter ordinary market prices or production. |
| Research project | One-time company project with cost, foreground duration, gates, and one completion effect. Multiple projects may run within research capacity. |
| Active research | A paid project currently accumulating foreground time; each retains its effective duration until completion/cancellation. |
| Sales capacity / order scope | Maximum open customer orders / maximum new-order value as a share of company assets. |
| Progression gate / grant | Pure all-of eligibility check / one-use action entitlement. |
| Achievement / prestige event | Durable company milestone / timestamped prestige source. |

## Identity, State, and UI Terms

| Term | Meaning |
|---|---|
| Local player profile | Device-local, non-authenticated grouping for companies. |
| Active company | Selected company whose snapshot is loaded and whose foreground time may advance. |
| Device session | Persisted selected profile/company; logout clears the selection only. |
| Runtime state | Current in-memory Zustand state. |
| Snapshot / save boundary | Current-version durable company representation / intentional persistence point. |
| Elapsed-time catch-up | Progress applied while inactive; currently deferred. |
| Primary action / view model | Most important touch action / UI-ready derived data that owns no rules. |
