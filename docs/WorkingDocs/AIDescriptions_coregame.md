# Core Game Mechanics

This is the concise, code-verified status guide. Use `CONTEXT.md` for vocabulary, `design.md` for product direction, `gameflow.md` for rules and lifecycle, and [VariableRelationshipMap.md](VariableRelationshipMap.md) for state-level relationships.

## Runtime and Player Surfaces

The Expo Router app presents a local company-selection screen and a mobile dashboard with Company, Inventory, Facilities, Finance, Sales, Research, Achievements, Profile, Settings, Leaderboard placeholder, and IndustriPedia views. React Native Paper provides the touch-first UI; Zustand owns active runtime state; Expo SQLite stores company-keyed snapshots. Inventory stores quantity, quality, and quantity-weighted source cost; facility production carries direct input cost into completed output and records timestamped Finance-owned facility performance.

## Implemented Behavior

### Production and Progression

- Typed resource, recipe, facility, research, grant, achievement, prestige, and sales catalogues own deterministic configuration.
- Facility production runs only in foreground time. It supports staffing, condition wear and repair, upgrades, researched recipe cycles, multi-output recipes, and local-market autobuy/autosell.
- Output quality is resolved by the pure `game/quality` domain as the minimum of InputMaxQ, ResearchMaxQ, UpgradeMaxQ, and company-wide ProductionMaxQ. Research and facility upgrades share one diminishing curve; lifetime production uses a continuous asymptotic normalizer.
- Research projects have typed gates and effects. Research capacity determines how many independent projects can run at once; every active project remains visible and can be cancelled by its own project ID for a full refund of its recorded cost.
- Customer orders use a deterministic local catalogue, relationships, multi-line fulfilment, company-asset order caps, and research-controlled targeting, capacity, and bid effects.

### Economy and Persistence

- Finance records typed transactions, loans, lender searches, economy phases, debt collection, and prestige-relevant events. Facility construction, upgrades, and repairs carry Finance-owned historical facility accounting entries; company facility assets use historical capital less condition wear, with current-price revaluation reported separately.
- Local, regional, and global market pools have deterministic price, trade, and diffusion rules.
- A valid current `GameSnapshot` is saved per company. There is intentionally no backwards-compatibility or migration layer: incompatible pre-alpha saves may be discarded.

### UI and Mobile Experience

- Dashboard views derive display-only status from domain services rather than duplicating simulation formulas.
- The tutorial currently guides the standard start through a small mutually exclusive stage flow; it remains intentionally incomplete.
- Active processes list foreground production, research, sales, and lender-search progress.

## Deferred or Partial Areas

- Supabase, accounts beyond local profiles, cloud backup, and cross-device sync are deferred.
- Offline catch-up, iOS release, web release, broader workforce systems, and the complete tutorial are deferred.

## File Map

- `game/`: domain catalogues, deterministic rules, state snapshots, time, and persistence adapters.
- `game/core/stores/gameStore.ts`: Zustand command boundary and foreground-time orchestration.
- `game/facilities/`, `game/sales/`, `game/research/`, `game/market/`, and `game/finance/`: domain-specific services and models.
- `ui/`: React Native views and presentation helpers.
- `tests/`: deterministic Vitest coverage for game rules and economy balance.

## Update Rules

Only record behaviour here once code and relevant verification exist. Move historical implementation detail to `versionlog.md` after a corresponding commit exists.
