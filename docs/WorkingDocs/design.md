# Industri Clicker Design

This document owns durable player-facing direction. Exact rules are in [gameflow.md](gameflow.md); names are in [CONTEXT.md](CONTEXT.md).

## Game Direction

Industri Clicker is a single-player, mobile-first industrial clicker for native Android. It should make the next useful action clear on a portrait phone, show frequent readable feedback, and make longer-term progression visible without dense desktop-style UI. Play is local-first, responsive, and needs no account.

## Intended Core Loop

1. The player takes an available action or selects production.
2. The game applies a clear cost, gain, or production change.
3. Feedback shows the updated state.
4. Progress creates a new choice, upgrade, unlock, or more efficient path.

## Current Decisions

- The first content foundation uses the resources and facilities named in [CONTEXT.md](CONTEXT.md). Quality has no player-visible effect yet.
- Facilities require a euro land purchase, Construction Materials for the site shell and infrastructure, and Industrial Machines for production equipment. Farms are land-heavy, while mines and quarries use relatively less land and more operating equipment. A player may sell a facility for 70% of its condition-adjusted book value.
- The construction confirmation can buy exactly the missing Construction Materials and Industrial Machines from the local market, but reserves enough funds to complete the land purchase.
- Sales contracts let players exchange available inventory for money. They remain available until fulfilled or rejected, and their retained history remains visible.
- Company prestige is informational only in this version.
- Finance is a primary mobile-first reporting area with rolling foreground-time filters (1 minute, 15 minutes, 1 hour, 10 hours, 24 hours, and all time), rather than an invented game calendar. It provides an income statement, balance-sheet summary, assets, liabilities and equity, grouped cash flow with expandable details, and funding.
- Assets are derived, never separately saved: inventory uses current local-market prices; facility replacement value includes land, construction-material value, upgrades, and present facility condition; completed research is capitalized at its configured cost. Branding is not capitalized in this first version, avoiding a circular value based on prestige or cash.
- Loans are local deterministic offers from a saved portfolio of generated banks, investment funds, private lenders, and quickloan lenders. Every lender has independent risk tolerance, flexibility, rate, amount/term range, origination fees, market capitalization, exposure limit, and policy caps. Funding provides a paid, foreground-time criteria-based lender search as a normal mobile Finance screen, not a blocking acknowledgement modal. Players set loan amount and term with portrait-friendly dual-range controls, then receive one to ten quotes; accepting one consumes only that quote and immediately rechecks the remaining quotes against the new borrowing limit. Loan cards show a fee-inclusive 52-cycle loan cost beside the cycle rate, payment, term, interest, and repayment totals; one finance payment cycle is one foreground minute. Cash-flow rows group matching accounting sources inside the selected time bucket, including all loan servicing costs under one nested group.
- Repayments are attempted each foreground minute. Active loans support an extra payment (with administration fee) or full repayment (with a prepayment penalty). Misses escalate at 1, 3, 6, and 10 payments: warning and late fee; rate/balance surcharge plus decaying prestige loss; forced inventory-then-facility liquidation; then default, lender blacklist, a larger prestige loss, and a punitive Collections Recovery restructure offer. Forced recovery is 55% of asset value and cannot exceed 50% of pre-collection assets. The credit breakdown shows asset health, payment history, company stability, and the negative-balance penalty. Economy phase starts stable, changes every 10 foreground minutes, and is biased to return toward stable while adjusting future interest offers.
- Research is a primary bottom-navigation view. It presents Capital Grants, Sales Capacity, Sales Targeting, Contract Value, and recipe chains. Each project clearly shows its cost, time, reward, and every unmet condition; an active project prominently shows progress and the full-refund cancellation rule.
- The ten-tier Local Market Network research expands every local resource market from 1.2× through 8.0× its original depth. It preserves the immediate unit price and remains below the 10× local-to-regional market scale. The separate ten-tier Market Diffusion Network raises only local ↔ regional diffusion from 1.15× through 4.0× normal raw rate; the ordinary equilibrium and source-supply safeguards still apply.

- Progression gates make achievements and current prestige meaningful without hiding business rules in UI. Current prestige is checked when research starts; completed or active research is not revoked if prestige later decays.
- Achievements show company milestones across facilities, total and per-resource production, sales, finance, foreground time, and prestige. Their only v1 reward is a decaying prestige event; they do not change production, pricing, staffing, contracts, or finance rules. The achievement view provides overall completion, category filters, and global mastery labels while showing only the next incomplete tier in each series; a completed series shows its final earned tier.
- Recipe-unlock research and its recipe work-speed follow-ups take three times their previous foreground durations. Building the first facility grants its first recipe research for free and at ten times normal research speed; the one-use grant is consumed when started.
- Fertilizer is a shared agricultural input with two deterministic sources: the Chemical Plant synthesizes it from Chemicals and Minerals, while Animal Farms produce small quantities alongside their food and fibre outputs. Farms consume it to grow Grain, Sugar, and Fruit. Animal Farms raise cattle, sheep, or chickens for mixed Meat, Milk, Wool, Eggs, and Fertilizer outputs; Bakeries turn Grain, Eggs, Water, and Electricity into Cake, add Fruit and Milk for Premium Cake, and use Meat for Meat Pie.
- Speed and Output upgrades improve a facility independently. Each upgrade consumes euros plus scaled Construction Materials and Industrial Machines; missing inputs are bought automatically from the local market and included in the displayed cash requirement. Staffing is the first efficiency factor; broader workforce systems are deferred.
- Each facility can run an ordered, repeating production cycle of researched recipes, including repeated recipes. The facility controls reserve and buy inputs for the whole configured sequence.
- Recipe balance uses initial-market net margin per minute: basic production completes in seconds, while advanced recipes take longer but deliver stronger value per minute. Heavy facility upgrades can make basic recipes complete several cycles per second.
- Production progresses only while the app is foregrounded. The temporary one-minute fast-forward follows the same rule; offline progression is not yet approved.
- The local market is player-facing; regional and global markets are device-local reservoirs. Resources diffuse between local/regional and regional/global pairs. Sales contracts lock a global-price offer with a 20% premium and deposit fulfilled goods into the global reservoir.
- IndustriPedia includes a portrait-first Market Flow reference. It explains one selected resource's live local/regional/global prices, adjacent flow directions, next corrections, balance targets, factors, and safeguards through compact cards and collapsed details rather than desktop tooltips.
- A player can create device-local profiles and multiple independently saved companies. This is local selection, not an online account or authentication system.
- The first company setup offers the single `Standard start` condition. Additional starting conditions and any theme system require an approved design decision.

## Interaction Direction

- Design for portrait phones first with large touch targets, readable feedback, accessible labels, safe-area-aware layout, and non-color-only cues.
- Use code-defined React Native UI; no bespoke art pipeline is currently planned.
- Do not depend on hover, right-click, mouse precision, or web-only behavior.

## Deferred Scope

| Topic | Decision |
|---|---|
| Cloud backend | No cloud service until an approved need exists. |
| Offline catch-up | Needs an approved cap, clock policy, and resume feedback. |
| Monetization and broader progression | To be designed after the first playable loop. |
| Save compatibility | Older saves may be discarded unless a migration is explicitly approved. |
| Cloud accounts, sync, and global leaderboard | Deferred. Device-local profiles and a clearly labelled leaderboard placeholder do not provide online identity or rankings. |
