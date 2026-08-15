# Sales customer system direction

**Implementation status:** Complete for the current local-first scope. The descriptions below reflect the implemented system and explicitly identify future shared/server ownership as deferred.

Yes—make this a proper **customer-and-orders** system, and reserve **contracts** for a later separate feature.

The former generic order board has been replaced by customer-specific orders. The retained foundations are price locking at offer time and fulfilled goods entering the global market. [salesOrders.ts](C:/GitHub/industriClicker-initial-app-shell/game/sales/salesOrders.ts:1) [gameStore.ts](C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:695)

## Recommended model

Derive a deterministic local `CustomerDirectory` from a world seed and catalogue version. Persist only the company-specific customer state in the game snapshot, so the directory can later be replaced by a shared registry without changing company ownership.

Each customer has:

- Name, customer type/domain, market share, and individually rolled purchasing power
- A durable relationship score and last relationship-update time
- Order-history counters. A customer is "known" when company-owned relationship/history state exists; there is no separate active/inactive flag.
- No country field

Use these six resource sales domains:

- Food
- Raw materials
- Industrial inputs
- Construction materials
- Electronics
- Utilities

Utilities are a customer domain rather than market-only. The sales domain owns each resource's `domain` and `standardOrderLot` profile, so extending the production tree means adding sales configuration rather than new order-generation logic.

Market share should sum to 100% **within each domain**, not globally. Generate a variable number of customers per domain with the Winemaker-style skewed draw, additional-draw/minimum selection, domain share multiplier, and final residual adjustment rather than fixed shares or a fixed count. A large construction buyer therefore represents a larger part of construction demand, without competing with food buyers. Large-share customers are selected more often and buy more, but negotiate harder and are slower to build a relationship with.

Do not import Winemaker’s country, wine tradition, taste/quality preferences, asking price, or contract rules.

## Orders and bids

Rename the current “contract” board to **Sales Orders**. An order should store:

```text
customerId · resource · quantity · globalReferencePriceAtOffer
bidUnitPrice · premiumPercent · totalValue
offeredAtGameTime · expiresAtGameTime · status
```

There is no asking price. The market sets the reference; the customer submits a locked bid. The implemented premium combines the customer-type baseline, a bounded positive tail, relationship and prestige bonuses, the customer's purchasing-power and bid profiles, the economy multiplier, rare pressure offers, and Bid Value research:

```text
bid = global reference price
    × (1 + bounded customer premium)
    × Bid Value research multiplier
```

`premiumPercent = bid / globalReferencePriceAtOffer - 1`.

Quantity uses a resource’s standard delivery lot rather than a universal `1–10` range. `standardOrderLot` supplies quantity granularity, while domain and customer-type profiles own target order-value ranges so low-priced Water and Electricity orders remain meaningful as prices move:

```text
quantity = roundUp(targetOrderValue / bidUnitPrice, resource.standardOrderLot)
```

Clamp that result to the global order bounds and the company-value cap. Utilities use high-volume, lower-premium, more frequent orders, with smaller relationship gains per euro than specialised Electronics or Construction orders. This makes them dependable throughput rather than the dominant relationship strategy.

Use global price as the bid comparison, because it is also the price context already used for the sale and global-market deposit. Keep the bid and premium locked even if market prices move later.

## Customer acquisition

A new customer/order roll should be driven by the factors you identified:

```text
final chance =
  base sales chance
  × prestige discovery
  × inventory readiness
  × open-order penalty
  × economy frequency
```

Then select an eligible customer/resource pair with this bounded weighting model:

```text
domain frequency × bounded stock coverage × market-share weight
× customer-type frequency × relationship affinity × production-history targeting
```

Inventory is a real input, not merely a fulfilment check: only resources with at least one meaningful standard lot are eligible, and stock coverage weights selection through `sqrt(min(64, inventory / standardOrderLot))`. Orders may still request more than inventory, creating a production decision, but v1 retains Industri’s clean full-fulfilment rule rather than copy Winemaker’s partial fulfilment.

Open orders should both occupy capacity and suppress acquisition. At capacity, new-order chance is zero; below capacity, use a smooth penalty rather than Winemaker’s blunt per-order multiplier. Existing Sales Capacity research then naturally improves the system.

