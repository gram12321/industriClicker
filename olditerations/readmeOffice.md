# Industri Clicker Tycoon

Industri Clicker Tycoon is an early-stage single-player clicker game.

The game is a production/industri clicker. This is a mobilefirst game. And we should select the tect stack and architecture with mobile-first in mind. 


## Start Here

- `docs/WorkingDocs/CONTEXT.md` - domain language glossary: canonical terms for Staff Members, Skills, Specializations, Software Projects, Features, and Teams.
- `docs/WorkingDocs/design.md` - game vision, mechanics direction, architecture intent, and development principles.
- `docs/WorkingDocs/PROJECT_INFO.md` - current implementation status, repo map, commands, and maintenance notes.
- `docs/WorkingDocs/gameflow.md` - current variable/data-flow overview for implemented lifecycle, reach, reputation, and finance mechanics.
- `docs/WorkingDocs/versionlog.md` - historical change log for committed work.


## Game architechture

This is a guide for the AI to understand the game mechanics and how to implement them in the code.

This is a hack and slash game, for now its completely text based. This is NOT a 2d/3d game. 
The game will be 100% vibe coding (IE 100% AI generated no human coding)

This is intended to be a game that is native to mobile devices.
Because of this, we will use the following technologies:
- Flutter (Mobile UI Framework)
- Dart (Programming Language)
- Hive (High-performance binary database for local storage)
- Material Design 3 (UI Components)
- RxDart (Reactive Streams)

# Storage Architecture

**All data persistence uses Hive binary database:**
- Zero JSON serialization - all models use `@HiveType` and `@HiveField` annotations
- Auto-generated type adapters for efficient binary storage
- Organized in `/lib/hive/` directory with models and generated `*.g.dart` files
- Character isolation through separate Hive boxes per character
- Synchronous operations after initialization for better performance

# Service Architecture
    
**Consolidated service pattern:**
- `CharacterManagementService`: All character CRUD operations
- `HiveStorageService`: Database operations and adapter management  
- `GameStateService`: Current game state and character tracking
- `NotificationService`: Per-character notification system
- `StreamService`: Reactive UI updates using BehaviorSubject


## Completed/archive docs:

- `docs/Designdocs/completed/` and `docs/Designdocs/reachsystem.md` - user-facing mechanic design notes and archived implementation records, including codebase reorg, staff system, finance, and reputation design.
- `docs/superpowers/completed/` - completed Superpowers specs and implementation plans.

Treat source code, tests, `PROJECT_INFO.md`, and `gameflow.md` as the current implementation reference. Use `versionlog.md` for history. Older completed docs explain why a feature was built.

## Agent Workflow

`.agents/skills/webgamedev-gram/SKILL.md` is the default router for AI work in this repository. It establishes Office Tycoon conventions and selects relevant local specialist skills from `.agents/skills/`.

The `.agents/skills/superpowers/` group remains available for explicitly requested or clearly applicable specialist workflows. It is not the default session entrypoint; do not start routine work with `using-superpowers`.

## Current App

Browser routes:

- `/` - sparse landing page.
- `/debug` - debug UI for selecting software type, features, and subfeatures, then inspecting the persisted local game date, daily tick progression, design progress, development progress, feature values, architecture values, software quality, bug counts, beta bug-fixing progress, release price, launch diagnostics, released-product daily sales, reach diagnostics, prestige, and reputation. A reputation indicator (star button) in the app header opens a prestige breakdown modal.
- `/staff` - Winemaker-inspired staff management UI for hiring a starter employee, filtering teams, viewing activity assignment counts, and inspecting skill/XP bars.
- `/finance` - finance UI for the minimal ledger: starting cash, product sales income, income statement, balance sheet summary, assets, liabilities/equity, period filters, and daily/weekly grouped cashflow.
- `/admin` - small admin control surface for inspecting and clearing the local save keys currently managed by the app, including time, finance, prestige, staff, and released products.

