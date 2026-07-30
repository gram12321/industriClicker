# Local / Global Market System Research And Direction

Use Baseclicker's compact two-reservoir economy as the starting point, adapted to Industri Clicker's local-first Expo/Zustand/SQLite architecture. The global market is a deterministic device-local buffer, not a multiplayer service, and no backend or cloud state is introduced.

## Research result

| Source | Verdict | What to reuse |
|---|---|---|
| Baseclicker | Best first implementation for Industri's current seven-resource economy. | Per-resource local/global supply and quality, inverse-supply pricing, diffusion, buy/sell commands, autobuy/autosell settings, and local-save ownership. |
| Simulus | More advanced calibration and hierarchy system, but too broad for this stage. | The idea of deriving an initial price from an explicit benchmark; do not copy mutable resource objects, city demand, or hierarchy aggregation. |
| Tradergame04 | Most robust market implementation, but depends on Supabase and multiplayer state. | Cap diffusion by available source supply. Do not copy its cloud persistence, shared market table, or aggregate-resource bundles. |
| Tradergame01 | Player listing and consumer-demand market, not a local/global reservoir model. | Nothing in v1. |

Baseclicker treats its global pool as a second market reservoir. It is saved with the player's local save and has no players, listings, or network synchronization. That is the intended meaning of "global" in this plan.

## Goal and scope

Add a durable, supply-driven market that:

- gives every current resource a local and global market supply, market quality, and derived price;
- lets the player manually buy from and sell to the local market;
- diffuses resources between the local and global reservoirs once per completed foreground minute;
- prices sales contracts from the global market at offer time, with a fixed 20% premium;
- sends every fulfilled sales contract directly into the global market;
- provides manual buy/sell, `1 / 10 / 100 / All` trade amounts, autobuy, and autosell in a portrait-first Market tab;
- keeps future resource-trade gates explicit, while all current resources remain tradeable in v1;
- persists entirely in the existing single local `GameSnapshot` and does not add a backend.

Out of scope: multiplayer or shared online markets, external supply/demand simulation, market events, resource hierarchies/bundles, price charts, trading fees, price history, offline market progression, and a new quality-production system.

## Confirmed v1 economy

### Market catalogue and pricing

Market configuration belongs in `game/market/marketConstants.ts`, not UI code. The resource catalogue remains code-owned and is never stored in a save.

| Resource | Local initial supply | Global initial supply | Local initial price | Global initial price |
|---|---:|---:|---:|---:|
| Grain | 100,000 | 1,000,000 | EUR 0.10 | EUR 0.10 |
| Water | 100,000 | 1,000,000 | EUR 0.10 | EUR 0.10 |
| Sugar | 100,000 | 1,000,000 | EUR 0.10 | EUR 0.10 |
| Bread | 50,000 | 500,000 | EUR 0.20 | EUR 0.20 |
| Electricity | 50,000 | 500,000 | EUR 0.20 | EUR 0.20 |
| Coal | 5,000 | 50,000 | EUR 2.00 | EUR 2.00 |
| Cake | 5,000 | 50,000 | EUR 2.00 | EUR 2.00 |

Use Baseclicker's benchmark configuration: local benchmark supply is `10,000` and global benchmark supply is `100,000` for every current resource. Prices are derived rather than stored:

```text
localPrice  = localBenchmarkSupply  / max(localSupply, 1)  x localQuality
globalPrice = globalBenchmarkSupply / max(globalSupply, 1) x globalQuality
```

All initial inventory and market quality is `1`. Quality nevertheless affects market prices from the first version, exactly as in Baseclicker. The future system that can produce non-`1` quality is deliberately outside this implementation.

### Diffusion

Diffusion runs once per completed **foreground** minute. It never advances while the app is backgrounded and fast-forward uses the normal foreground rule path.

For each resource:

```text
priceRatio    = localPrice / globalPrice
diffusionBase = initialLocalSupply / 1,000

if localPrice > globalPrice:
  desiredTransfer = (priceRatio - 1) x diffusionBase
  transfer global -> local

if localPrice < globalPrice:
  desiredTransfer = (1 - priceRatio) x diffusionBase
  transfer local -> global
```