## Relationship and prestige

Keep individual relationship separate from company prestige, rather than defining relationship entirely from prestige as Winemaker does.

| Event | Customer relationship | Company prestige |
|---|---|---|
| Full, timely fulfilment | Gain; larger for valuable/reliable deliveries | Decaying sales-order event |
| Positive-premium sale | No separate modifier; fulfilment value already drives relationship gain | Positive premium modestly increases the fulfilled-order prestige event |
| Rejected order | Minor relationship loss scaled by trust and order value | No prestige penalty |
| Expired order | Relationship loss larger than rejection at high trust/value | No direct prestige penalty |
| Time without interaction | Decays toward the prestige-and-market-share-derived baseline | Normal decay continues |

The familiarity baseline connects prestige to every customer without erasing individual history:

```text
relationship over time → prestige-and-market-share-derived baseline
```

High prestige makes unknown customers more willing to appear and sets a better relationship baseline. Fulfilling orders builds trust above that baseline. Trust then improves bid price, target order value, bundle maturity, and customer/resource-pair selection likelihood. Order deadlines remain fixed rather than relationship-scaled. This gives prestige a meaningful sales role without an uncontrolled “sales → prestige → unlimited sales” loop; use normalized, capped curves throughout.

The existing decaying fulfilled-sales prestige event is the correct seam to evolve into `sales_order`. [prestige.ts](C:/GitHub/industriClicker-initial-app-shell/game/prestige/prestige.ts:119) [prestigeCalculator.ts](C:/GitHub/industriClicker-initial-app-shell/game/prestige/prestigeCalculator.ts:47)

## Mobile UX and IndustriPedia

The Sales screen should keep its current portrait-card approach, but become:

- “Customer acquisition” card: final chance plus a compact breakdown—prestige, stock readiness, pending orders, economy.
- Open-order cards: customer, domain chip, relationship, requested/in-stock, bid, premium, total value, expiry, fulfil/reject.
- History: fulfilled, rejected, and expired orders with current relationship context.
- IndustriPedia: domain summaries, customer-type rules, then a filterable and sortable customer directory. Avoid Winemaker’s desktop-wide tables; use cards and compact rows.

## Code boundaries

This belongs in the order-focused sales domain: customer generation, relationship formulas, order generation, snapshots, sales-domain membership, and standard order lots in `game/sales`; prestige events in `game/prestige`; orchestration only in the Zustand store; cards and pedia views in `ui`. Sales-domain membership and commercial lot sizing remain sales-owned configuration rather than expanding the core resource catalogue with consumer-specific rules.

The order/customer snapshot deliberately replaced the former generic sales snapshot. Per the project policy, invalidating old local saves is preferable to compatibility code.

The locked product decision uses six initial domains and their resource membership: Food, Raw Materials, Industrial Inputs, Construction Materials, Electronics, and Utilities.

## Future shared customer system

Yes—but I would revise the earlier detail: persist **company-specific customer state and orders** in `GameSnapshot`, but do not make the full customer directory authoritative there.

A future shared customer system needs a clean ownership split:

```text
Customer definition / market share / purchasing power
    → world-owned, eventually server-authoritative

Relationship / known-customer history / pending orders
    → company-owned, persists in that company’s GameSnapshot
```

For now, generate the directory deterministically from a stable `worldSeed` and `customerCatalogueVersion` in code. That gives every local company the same initial named customers, domain types, market shares, and purchasing-power rolls—effectively a local simulation of a shared world—without adding a backend or even a new SQLite table.

The snapshot would store only:

```text
customerCatalogueVersion
companyCustomerStates[customerId] = {
  relationship,
  lastRelationshipUpdatedAtGameTime,
  fulfilment / expiry counters
}
salesOrders[]
```

The directory itself is derived:

```text
getCustomerCatalogue(worldSeed, customerCatalogueVersion)
```

That is better than copying `Customer[]` into every company save. It avoids turning a world-like catalogue into company-owned data, while still allowing each company to have its own relationship with the same customer.

When shared persistence arrives, the change is contained:

```text
Now:    deterministic local catalogue generator
Later:  server-backed global customer registry

Unchanged: company relationship state, order logic, bids, UI models
```

