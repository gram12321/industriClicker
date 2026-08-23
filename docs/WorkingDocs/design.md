# Industri Clicker Design

Durable player-facing direction only. Shared names are in [CONTEXT.md](CONTEXT.md); rules and formulas are in [gameflow.md](gameflow.md); relationships are in [VariableRelationshipMap.md](VariableRelationshipMap.md).

## Direction and Loop

Industri Clicker is a single-player, local-first industrial clicker for native Android. Portrait-phone play should make the next useful action clear, show readable feedback, and expose longer-term choices without desktop-density or bespoke artwork.

1. Choose an available action or production path.
2. Pay visible costs and receive visible progress.
3. Use the result to unlock, upgrade, sell, research, or expand.

## Durable Decisions

- **Native/local-first:** no account, cloud dependency, or online identity in the first release; multiple companies are independently saved on the device.
- **Deterministic economy:** production, markets, finance, customer orders, progression, and foreground time are explicit and reproducible. Exact balance belongs to code constants and [gameflow.md](gameflow.md).
- **Production:** facilities are numbered instances with ordered repeating recipe cycles, staffing, player-set wages, Staff Quality, staff hiring/firing/training, upgrades, condition wear, repairs, and local-market automation. Construction and upkeep consume the defined industrial inputs.
- **Quality:** Q is visible to players, affects market sales, and constrains future production through input, research, facility, and lifetime-output limits. Exact ceilings belong to `game/quality/` and [gameflow.md](gameflow.md).
- **Markets and sales:** the local market is player-facing; regional/global pools are device-local. Customer orders are atomic bundles with deterministic local customers, company relationships, and research-controlled scale/targeting.
- **Finance and progression:** Finance reports company and facility economics, including output source cost, maintenance, staff wages, and capital; loans, research, achievements, prestige, and grants are progression systems, not hidden UI rules.
- **Onboarding:** the standard-start tutorial covers company orientation, first facility construction, recipe research, production, automation, economics, upgrades, and Inventory flow. It is replayable/dismissible and does not cover every later system.
- **Mobile UX:** use touch-sized controls, safe areas, accessible labels, readable contrast, non-color-only status, and explicit foreground/background behavior.

## Deferred Scope

| Topic | Decision |
|---|---|
| Offline catch-up | Needs an approved clock policy, cap, and resume feedback. |
| Cloud/accounts/sync | Deferred until a concrete server-owned need exists. |
| iOS/web release | Deferred; web remains a development preview. |
| Workforce expansion | Beyond current staffing, condition, and Repair Technician automation is deferred. |
| Monetization/additional progression | Needs a later product decision beyond the current research, achievement, prestige, and order foundation. |
| Save migration | Older incompatible saves may be discarded; no compatibility layer by default. |
