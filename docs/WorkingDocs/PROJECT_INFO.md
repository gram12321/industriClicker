# Project Information

This repository is an early-stage single-player software-company tycoon game project.

This file is a living implementation map for AI coding agents. Keep it factual and current. Product direction belongs in `docs/WorkingDocs/design.md`; canonical mechanics flow and variable relationships belong in `docs/WorkingDocs/gameflow.md`; historical release notes belong in `docs/WorkingDocs/versionlog.md`.

For AI workflow, start with `.agents/skills/webgamedev-gram/SKILL.md`, then select a matching local specialist skill when needed. The `.agents/skills/superpowers/` group remains available as supporting, non-default workflows.

## Current Status

- Project stage: early mechanics implementation with a player-facing shell, a production route, and a debug route.
- Implemented: mechanics-only TypeScript design loop for software type/feature/subfeature selection, base design work calculation, design progress, completed design iterations, and diminishing design quality gain.
- Implemented: mechanics-only TypeScript development loop for entering development, initializing feature/architecture state, applying design-quality speed scaling, progressing feature quality/extent, progressing architecture quality, calculating software quality, and creating source-attributed bugs.
- Implemented: mechanics-only TypeScript beta loop for beta phase entry, beta work progress, and bug fixing.
- Implemented: mechanics-only TypeScript release loop for beta-to-release phase entry and release price/base-price snapshotting.
- Implemented: reach system for persisted released products, catalog-owned software reach profiles, linear global market growth from the 1970 start date, launch-day sales, daily tick sales, and reach diagnostics.
- Implemented: minimal finance ledger for starting cash and product sales revenue, with income statement, balance sheet summary, cash-only assets, zero-liability equity, period filters, and grouped cashflow UI.
- Implemented: local prestige/reputation system with logarithmic reputation conversion, release-scoped prestige events, company-finance prestige sync, daily decay helpers, and UI visibility.
- Implemented: mechanics-only staff system with top-level skills, specializations, XP-based effective skill growth, team membership, activity assignments, staff-generated work output, payroll expenses, and a staff management route.
- Implemented: mechanics-only game tick/date loop for day, week, month, and year advancement plus phase-appropriate work across multiple projects.
- Implemented: persisted production and activity stores. `useProductionStore` keeps all projects without a single selected work focus, while `useActivityStore` owns the staff-assignable activity list for the sidebar panel.
- Implemented: local Zustand time, finance, prestige, staff, production, activity, and released-product stores persisted to `localStorage`.
- Implemented: top navigation with date, cash, reputation, player-menu placeholders, dev links, and a global advance-day action.
- Implemented: `ManageProductionPage` for creating multiple projects, selecting features/subfeatures, and inspecting all current projects outside the debug page.
- Implemented: placeholder `Company`, `Market`, and `Officepedia` routes so the copied legacy shell feels complete while those pages remain deferred.
- Working doc: `docs/WorkingDocs/gameflow.md` is the single canonical flow and variable-relationship reference.
- Primary goal: define and test core mechanics before building the full player-facing business simulation.
- Persistence: local prototype persistence is implemented. Broader save-game, login, leaderboard, and cloud persistence remain deferred.

Do not list a system as implemented until code and tests exist.

## Intended Stack

The preferred stack may change, but current direction is:

- React/Vite
- TypeScript
- Tailwind CSS
- shadcn-style local UI components
- Supabase only when needed

## Current Repository Shape

The current implemented structure is:

```text
/
|-- docs/                  Project documentation and AI instructions
|-- src/                   Application and game source code
|   |-- constants/         Tunable game balance values and starter software catalog
|   |-- engine/            Deterministic game rules grouped by domain
|   |   |-- activity/       Activity projection for the sidebar panel
|   |   |-- core/           Tick/date loop and shared engine result helpers
|   |   |-- economy/        Finance statement derivation
|   |   |-- market/         Reach and daily sales mechanics
|   |   |-- prestige/       Prestige and reputation calculations
|   |   |-- product/        Product catalog lookup and lifecycle phase engines
|   |   `-- staff/          Staff contribution, experience, team, and payroll calculations
|   |-- stores/            Client-side state stores and local persistence boundaries
|   |-- styles/            Tailwind/global CSS
|   |-- types/             Shared TypeScript domain types
|   |-- ui/                React presentation layer
|   |   |-- components/     Local shadcn-style primitives and app-specific UI
|   |   |-- hooks/          React hooks bridging state/services to UI
|   |   |-- layout/         App shell and navigation
|   |   `-- pages/          Routed browser pages
|   `-- utils/             Shared calculation, display, and class helpers
|-- tests/                 Vitest tests for mechanics, stores, and UI shell/routes
|-- components.json        shadcn-compatible component config
|-- index.html             Vite entry HTML
|-- package.json           Node scripts and dev dependencies
|-- tailwind.config.ts     Tailwind/shadcn theme config
|-- tsconfig.json          Strict TypeScript config
|-- vite.config.ts         Vite and Vitest config
`-- readme.md              Project overview and setup notes
```

