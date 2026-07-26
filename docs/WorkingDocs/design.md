# Office Tycoon Design

Office Tycoon is a single-player software-company tycoon game. The player creates software products, staffs them, develops them through multiple phases, releases them, and then lives with the financial and reputation consequences of those releases.

This document is the stable design and architecture direction. Keep implementation status, repository maps, routes, and commands in `docs/WorkingDocs/PROJECT_INFO.md`. Keep detailed variable relationships, formulas, and persistence notes in `docs/WorkingDocs/gameflow.md`.

## Game Direction

The core loop is:

1. Choose a software type and scope.
2. Design the project.
3. Develop features and architecture.
4. Accumulate and fix bugs.
5. Release at a chosen price.
6. Earn post-release daily sales.
7. Reinvest through staff, timing, and future projects.

The central gameplay pressure is that broader scope can improve product appeal, but it also increases work, bug exposure, and opportunity cost. The player should be pushed to make tradeoffs between shipping faster, polishing more, growing staff costs, and protecting reputation.

## Current Player-Facing Product Shape

The current shell already exposes the game as more than a debug sandbox:

- `TopNavigation` provides the main app shell, date, cash, reputation, and a global advance-day action.
- `ManageProductionPage` is the current non-debug production surface for starting and inspecting all current Software Projects.
- `ActivityPanel` gives a persistent right-side summary of all current staff-assignable Activities.
- `StaffPage` and `FinancePage` expose the current staff and ledger systems.
- `CompanyPage`, `MarketPage`, and `OfficepediaPage` are placeholders that reserve the long-term player-facing navigation shape.
- `DebugPage` remains the deeper diagnostics route rather than the only place where the game exists.

Design implication: future work should continue moving important play loops into the player-facing shell, while keeping the debug route as a diagnostics surface.

## Product Lifecycle

Each software project currently moves through these phases:

1. Design
2. Development
3. Beta
4. Release
5. Post-release daily sales

Design direction for this lifecycle:

- Design quality should influence how efficient later work becomes.
- Development should improve feature and architecture outcomes with diminishing returns.
- Bugs should be created by development work and reduced in beta.
- Release should freeze the shipping snapshot used by sales, prestige, and post-release tracking.
- Post-release behavior should eventually become deeper than passive daily sales, but the current prototype keeps it intentionally narrow.

## Feature And Subfeature System

Products are built from software types, features, and subfeatures.

Design intent:

- Software types own base price, complexity, and reach profile.
- Features and subfeatures expand scope and should continue to influence development time, bug exposure, market appeal, and staffing fit.
- Features should remain structured data, not UI-specific branches.
- Balance values should live in constants or data files so they can be tuned without rewriting logic.

Current implementation note:

- Features are full development entities.
- Subfeatures currently increase scope and influence specialization weighting, but they do not yet become separate development work items.

## Quality And Bugs

Quality is a first-class mechanic, not just a display value.

Design intent:

- Quality should remain deterministic and explainable.
- Design quality should matter indirectly through development speed.
- Architecture quality and feature outcomes should stay distinct before being merged into final software quality.
- Bugs should continue to reduce quality until fixed.
- Bugs should eventually be allowed to influence more than quality and prestige, such as support cost, reviews, or update burden.

## Market, Sales, And Reputation

Released products generate sales through a reach-based market model.

Current implemented direction:

- Sales depend on global market growth, software-type reach, scope, quality, feature score, price, product age, company reputation, and release reputation.
- Reputation is derived from prestige, not stored separately.
- Prestige currently grows through release events, product sales events, and company-finance state.

Longer-term design direction:

- Marketing and competition should become explicit systems instead of only being implied in the formulas.
- Market-facing pages should explain why products are selling well or poorly.
- Post-release market behavior should grow beyond a simple steady daily-sales path.

## Finance

The player should have a readable business model, even while the prototype stays small.

Current direction:

- The ledger tracks product sales income and staff wage expense.
- Cash is the dominant current asset.
- Reputation already responds to finance balance through a permanent prestige event.

Longer-term direction:

- Add more meaningful expenses, project burn, and business pressure before introducing complex accounting.
- Expand finance only when it creates player decisions, not just more bookkeeping.
- Keep all finance flows centralized and testable.

## Staff, Teams, And Work Capacity

Staff is now part of the live production loop, not just a deferred concept.

Current implemented direction:

- Staff output is calculated from base skill, XP growth, specialization fit, capacity, and team-size scaling.
- Assigned staff feed project work through the shared day-advance flow.
- Payroll records into the finance ledger every day advance when active staff exist.
- Teams remain a management grouping, not a hard project-rule boundary.

Longer-term direction:

- Make staffing choices more strategic than "add more total work".
- Let specialization and phase fit create clearer tradeoffs.
- Expand staffing decisions into a broader company simulation without moving business logic into UI components.

## Persistence

Game progress should persist enough to support iteration without over-designing save systems too early.

Current direction:

- Persist focused source-of-truth stores for time, finance, prestige, staff, production, activity, and released products.
- Keep persistence boundaries explicit.
- Prefer clean current data shapes over legacy compatibility unless compatibility is explicitly required.

Longer-term direction:

- Add broader save/load and migration strategy only when the prototype needs it.
- Avoid letting persistence concerns drive domain design too early.

## Notifications And Events

The game should explain meaningful state changes to the player.

Current direction:

- Tick events already exist in the pure engine.
- Activity tracking gives an always-visible summary of staff-assignable work, including each project phase currently in progress.
- Prestige and finance now have shell-level visibility through the top navigation and modal.

Longer-term direction:

- Add explicit event surfaces for important shifts: shipped releases, bug spikes, sales changes, market pressure, or financial risk.
- Keep discovery of events in domain logic, not in presentation code.

## Architecture Intent

Maintain a clear separation between:

- engine/domain logic: deterministic rules, formulas, ticks, quality, bugs, and sales
- state layer: persisted game state, selectors, orchestration, and lifecycle actions
- UI layer: screens, controls, panels, and presentation
- test layer: mechanics-first validation

Recommended layer direction:

```text
UI/components -> hooks/state actions -> engine/services -> persistence/data
```

Current repo shape follows that intent reasonably well:

- `src/engine/` owns rules and calculations by domain
- `src/stores/` owns persisted state boundaries
- `src/ui/hooks/` bridges the state/engine boundary into React
- `src/ui/components/` and `src/ui/pages/` own presentation
- `src/constants/`, `src/types/`, and `src/utils/` support the domain model

## Development Principles

- Build mechanics before ornamental UI where practical.
- Keep business logic out of React components.
- Keep formulas and balance values in constants or structured data.
- Keep numeric helpers separate from display-formatting helpers.
- Keep source-of-truth state explicit.
- Prefer deterministic mechanics that can be tested without a browser.
- Mark planned systems as planned; design notes are not proof that code exists.
- Keep one canonical mechanics-flow doc instead of duplicating relationship maps.

## Testing Expectations

Tests remain the main proof that mechanic changes are correct.

Prioritize tests for:

- project phase transitions
- feature complexity and work formulas
- quality and bug calculations
- tick order and progression
- staff output, XP awards, and payroll
- release registration and daily-sales idempotency
- prestige and reputation derivation
- finance ledger behavior
- app-shell navigation and key route surfaces

Tests should describe player-relevant behavior, not just implementation details.

## Current References

- `CONTEXT.md` - canonical domain glossary
- `docs/WorkingDocs/gameflow.md` - canonical mechanics-flow and variable-relationship reference
- `docs/WorkingDocs/PROJECT_INFO.md` - current implementation status, routes, and repo map
- `docs/WorkingDocs/versionlog.md` - historical committed change log
- `docs/Designdocs/completed/codebaseReorg.md` - archived restructuring record and completed integration milestones
- `docs/Designdocs/reachsystem.md` - reach-system design note
- `docs/Designdocs/completed/staff-system.md` - archived staff-system design and implementation note
- `docs/Designdocs/completed/` - completed historical design notes for implemented systems