The actual transfer is always `min(desiredTransfer, sourceSupply)`. This uses Tradergame04's conservation fix rather than Baseclicker's behaviour that can overfill a destination after the source reaches zero. The source quality is weighted into the destination quality; losing supply does not change the source pool's remaining quality.

### Manual and automatic trading

- Manual Buy removes the selected amount from the local market, adds it to inventory at the local market quality, and records a negative finance transaction at the current local unit price.
- Manual Sell removes inventory at its inventory quality, adds it to the local market with weighted quality, and records a positive finance transaction at the current local unit price.
- A transaction locks the pre-transaction unit price for its full amount, matching Baseclicker's first market version. Integral/slippage pricing is deferred.
- The screen-wide selector is `1`, `10`, `100`, or `All`. `All` sells all held inventory, or buys the lesser of available local supply and the amount affordable at the current displayed unit price.
- Autobuy is evaluated only when a facility is about to start a recipe cycle and lacks an input. It may buy the missing input only when that resource's autobuy setting is enabled, the local supply is sufficient, and the current local unit price is at or below the player's saved maximum price.
- Autosell runs once per completed foreground minute, before diffusion. For every enabled resource it sells up to its saved per-minute maximum, while retaining the saved minimum inventory amount.
- Enabled autobuy defaults to a finite maximum unit price of twice the current local unit price; enabled autosell defaults to a maximum of 50 units per minute and a minimum keep of zero. Finite numbers are required because `Infinity` is not JSON-safe.

### Sales contracts and the global reservoir

- When an offer is created, lock `unitReward = globalPrice(resourceType) x 1.20` and `reward = quantity x unitReward` in the contract. Later market changes do not change its reward.
- When the player fulfils that contract, remove the requested inventory and add the same quantity and its inventory quality directly to the **global** market reservoir, using the normal weighted-quality rule. The finance and prestige flows remain otherwise unchanged.
- Rejected contracts do not change either market.
- A contract offer remains a customer offer, not a manual market sale: its displayed locked reward is the price promised by that customer.

### Future access gates

All current resources can be bought, sold, autobought, and autosold in v1. Market commands must still ask a code-owned `MarketTradeAccess` policy before changing state. It has separate buy, sell, autobuy, autosell, and sales-contract eligibility decisions so a future achievement, research, or facility requirement can gate a resource consistently in commands, automation, contract offers, and UI without reworking market accounting. No gate conditions or unlock content are added now.

## Recommended v1 architecture

```text
Resource catalogue + Market constants
  -> Market owns local/global pool state and automation preferences
  -> pure price, diffusion, trade, access, and contract-price helpers
  -> Zustand commands atomically update Market + Inventory + Finance + SalesContracts
  -> GameSnapshot / Expo SQLite save normally
  -> Market dashboard derives portrait-ready rows and feedback
```

### Source of truth

- `Market` is a new domain class that owns mutable local/global supply and quality plus per-resource autobuy/autosell configuration. It exposes cloning, snapshots, valid commands, and derived prices; it does not import Zustand, React Native, or SQLite.
- `marketConstants.ts` owns initial supply, benchmark supply, the sales premium, diffusion divisor/cadence, trade multipliers, and automation defaults.
- The resource catalogue remains a static definition. Mutable market supply is not added to `Resource`.
- `Inventory` continues to own player inventory quantity and quality. Market purchases use the existing weighted-quality addition rule added as part of this work; market and contract sales capture inventory quality before removal.
- `Finance` remains the append-only owner of money changes. Every accepted direct market trade uses a normal finance transaction with an unambiguous description.
- `SalesContracts` owns the locked offer reward. The market supplies the offer-time price; it does not mutate contracts later.
- `GameSnapshot` persists `MarketSnapshot` alongside the existing finance, inventory, facilities, sales contracts, achievements, production statistics, prestige, and time state.

### Foreground time order

Within the existing one-second simulation loop, production continues to advance as it does now. When one or more full foreground minutes complete, process each minute in deterministic order:

1. Create any eligible sales offer and lock its global-price-plus-premium reward at that moment.
2. Process enabled autosells against the local market.
3. Diffuse each resource between local and global pools, source-capped.
4. Evaluate the existing time-based achievement flow.

Autobuy is not a minute action: it occurs only at the facility recipe-start boundary before a missing input would stall a cycle. All player-triggered market changes, including sales-contract fulfilment, first advance realtime so they use current foreground market state.