If the actual project uses different folders, update this map instead of forcing code into a template.

## Current App Routes

- `/` - `CompanyPage` placeholder for the future company overview
- `/production` - `ManageProductionPage`
- `/staff` - `StaffPage`
- `/finance` - `FinancePage`
- `/market` - `MarketPage` placeholder
- `/officepedia` - `OfficepediaPage` placeholder
- `/debug` - `DebugPage`
- `/admin` - `AdminPage`

Shell-level UI:

- `TopNavigation`
- `ActivityPanel`
- `PrestigeModal`

## Available Commands

- `npm install` - install local development dependencies
- `npm run dev` - start the Vite dev server
- `npm test` - run Vitest tests
- `npm run build` - run TypeScript checking and Vite production build
- `npm run preview` - preview the production build

## Documentation Map

- `docs/WorkingDocs/CONTEXT.md` - canonical domain language glossary
- `readme.md` - project overview, setup, and high-level direction
- `docs/WorkingDocs/design.md` - stable design direction and architecture intent
- `docs/WorkingDocs/PROJECT_INFO.md` - living project map and implementation status
- `docs/WorkingDocs/gameflow.md` - canonical mechanics-flow, variable-relationship, persistence, and balance reference
- `docs/WorkingDocs/softwaretypeDependencies.md` - software-type dependency schema, starter capability set, and staged implementation plan
- `docs/WorkingDocs/versionlog.md` - historical change log for committed work
- `docs/Designdocs/completed/codebaseReorg.md` - archived codebase reorganization record and completed follow-up targets
- `docs/Designdocs/reachsystem.md` - reach-system design note
- `docs/Designdocs/completed/staff-system.md` - archived staff system design and implementation note
- `docs/Designdocs/completed/finance-system.md` - completed minimal finance design note
- `docs/Designdocs/completed/reputation-system.md` - completed prestige/reputation design note
- `docs/Designdocs/completed/Basemechanism.md` - completed base design mechanism note
- `docs/Designdocs/completed/developmentphase.md` - completed development phase note
- `docs/superpowers/completed/` - completed specs and implementation plans
- `docs/copilot-instructions.md` - agent working rules and conventions
- `docs/WorkingDocs/AIpromt_codecleaning.md` - cleanup/refactor guidance

## Core Gameplay Direction

The game models creating, developing, staffing, releasing, and selling software products.

Current core implemented concepts:

- Software types, features, and subfeatures
- Design, development, beta, and release phases
- Quality, bugs, and diminishing returns
- Released products with daily sales
- Staff, teams, XP growth, and payroll
- Prestige, reputation, and minimal finance
- Calendar/tick progression

Still-deferred but intended concepts:

- richer competition and marketing
- more complete company management surfaces
- deeper post-release behavior
- broader finance systems

## AI Development Priorities

1. Keep mechanics testable without UI.
2. Keep business logic out of components.
3. Prefer deterministic formulas and explicit constants.
4. Avoid complex database work until persistence requirements justify it.
5. Keep documentation grounded in current code and tests.
6. Keep one canonical mechanics-flow doc instead of maintaining duplicate flow maps.

## Implementation Status Labels

Use these labels in docs and status notes:

- **Planned**: intended but not yet built
- **In Progress**: partially built and still changing
- **Implemented**: built and covered by relevant tests
- **Deferred**: intentionally postponed

## Implemented Systems

