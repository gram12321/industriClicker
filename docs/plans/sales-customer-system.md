# Sales customer system direction

Yes—make this a proper **customer-and-orders** system, and reserve **contracts** for a later separate feature.

The former generic order board has been replaced by customer-specific orders. The retained foundations are price locking at offer time and fulfilled goods entering the global market. [salesOrders.ts](C:/GitHub/industriClicker-initial-app-shell/game/sales/salesOrders.ts:1) [gameStore.ts](C:/GitHub/industriClicker-initial-app-shell/game/core/stores/gameStore.ts:695)

## Recommended model

Derive a deterministic local `CustomerDirectory` from a world seed and catalogue version. Persist only the company-specific customer state in the game snapshot, so the directory can later be replaced by a shared registry without changing company ownership.

Each customer has:

- Name, customer type/domain, market share, and individually rolled purchasing power
- A durable relationship score and last interaction time
- Order history and active/inactive status
- No country field

Use provisional resource-domain customer types:

- Food
- Raw materials
- Industrial inputs
- Construction materials
- Electronics
- Utilities

Utilities are a customer domain rather than market-only. Each resource catalogue entry can later own a `salesDomain` and a `standardOrderLot`, so extending the production tree means adding data rather than new sales logic.

Market share should sum to 100% **within each domain**, not globally. Generate a variable number of customers per domain with the Winemaker-style skewed draw, additional-draw/minimum selection, domain share multiplier, and final residual adjustment rather than fixed shares or a fixed count. A large construction buyer therefore represents a larger part of construction demand, without competing with food buyers. Large-share customers are selected more often and buy more, but negotiate harder and are slower to build a relationship with.

Do not import Winemaker’s country, wine tradition, taste/quality preferences, asking price, or contract rules.

## Orders and bids

Rename the current “contract” board to **Sales Orders**. An order should store:

```text
customerId · resource · quantity · globalReferencePriceAtOffer
bidUnitPrice · premiumPercent · totalValue
offeredAtGameTime · expiresAtGameTime · status
```

There is no asking price. The market sets the reference; the customer submits a locked bid:

```text
bid = global reference price
    × customer-type bid range
    × customer purchasing power
    × market-share price effect
    × relationship effect
    × prestige recognition effect
    × economy-price effect
```

`premiumPercent = bid / globalReferencePriceAtOffer - 1`.

Quantity should use a resource’s standard delivery lot rather than a universal `1–10` range:

```text
quantity = standard resource lot
         × customer-type quantity range
         × market share
         × purchasing power
         × relationship
         × economy demand
```

`standardOrderLot` supplies quantity granularity, but customer types should also own a target order-value range so low-priced Water and Electricity orders remain meaningful as prices move:

```text
quantity = roundUp(targetOrderValue / bidUnitPrice, resource.standardOrderLot)
```

Clamp that result to each resource/domain's minimum and maximum lots. Utilities should use high-volume, lower-premium, more frequent orders, with smaller prestige and relationship gains per euro than specialised Electronics or Construction orders. This makes them dependable throughput rather than the dominant prestige strategy.

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

Then select an eligible customer/resource pair with a weight such as:

```text
domain fit × stock coverage × market-share weight
× relationship affinity × production-history targeting
```

Inventory should be a real input, not merely a fulfilment check: only resources with stock should be eligible initially, with well-stocked resources preferred. Orders may still request more than inventory, creating a production decision, but v1 should retain Industri’s clean full-fulfilment rule rather than copy Winemaker’s partial fulfilment.

Open orders should both occupy capacity and suppress acquisition. At capacity, new-order chance is zero; below capacity, use a smooth penalty rather than Winemaker’s blunt per-order multiplier. Existing Sales Capacity research then naturally improves the system.

## Relationship and prestige

Keep individual relationship separate from company prestige, rather than defining relationship entirely from prestige as Winemaker does.

| Event | Customer relationship | Company prestige |
|---|---|---|
| Full, timely fulfilment | Gain; larger for valuable/reliable deliveries | Decaying sales-order event |
| Positive-premium sale | Small additional gain | Small quality bonus |
| Rejected order | No penalty | No penalty |
| Expired order | Meaningful loss | Small temporary loss only for repeated failures |
| Time without interaction | Decays toward a prestige-based familiarity floor | Normal decay continues |

The familiarity floor connects prestige to every customer without erasing individual history:

```text
relationship over time → prestige-and-market-share-derived baseline
```

High prestige makes unknown customers more willing to appear and sets a better relationship floor. Fulfilling orders builds trust above that floor. Trust then improves bid price, order size, selection likelihood, and order deadline. This gives prestige a meaningful sales role without an uncontrolled “sales → prestige → unlimited sales” loop; use normalized, capped curves throughout.

The existing decaying fulfilled-sales prestige event is the correct seam to evolve into `sales_order`. [prestige.ts](C:/GitHub/industriClicker-initial-app-shell/game/prestige/prestige.ts:119) [prestigeCalculator.ts](C:/GitHub/industriClicker-initial-app-shell/game/prestige/prestigeCalculator.ts:47)

## Mobile UX and IndustriPedia

The Sales screen should keep its current portrait-card approach, but become:

- “Customer acquisition” card: final chance plus expandable breakdown—prestige, stock readiness, pending orders, economy.
- Open-order cards: customer, domain chip, relationship, requested/in-stock, bid, premium, total value, expiry, fulfil/reject.
- History: fulfilled, rejected, expired, and relationship changes.
- IndustriPedia: domain summaries, customer-type rules, then a searchable/filterable customer directory. Avoid Winemaker’s desktop-wide tables; use cards and compact rows.

## Code boundaries

This belongs in a new order-focused sales domain: customer generation, relationship formulas, order generation, and snapshots in `game/sales`; resource tags in the resource catalogue; prestige events in `game/prestige`; orchestration only in the Zustand store; cards and pedia views in `ui`.

The order/customer snapshot deliberately replaced the former generic sales snapshot. Per the project policy, invalidating old local saves is preferable to compatibility code.

The key product decision I recommend locking first is the five initial domains and their resource membership. After that, the smallest useful implementation slice is: persistent customer directory → one domain-aware bid order → relationship on fulfilment/expiry → prestige/economy modifiers.

## Future shared customer system

Yes—but I would revise the earlier detail: persist **company-specific customer state and orders** in `GameSnapshot`, but do not make the full customer directory authoritative there.

A future shared customer system needs a clean ownership split:

```text
Customer definition / market share / purchasing power
    → world-owned, eventually server-authoritative

Relationship / discovery / order history / pending orders
    → company-owned, persists in that company’s GameSnapshot
```

For now, generate the directory deterministically from a stable `worldSeed` and `customerCatalogueVersion` in code. That gives every local company the same initial named customers, domain types, market shares, and purchasing-power rolls—effectively a local simulation of a shared world—without adding a backend or even a new SQLite table.

The snapshot would store only:

```text
customerCatalogueVersion
companyCustomerStates[customerId] = {
  relationship,
  lastInteractionAtGameTime,
  discovery / history counters
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