A global customer record should own stable identity, name, domain, market share, base purchasing power, and later global demand capacity. It should not own player relationship: Industri Company A and Industri Company B should be able to have completely different trust with the same construction buyer.

The same distinction applies to orders:

- A pending order is company-owned now.
- In a real shared system, the server would issue it with a global ID and reservation/expiry, then validate fulfilment to prevent two players receiving the same demand.
- Keep the order’s customer ID and price terms locked at creation, so this future change does not alter the sales rules.

For the market, the current “global” reservoir is still company-local state. That is correct under today’s local-first scope, but it cannot simply be synced later: a shared market must be server-authoritative for prices, supply, trades, and anti-cheat. We should prepare through stable resource IDs and pure market/order calculations, not add backend infrastructure prematurely.

So the updated recommendation is:

- Use a fixed world seed and versioned deterministic customer catalogue now.
- Store only company customer relationships and orders in the company snapshot.
- Keep customer generation, relationship, bid, and order logic pure and data-driven.
- Do not add Supabase, cloud sync, or a global database yet.
- When the catalogue needs non-deterministic or globally evolving customers, introduce a separate world-level customer registry—not a replacement for company saves.

This gives you the right temporary implementation without baking in the wrong ownership model.

## Approved customer-type, bundle, and premium extension

Customer **domain** replaces Winemaker's country and remains the customer catalogue's market-share partition. Customer **type** is a separate buying-behaviour profile; it must not be a progression chain where each successive type simply unlocks more domains.

Every deterministic customer definition has a home domain, one of these six types, and one or more generated operating domains:

- Private Customer: present in every domain but uncommon in Raw Materials and Industrial Inputs; strongly prefers a small, single-domain, usually single-resource purchase.
- Retail Chain: concentrated in Food and Electronics and possible in Construction Materials; most are single-domain specialists, while a minority are general retailers spanning two generated retail domains.
- Construction Contractor: concentrated in Construction Materials, Raw Materials, and Industrial Inputs; construction-led procurement may also operate in Industrial Inputs or Utilities.
- Industrial Enterprise: concentrated in Raw Materials, Industrial Inputs, Electronics, Utilities, and sometimes Construction Materials; it may operate across several compatible industrial domains, but excludes Food by default.
- Utility Operator: Utilities and Industrial Inputs only; it may buy from either or both but not Food, Raw Materials, or Construction Materials.
- Government Procurement: rare in every domain; it may receive any compatible operating-domain combination and is the only type intended to span otherwise unrelated domains freely. Individual offers are called Government Orders.

Customer-type profiles own frequency, target-value tendency, global-bid tendency, bundle appetite, and cross-domain policy. Domain profiles own domain economy and customer-type generation weights; sales resource profiles own resource membership and standard lots. A customer's generated operating domains are the maximum scope of its future orders.

Orders remain immediate sales opportunities: every selected order line must have a meaningful lot available in company inventory when the offer is generated. Bundles are atomic: all locked lines are fulfilled together, paid together, deposited into the global reservoir together, and otherwise expire as one order.

Bundle count has no arbitrary fixed line limit. It is bounded only by currently inventory-eligible resources in the customer's operating domains. A deterministic skewed maturity calculation combines normalized prestige, 0-100 relationship, market share, and type appetite. It determines a soft breadth; a strongly lower-skewed draw means one line is usual, broad bundles are rare, and the full compatible resource range is only an extreme late-game possibility. Cross-domain resources enter through the customer's operating-domain policy, not by a universal line-count unlock.

Prestige is normalized with control points that match the current prestige economy rather than hard 150/450 gates: 0, 1, 5, 20, 60, 150, and 300+ prestige map to progressively stronger bundle maturity. Relationship is stored and calculated as a normalized 0–1 value, then displayed to players as 0–100.

Global-market premium is deliberately sampled, not allowed to become negative accidentally through multiplying independent discounts. Customer/type baseline plus a bounded exponential-style positive tail makes modest positive global premiums common and unusually high premiums possible but rare. A separate, small pressure-offer probability allows below-global bids; it is capped and remains exceptional. The local-market comparison stays independent, so an offer can be positive against global while below a player-inflated local price.