- **Implemented:** Base design mechanism in `src/engine/product/designEngine.ts`, including project creation, scope validation, base design work calculation, design progress, iteration completion, quality gain, and next-iteration start.
- **Implemented:** Catalog selection resolver in `src/engine/product/catalogLookup.ts`, including software type lookup, feature validation, subfeature parent validation, and selected scope complexity calculation.
- **Implemented:** Development mechanism in `src/engine/product/developmentEngine.ts`, including development phase entry, feature development state, architecture state, development work progress, software quality calculation, and source-attributed bug creation.
- **Implemented:** Beta mechanism in `src/engine/product/betaEngine.ts` and `src/engine/product/bugEngine.ts`, including beta phase entry, beta work progress, and beta bug fixing.
- **Implemented:** Release mechanism in `src/engine/product/releaseEngine.ts`, including release price validation and launch price/base-price state.
- **Implemented:** Reach mechanism in `src/engine/market/reachEngine.ts`, including global market growth, software type reach lookup from `SOFTWARE_CATALOG.reachProfile`, addressable market calculation, awareness multipliers, product age decay, scope/quality/feature/price multipliers, launch-day sales, and daily product sales.
- **Implemented:** Minimal finance statement mechanism in `src/engine/economy/financeStatements.ts`, including period/date filtering, income statement, cash-only balance sheet summary, zero-liability equity, and daily/weekly grouped cashflow rows.
- **Implemented:** Prestige/reputation mechanism in `src/engine/prestige/reputationEngine.ts`, including company/release/total prestige summaries, release breakdowns, daily decay, product release prestige, product sales prestige, and derived `0..100` reputation.
- **Implemented:** Staff mechanism in `src/engine/staff/staffEngine.ts`, including effective skill from XP, staff work output, team member resolution, project work profile derivation, activity assignment counts, XP awards, and active payroll calculation.
- **Implemented:** Activity projection mechanism in `src/engine/activity/activityEngine.ts`, including per-phase software project activity creation and progress synchronization for the sidebar panel.
- **Implemented:** Game tick/date mechanism in `src/engine/core/gameTick.ts`, including daily time advancement, day/week/month/year rollover, tick events, multi-project design/development/beta work, and idle released-project behavior.
- **Implemented:** Shared numeric calculation helpers in `src/utils/numberUtils.ts`, including `safeNumber`, `clamp`, `roundCurrency`, and `roundUnits`.
- **Implemented:** Shared display and formatting helpers in `src/utils/utils.ts`, including consolidated number, currency, percent, game-date, quality-tier, and Tailwind class utilities.
- **Implemented:** Local time store in `src/stores/timeStore.ts`.
- **Implemented:** Local finance store in `src/stores/financeStore.ts`.
- **Implemented:** Local prestige store in `src/stores/prestigeStore.ts`.
- **Implemented:** Local staff store in `src/stores/staffStore.ts`.
- **Implemented:** Local production store in `src/stores/productionStore.ts`, including multi-project persistence, per-project draft release prices, and project lifecycle actions.
- **Implemented:** Local activity store in `src/stores/activityStore.ts`, including activity-list persistence and per-activity staff/team assignment state for the sidebar panel.
- **Implemented:** Local released-product store in `src/stores/releasedProductStore.ts`.
- **Implemented:** Shared day-advance orchestration in `src/ui/hooks/useAdvanceDay.ts` and `src/ui/hooks/useGameTick.ts`.
- **Implemented:** Starter software catalog in `src/constants/softwareCatalog.ts`, including per-software reach profiles.
- **Implemented:** Software-type dependency schema and resolver utilities in `src/types/catalog.ts`, `src/constants/softwareCatalog.ts`, and `src/engine/product/dependencyResolver.ts`, including capability requirements, capability providers, level matching, released-product provider snapshots, and production-flow project-creation blockers surfaced in `ManageProductionPage`.
- **Implemented:** Player-facing shell routing in `src/App.tsx`, `src/ui/layout/AppLayout.tsx`, and `src/ui/components/custom/TopNavigation.tsx`.
- **Implemented:** `ManageProductionPage` in `src/ui/pages/ManageProductionPage.tsx`.
- **Implemented:** `ActivityPanel` in `src/ui/components/custom/ActivityPanel.tsx`.
- **Implemented:** `StaffPage`, `FinancePage`, `DebugPage`, and `AdminPage`.
- **Implemented:** Placeholder `CompanyPage`, `MarketPage`, and `OfficepediaPage`.
- **Implemented:** Vitest coverage for engines, stores, navigation shell, and key UI routes, including `tests/productionStore.test.ts`, `tests/staffStore.test.ts`, `tests/releasedProductStore.test.ts`, `tests/appNavigation.test.tsx`, `tests/staffPage.test.tsx`, `tests/financePage.test.tsx`, `tests/debugPage.test.tsx`, and `tests/adminPage.test.tsx`.
- **Implemented:** Consolidated mechanics-flow documentation in `docs/WorkingDocs/gameflow.md`.
- **Deferred:** full company overview gameplay, real market page UI, Officepedia content, broader save-game persistence, login, shared highscores, richer competition simulation, project costs beyond wages, loans, database systems, bug severity, bug discovery state, and player-facing post-release support loops.

## Maintenance Notes

When adding real code, update this file with:

- actual folder structure
- routes and major UI surfaces
- available npm scripts
- implemented systems
- important architectural decisions
- known constraints or temporary shortcuts
