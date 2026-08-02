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
- Facilities are built with company funds; destroying one gives no refund.
- Sales contracts let players exchange available inventory for money. They remain available until fulfilled or rejected, and their retained history remains visible.
- Company prestige is informational only in this version.
- Achievements show company milestones across facilities, total and per-resource production, sales, finance, foreground time, and prestige. Their only v1 reward is a decaying prestige event; they do not change production, pricing, staffing, contracts, or finance rules. The achievement view provides overall completion, category filters, and global mastery labels while showing each series' earned tiers and immediate next tier.
- Speed and Output upgrades improve a facility independently. Staffing is the first efficiency factor; broader workforce systems are deferred.
- Production progresses only while the app is foregrounded. The temporary one-minute fast-forward follows the same rule; offline progression is not yet approved.
- The local market is player-facing; the global market is a device-local reservoir that supplies price diffusion. Sales contracts lock a global-price offer with a 20% premium and deposit fulfilled goods into that reservoir.
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
| Save compatibility | Older snapshot versions may be discarded unless a migration is explicitly approved. |
| Cloud accounts, sync, and global leaderboard | Deferred. Device-local profiles and a clearly labelled leaderboard placeholder do not provide online identity or rankings. |