## File map

| File | Change |
|---|---|
| `game/market/marketConstants.ts` | **New.** Code-owned initial supplies, benchmarks, premium, diffusion, multipliers, automation defaults, and future-neutral access configuration. |
| `game/market/marketTypes.ts` | **New.** Narrow market snapshots, pool entries, automation preferences, trade result/view types, and access-policy contracts. |
| `game/market/market.ts` | **New.** Pure `Market` domain class: price derivation, local/global transfers, quality mixing, manual trading validation, automation preference commands, cloning, and snapshot restore. |
| `game/market/marketAccess.ts` | **New.** Current all-allowed policy and a single command-facing boundary for future achievement/research/facility gates. |
| `game/market/index.ts` | **New.** Public market barrel surface, re-exported from `game/index.ts`. |
| `game/inventory/inventory.ts` | Add a quality-aware inventory addition operation so market purchases mix local market quality into player inventory without putting market rules in Inventory. |
| `game/sales/salesConstants.ts` | Remove the fixed EUR 1 contract unit-price assumption; market constants own the 20% premium. |
| `game/sales/salesContracts.ts` | Accept a supplied, finite offer-time unit reward; retain the resulting locked reward in each snapshot contract. |
| `game/facilities/facility.ts` / `game/facilities/advanceProduction.ts` | Let the production-start path request approved autobuys for missing inputs before declaring a cycle stalled, without putting pricing logic in facilities. |
| `game/core/stores/gameStore.ts` | Own `Market`, manual trade and automation-setting commands, atomic inventory/finance/market updates, offer-time price injection, direct-global contract fulfilment, minute cadence, realtime advance, snapshot/restore/reset integration, and achievement ordering. |
| `game/core/state/gameSnapshot.ts` | Add `market: MarketSnapshot`. |
| `game/core/persistence/gameSaveRepository.ts` | Validate the required market snapshot. Older local saves without it deliberately start fresh; add no migration. |
| `game/resources/resourceConstants.ts` | Keep the catalogue authoritative; expose only any resource metadata required by market presentation. |
| `ui/dashboard/views/MarketDashboard.tsx` | **New.** Portrait-first market rows, shared multiplier selector, Buy/Sell actions, availability feedback, local/global price/supply/quality, diffusion direction, and expandable auto-trade controls. |
| `ui/dashboard/DashboardView.tsx` | Add the Market dashboard tab and typed props. |
| `ui/dashboard/dashboard.styles.ts` | Add narrow, reusable market layout styles using the existing theme tokens. |
| `ui/index.ts` | Export the new market surface. |
| `app/index.tsx` | Add Market to bottom navigation, select market state/commands, and pass them through dashboard plumbing. |
| `ui/dashboard/views/InventoryDashboard.tsx` | Correct the current quantity display so inventory units are not labelled as euros; market prices belong only in the Market view. |
| `docs/WorkingDocs/CONTEXT.md` | Define local market, global market reservoir, market price, diffusion, autobuy, and autosell. |
| `docs/WorkingDocs/design.md` | Record the player-facing market and contract-premium direction; remove Market from deferred scope. |
| `docs/WorkingDocs/PROJECT_INFO.md` | Record the implemented local market and keep cloud state explicitly absent. |
| `docs/WorkingDocs/gameflow.md` | Record formulas, direct-global contract fulfilment, minute order, automation, and foreground-only diffusion. |
| `docs/WorkingDocs/VariableRelationshipMap.md` | Add market state ownership, commands, interactions, and snapshot mapping. |

## Implementation sequence

1. **Create the pure market domain and constants.**
   - Add market types, immutable catalogue balance values, current all-allowed access policy, and the `Market` class.
   - Implement supply-only-at-quality-one pricing, weighted quality mixing, source-capped diffusion, and narrow results that explain a rejected trade without UI dependencies.
   - Verify price at each initial supply, price response to supply changes, quality multiplier, each diffusion direction, exact equilibrium, source exhaustion, and snapshot cloning/restoration.

