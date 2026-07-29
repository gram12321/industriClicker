# Industri Clicker Design

This document holds durable player-facing design decisions, product direction, and deferred scope.

## How To Use This Document

- Record a decision when it changes what the player sees, does, earns, unlocks, or understands.
- State the player effect, the rule, and any known trade-off.
- Put exact formulas, tick order, and save boundaries in `gameflow.md`.
- Put concrete variable dependencies in `VariableRelationshipMap.md`.
- Keep verified implementation facts in `PROJECT_INFO.md`.

## Game Direction

Industri Clicker is a single-player, mobile-first industrial clicker for native Android. The intended experience is an approachable portrait-phone game with explicit progression, code-defined UI, local-first saves, and a time-controlled gameplay loop.

## Player Experience Goals

- Make the next useful action understandable on a narrow phone screen.
- Give frequent, readable feedback for player actions and production changes.
- Make longer-term progression visible without requiring a dense desktop-style interface.
- Keep ordinary play responsive, offline-capable, and free of required accounts.

## Core Loop

The concrete loop is still being established. The intended shape is:

1. The player performs or selects an available action.
2. The game applies a clear cost, gain, or production change.
3. The player receives feedback and sees the updated state.
4. Progress creates a choice, upgrade, unlock, or more efficient path.

## Current Product Decisions

### Resource and Facility Foundation

- The current resource catalogue contains Grain, Bread, Water, Electricity, Sugar, Coal, and Cake.
- The current facility catalogue contains Farm, Bakery, Small Utility Works, Mine, Water Well, and Power Plant.
- Small Utility Works produces Water or Electricity; Farm grows Grain; Bakery bakes Bread.
- Farm can also grow Sugar; Mine produces Coal; Water Well pumps Water; Power Plant produces Electricity; Bakery can bake Cake.
- Local and global market mechanics are outside the foundation scope.
- Resource quality currently has no player-visible rule beyond its placeholder value.

### Economy Foundation

- A new company starts with €10,000.
- Farm construction costs €60; Bakery construction costs €300.
- Construction requires sufficient funds and destruction refunds no funds.
- Finance records accepted balance changes so the player can understand company activity.

### Sales Contracts

- Every five foreground game minutes, a numbered customer offers a contract for one randomly selected resource and an integer quantity from 1 to 10.
- Each supplied unit pays €1. Contracts do not expire and remain available until the player fulfils them.
- A contract can only be fulfilled when the full requested quantity is in inventory. Fulfilment removes that quantity, records the income, and moves the contract to the completed list.
- Fast-forward 1 minute advances contract time; background time does not.

### Facility Upgrades and Staffing

- Each constructed facility has independently purchasable Speed and Output upgrades, funded only with euros in this first version.
- Upgrade costs rise exponentially. The speed and output gains diminish toward fixed caps, so early levels are valuable without creating unbounded production.
- Every upgrade increases the facility's required worker count. A facility starts fully staffed, but the player can assign fewer or more workers.
- Staffing is the first building-efficiency factor. Understaffing applies an increasingly severe penalty; overstaffing provides a capped, diminishing production-speed bonus.
- Global workforce supply, hiring, wages, education, machine condition, and other efficiency factors are deferred.

### Time-Controlled Progression

- Production advances only while the app is foregrounded in the first implementation.
- The temporary Fast-forward 1 minute control follows the same production behavior as elapsed foreground time.
- Offline/background progress is deferred until its catch-up cap, clock policy, and resume feedback are approved.

## Mobile Interaction and UI Direction

- Design portrait phone screens first, using React Native Paper and React Native primitives.
- Use large, touch-friendly controls with visible press and completion feedback.
- Do not depend on hover, right-click, mouse precision, or web-only behavior.
- Use accessible labels, readable text, safe-area-aware layouts, and non-color-only state cues.
- The project has no bespoke graphic-design pipeline; its visual language comes from code-defined UI primitives unless later approved otherwise.

## Deferred Product Scope

| Topic | Decision | Status |
|---|---|---|
| Cloud backend | No cloud service until an approved need exists. | Deferred |
| Market | Not part of the initial resource foundation. | Deferred |
| Offline catch-up | Requires an approved cap and device-clock policy. | Deferred |
| Monetization | To be designed. | Open |
| Broader progression | To be designed after the first playable loop. | Open |
| Concrete art assets | No bespoke pipeline currently. | Confirmed direction |
| Save backward compatibility | Do not preserve prior local-save shapes by default. A new save version discards older snapshots unless a migration is explicitly approved. | Confirmed direction |

## References

- [CONTEXT.md](CONTEXT.md) for canonical terminology.
- [gameflow.md](gameflow.md) for mechanics, formulas, and state flow.
- [VariableRelationshipMap.md](VariableRelationshipMap.md) for concrete variable relationships.
- [PROJECT_INFO.md](PROJECT_INFO.md) for verified implementation facts and repository shape.
