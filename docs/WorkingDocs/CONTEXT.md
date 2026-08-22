# Industri Clicker Context

Canonical terminology and naming for Industri Clicker. Design decisions belong in [design.md](design.md), mechanics in [gameflow.md](gameflow.md), variable details in [VariableRelationshipMap.md](VariableRelationshipMap.md), and verified implementation status in [PROJECT_INFO.md](PROJECT_INFO.md).

## Core Terms

| Term | Meaning |
|---|---|
| Industrial clicker | The game genre and setting direction. |
| Resource | A typed item the player can gain, spend, transform, and hold in inventory. |
| Grain, Bread, Water, Electricity, Sugar, Fruit, Eggs, Meat, Milk, Wool, Cake, Premium Cake, Meat Pie, Coal, Iron, Copper, Gold, Minerals, Steel, Electric Circuits, Chemicals, Fertilizer, Plastic, Silicon, Advanced Components, Industrial Machines, Bricks, Cement, Reinforced Concrete, Construction Materials, Sand, Clay, Stone | Current resource names. |
| Inventory | Player-owned resource quantities, quality, and quantity-weighted historical source cost per unit. |
| Source cost | The historical euro cost per unit carried by inventory. Market purchases use their executed unit price; facility output carries the direct-material cost of inputs consumed for its completed recipe cycle. |
| Direct material cost | The source cost of recipe inputs consumed to make facility output. Maintenance and facility capital investment are excluded in the current model. |
| Contribution margin | Per-cycle output value at current market prices less historical direct input cost. It excludes facility overhead and is not operating profit. |
| Facility operating profit | Selected-period output market value less direct input cost and repair expense. It excludes capital investment, which appears separately in investment-adjusted result. |
| Investment-adjusted result | Facility operating profit less construction and upgrade investment made in the selected period. |
| Resource flow | A categorized, signed change to a player-owned resource: facility output/input, market trade, customer-order delivery, facility spending, or reward. |
| Inventory flow period | The shared Inventory reporting window: last 15 seconds, 1 minute, 15 minutes, 1 hour, or all company time. It uses foreground logical game time. |
| Facility maintenance statistics | Lifetime repaired-condition, largest-repair, and repair-value facts owned by Facilities. |
| Resource quality | A quantity-weighted property of an inventory entry and every market reservoir. All entries start at Q1. Selling uses the inventory quality as a direct price multiplier and mixes it into the receiving market reservoir; diffusion mixes source quality into its destination. Completed resource-quality research, facility quality upgrades, and that resource's lifetime facility output constrain the quality of subsequently completed facility outputs. |
| Resource-quality research | An unlimited, sequential research chain for one resource. It raises future facility output quality toward, but never reaching, Q100; production input quality can impose a lower output limit. |
| Facility quality upgrade | A per-facility quality parameter that raises that facility's output-quality limit through the same diminishing-return progression as resource-quality research. Each facility instance upgrades independently. |
| Logistics multiplier | A resource catalogue value for physical shipping, storage, and market-network constraints on adjacent-market diffusion. |
| Value-density multiplier | A resource catalogue value for the economic value of moving a resource relative to its transport burden. |
| Local market depth | A completed Local Market Network tier starts a finite foreground activation that adds each resource's original local supply and benchmark capacity in fixed increments. Several tier activations may run at once. |
| Local-regional diffusion rate | A completed-research multiplier applied only to the raw local-to-regional and regional-to-local diffusion request; it cannot override equilibrium or source-supply caps. |
| Market diffusion interval | The five-second foreground cadence at which adjacent market pools exchange resources. |
| Regional market | The device-local market reservoir between the player-facing local market and the global reservoir; its initial supply is the rate base for both adjacent-market diffusion pairs. |
| Autotrade interval | The per-resource foreground cadence for both enabled autobuy and autosell; it defaults to five seconds. |
| Market-flow diagnostics | Read-only price, balance-target, rate, and multiplier details for one resource's local/regional and regional/global diffusion, shown in IndustriPedia. |
| Recipe | A named production transformation with inputs, one or more outputs, and required work. |
| Production cycle | An ordered, repeatable per-facility sequence of researched recipes. It may contain the same recipe more than once. |
| Facility | A player-owned production unit. Several of the same type may be constructed; each is numbered by type, such as Mine #1 and Mine #2. Construction always consumes a land-payment in euros, Construction Materials for the site shell and infrastructure, and Industrial Machines for the operating equipment. Current types are Farm, Animal Farm, Bakery, Small Utility Works, Mine, Quarry, Industrial Processing Factory, Chemical Plant, Electronics Factory, Assembly Plant, Construction Factory, Water Well, and Power Plant. |
| Euro (€) | The company currency. |
| Finance | Company balance, classified append-only ledger, debt, credit history, and derived financial statements. |
| Finance transaction | A signed cash movement with an accounting kind, source, nested detail lines, and logical foreground-game timestamp. |
| Finance report period | A rolling foreground-time window: last 1 minute, 15 minutes, 1 hour, 10 hours, 24 hours, or all time. |
| Asset value | A derived euro value of cash, inventory at current local-market prices, facilities at historical capital cost less condition wear, or completed research. |
| Facility capital investment | The historical construction and upgrade value recorded in Finance when a facility consumes its land, Construction Materials, and Industrial Machines. |
| Facility maintenance expense | The historical value of repairs recorded in Finance for one facility. It is tracked separately from capital investment. |
| Facility market revaluation | The informational difference between a facility's historical-cost book value and its condition-adjusted replacement value at current local-market prices. It does not change company assets. |
| Finance payment cycle | One foreground minute used for loan repayment and financing comparisons. |
| 52-cycle loan cost | The fee-inclusive loan cost rate normalized over 52 finance payment cycles; it is a comparison metric, not an annual rate. |
| Loan offer / loan | A lender's deterministic financing proposal / an accepted loan with foreground-minute repayment attempts. |
| Credit rating | A derived score and grade based on asset strength, liquidity, company age, and loan-payment history. |
| Lender availability | A per-lender eligibility and borrowing-cap calculation derived from the company's assets, credit score, outstanding debt, lender market exposure, and lender contract cap. |
| Lender search | A paid, foreground-time finance activity. Its fee and work requirement scale with offer count and how tightly lender type, amount, and term are constrained; matching offers appear only when the work completes. |
| Economy phase | The persistent crash, recession, stable, expansion, or boom state. It changes deterministically every 10 foreground minutes with a bias toward stable. It adjusts new customer-order frequency, new customer bid premiums, and future loan interest offers. |
| Customer order | A customer-specific, atomic bundle of one or more inventory-ready resource lines, with locked global reference prices, bids, premiums, market-pressure volume multipliers, lot-sized quantities, expiry, and full-fulfilment requirement. The domain target value scales with company prestige and receives a modest relationship volume bonus; live global shortage or oversupply can then adjust a line's requested lots within a bounded range, but its reward cannot exceed the derived company-value cap. An order is not a future contract. |
| Customer catalogue | A deterministic local stand-in for the future shared customer registry. Each domain generates a variable number of buyers until its market share reaches 100%, using a skewed, domain-scaled market-share draw. Definitions include a home domain, customer type, generated operating domains, market share, purchasing power, and bid profile. Company-specific relationship and order history remain in the company snapshot. |
| Customer type | A buyer-behaviour profile separate from a home domain. Local Businesses, Retail Chain, Construction Contractor, Industrial Enterprise, Utility Operator, and Government Procurement control frequency, target-value tendency, global premium tendency, bundle appetite, market-share tendency, and allowed operating domains. |
| Customer relationship | A normalized 0–1 company-specific score, displayed to players as 0–100. Its Reputation baseline comes from prestige recognition minus a larger-account adjustment for customer market share. The remaining difference is retained order history: fulfilments add to it; rejections and expiries remove from it; foreground-time decay pulls it back toward Reputation. |
| Speed upgrade / Output upgrade | Facility levels that respectively improve work speed or recipe output and consume euros, Construction Materials, and Industrial Machines. |
| Assigned workers / Required workers | The local worker count and calculated staffing target for a facility. |
| Facility condition | A persisted 0–1 measure of a constructed facility's wear state. It begins at 1 and decreases during foreground time and completed production cycles. |
| Repair threshold / repair target | The condition percentages used by a facility's optional auto-repair rule: when condition falls to or below the threshold, it repairs up to the target. |
| Repair Technician research | A five-tier research chain that unlocks threshold-based auto-repair and raises the number of facilities allowed to use it. |
| Recipe condition-wear multiplier | A static per-recipe balance value that scales production wear without following live market prices. |
| Facility efficiency | The production-speed multiplier formed from staffing efficiency and facility condition. |
| Company prestige | A company-standing value derived from prestige events. It improves customer discovery, bid quality, relationship baselines, and customer-order target value. |
| Local player profile | A device-local, non-authenticated profile that groups one or more companies. |
| Active company | The selected company whose snapshot is restored into runtime state and may advance foreground game time. |
| Device session | The persisted local selection of a player profile and active company; logging out clears this selection only. |
| Starting condition | The named setup definition used when a company is created. `standard` is the only approved condition in v1. |
| Prestige event | A company-level prestige source that may decay with active foreground time. |
| Achievement | A durable company milestone defined in code and unlocked once when its typed condition is met. |
| Achievement unlock | The persisted achievement ID and logical foreground time at which its condition was first met. |
| Lifetime facility output | The all-time `facility-output` totals in Resource Flow, recorded only when a recipe completes output. Achievements and sales targeting consume these totals. |
| Progression gate | A pure all-of requirement check over achievements, current prestige, completed research, and a starting condition. |
| Research project | A code-defined, one-time company project with an up-front cost, foreground duration, requirements, and completion effect. Recipe research durations are three times their base duration. |
| Active research | The one paid research project currently accumulating foreground milliseconds for its company, with its effective duration retained when it starts. |
| Sales capacity | The derived maximum number of open customer orders. It starts at two and is raised by completed Sales Capacity research. |
| Order scope | Research-controlled maximum reward for one new customer order, expressed as a share of current company assets. It starts at 50%, has a €100 practical floor, and rises through completed Order Scope research. |
| Sales targeting | Research that first favors, then exclusively selects, resources with recorded company production when creating customer offers. |
| Bid value | Research that increases the premium paid by customer orders; it does not change ordinary market-sale prices. |
| Progression grant | A durable, one-use entitlement that can make one specific player action free or faster. The first-facility recipe grant makes that facility's first recipe research free and ten times faster. |

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