2. **Connect inventory, finance, and manual market commands atomically.**
   - Add quality-aware inventory addition and preserve quality when inventory is sold.
   - Add typed store Buy/Sell commands that first settle foreground time, enforce access and affordability/supply checks, then update cloned inventory, finance, and market state in one Zustand set.
   - Implement `All` exactly from current local supply/inventory and current affordable quantity. Lock one pre-trade unit price for each accepted transaction.
   - Verify rejected trades leave all state unchanged, buys receive local quality, sales mix inventory quality into local supply, and finance entries match the executed quantity and price.

3. **Add automation at the approved simulation boundaries.**
   - Persist finite per-resource autobuy/autosell settings inside `Market`.
   - At recipe start, allow approved autobuy attempts for missing inputs before a facility is reported stalled. Respect supply, balance, max unit price, and future access policy.
   - At each completed foreground minute, autosell enabled resources up to their maximum after retaining their minimum amount, then perform diffusion.
   - Verify autobuy cannot overspend, bypass a price cap, or consume unavailable market supply; verify autosell respects minimum keep, maximum sale, and minute cadence.

4. **Reprice sales contracts and route fulfilled goods globally.**
   - Change contract creation to receive the current global unit price from `Market`, apply the named 20% premium, and persist the resulting reward unchanged.
   - Fulfilment removes inventory, records the existing finance/prestige/sales effects, and adds matching quantity and captured quality to the global pool in the same atomic store transition.
   - Ensure rejected contracts remain market-neutral and future access eligibility is used when random offers are chosen.
   - Verify an offer keeps its quoted reward after global-price movement, fulfilment changes only global supply/quality, and contract reward/prestige behaviour otherwise remains intact.

5. **Persist and restore deliberately.**
   - Add market state to `GameSnapshot`, store create/restore/reset, and SQLite snapshot validation.
   - Keep the existing single save row and deliberate batching unchanged. Require market data in a valid save, so old snapshots are discarded under the existing no-migration policy.
   - Verify a market snapshot round-trip preserves both pools, quality, and automation settings; verify malformed market data cannot restore invalid values.

6. **Build the mobile Market tab.**
   - Add a bottom-navigation Market tab and a dedicated React Native Paper dashboard view; do not overload the existing Inventory tab.
   - Use a shared `1 / 10 / 100 / All` segmented control near the top. Each resource card shows inventory, local/global unit price, local/global supply, quality, and a non-colour-only diffusion label/arrow.
   - Give every card touch-friendly Buy and Sell buttons with disabled reasons. Put autobuy/autosell toggles and their finite numeric settings inside an expandable Paper control to avoid dense always-visible forms.
   - Show future gated resources as disabled with an explicit requirement description once a non-default access policy exists; all current resources appear available.
   - Verify a narrow Android layout, all multiplier states, failed buy/sell feedback, enabled automation controls, and readable large/decimal price formatting.

7. **Document and validate the approved system.**
   - Update the five working documents listed in the file map with the final implementation facts and formulas.
   - Run focused market-domain tests if a test harness already exists or is separately approved; do not add a test dependency solely for this feature without approval.
   - Run `npm run typecheck`, `git diff --check`, and a manual Expo Go/Android interaction pass for the Market tab. Do not start a server, commit, or push unless separately requested.

## Acceptance criteria

- Every current resource has deterministic local/global starting supplies, qualities, and supply-derived prices matching the approved table.
- Manual trades change only player inventory, local market, and finance; rejected trades are atomic no-ops.
- Diffusion is foreground-minute-only, conserves supply by capping transfers at the source, and mixes quality into the receiving reservoir.
- Autobuy prevents a recipe-input stall only when its finite price cap, funds, local supply, and access rule permit the purchase; autosell respects per-resource limits and min-keep values.
- Contracts lock their reward at offer time from the global price plus 20%, and fulfilment deposits the delivered resource into the global reservoir with its inventory quality.
- Market state and automation settings survive a valid local save/restore. Older saves without market state intentionally start fresh.
- The Market tab is usable on a portrait phone with clear Buy/Sell feedback, accessible labels, all four multipliers, and no hover-only controls.
- No cloud service, multiplayer behaviour, save migration, offline diffusion, resource hierarchy, market event, or quality-production system is introduced.

## Verification note

The project currently exposes `npm run typecheck` and no test runner. The market domain must remain pure and independently testable; adding Vitest or another test dependency requires separate approval.
