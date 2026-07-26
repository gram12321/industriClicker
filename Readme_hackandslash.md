# Hack and Slash Game

## About

A turn-based hack and slash RPG built with Flutter for mobile devices. This text-based adventure game features character progression, combat mechanics, and resource management.
The game will be 100% vibe coding (IE 100% AI generated no human coding).
Additional instructions for automated coding tools can be found in **.cursor/ai-agent-rules.md** 
There is a old iteration in .old_templete\ where we can get inspiration from. (Complety other project, and in js/react/typescript but we can use the code as a reference)

## AI Code Generation Principles for Hack and slash game

### 💡 ALWAYS, IN EVERY RESPONSE

- Read @readme.md and Ai-Rules.mdc
- After major updates ALWAYS ask to update @readme.md and docs\versionlog.md
- Start every response with the AI-Check-Message "Hack and slash game: Have read the Readme.md"
- **Prefer proper interfaces/types for stats and modifiers, and use maps/lookups instead of switch statements. Avoid hardcoded switch/case logic for stat/modifier mapping.**

## Technical Stack
If you've read this section of the readme, make sure to add to the AI-Check-Message ", also read the Technical stack"
**Core Technologies:**
- Flutter 3.32+ (Mobile UI Framework)
- Dart (Programming Language)
- Material Design 3 (UI Components)
- Hive (High-performance local storage)
- RxDart (Reactive Streams)

**Architecture Pattern:**
- Service-oriented architecture with separation of concerns
- Reactive UI updates using BehaviorSubject streams
- Singleton services for business logic
- Model-View-Service pattern

## Game Systems

**Core RPG Mechanics:**
- 4 Primary Stats: Strength, Dexterity, Intelligence, Hitpoints with exponential decay bonuses
- Stat upgrade points system (2 points per level) with manual allocation
- Complex derived stats calculations for attack, defense, and health
- Equipment-based stat modifiers with flat and percentage bonuses

**Character Progression:**
- Multi-character support with isolated saves
- Level-based progression (100 XP/level) with manual stat distribution
- Equipment-driven power scaling with 7 equipment slots
- Weekly time cycle with automatic healing and persistent timeline

**Equipment & Items:**
- Complete equipment system: head, body, gloves, boots, ring, weapon, shield
- Diablo-inspired rarity system: Normal, Magic, Rare, Epic, Legendary, Artifact
- 23+ item types with unique stats and level requirements
- Dynamic item generation with randomized modifiers
- Durability system with combat wear and repair mechanics

**Combat System:**
- Turn-based combat with dexterity-based hit chance (5-95% range)
- 7 creature types with unique characteristics and RPG stats
- Equipment damage from combat (weapons 2-4, armor 1-2 per fight)
- Level-scaled enemy generation with creature characteristics

**Exploration Zones:**
- Multiple zones: Forest, Cave, Graveyard, Mountains
- Zone-specific creature spawns and difficulty scaling
- Level requirements for zone access
- Experience and gold bonuses per zone

**Data & UI:**
- Automatic saving on major actions
- Per-character notification logs (info, success, warning, error), real-time updates, and analytics
- All data stored locally using Hive binary database (zero JSON), complete character isolation, reactive UI updates
- Admin tools: cheats (heal, gold, XP), equipment testing, data management

**Mobile-First Design:**
- Responsive TopBar with navigation and character menu
- Adaptive layout for both mobile and tablet screens
- Touch-friendly interface with Material Design 3
- Local storage for game state persistence

If you've read this section of the readme, make sure to add to the AI-Check-Message ", also read the game system readme"

## Current Features

### ✅ Core RPG Systems
- Complete 4-stat RPG system (Strength, Dexterity, Intelligence, Hitpoints)
- Manual stat allocation with upgrade points (2 per level)
- Complex derived stats with exponential decay bonuses
- Equipment-based stat modifiers and effective stats calculations

### ✅ Equipment & Items
- Full 7-slot equipment system with visual equipment view
- Diablo-inspired 6-tier rarity system with color coding
- 23+ item types with level requirements and stat bonuses
- Dynamic item generation with randomized modifiers
- Complete durability system with repair mechanics

### ✅ Combat & Adventure
- Turn-based combat with dexterity-based hit chance system
- 7 unique creature types with individual characteristics
- Multiple exploration zones with level requirements
- Zone-specific creature spawns and reward bonuses
- Equipment damage from combat and power scaling

### ✅ User Interface
- Mobile-first, responsive Material Design 3
- Reactive, real-time updates and notifications
- Dedicated Equipment View with slot management
- Enhanced Inventory View with item details and repair options
- Zone selection with access indicators

### ✅ Technical Features
- Service-based architecture with consolidated character management
- Hive binary storage (zero JSON serialization) for high performance
- Auto-generated type adapters for all data models
- Type-safe combat with sealed classes, robust error handling
- Streamlined admin panel with consolidated data management

### ✅ Finance System (Updated for [0.022] 2024-06-10)
- **Centralized FinanceService**: All gold and asset operations go through a single, robust service with full audit trail and analytics.
- **Transaction Tracking**: Every money change is recorded as a transaction (amount, category, description, in-game date, timestamp, character) for complete financial history.
- **Asset Tracking**: Tracks cash (gold), equipped item value, inventory item value, and total assets per character, with analytics and breakdowns.
- **Gold Balance Graph**: Line graph showing gold balance over time, with axis titles, in-game date labels, and value labels for each point.
- **Asset Value Stacked Chart**: Stacked column chart visualizing asset composition (cash, equipped, inventory) for each game date, with legend and axis labels.
- **Finance View UI**: Major redesign with:
  - Prominent Total Assets card
  - Balance sheet (current/fixed assets, subtotals, grand total)
  - Gold balance trend graph
  - Asset value breakdown chart
  - Scrollable layout and bugfixes for overflow
  - Restored and improved transaction history section
- **Technical Improvements**:
  - TransactionData model now includes in-game season/year/week
  - All analytics and UI are per-character, with future-proofing for more asset types
  - Custom chart painters for all graphs (no external dependencies)
  - Bugfixes for scrolling, overflow, and graph rendering

If you've read this section of the readme, and editing the finance system make sure to add to the AI-Check-Message ", also read the finance system readme and are editing the finance system now"

### 🚧 Planned Features
- Enhanced enemy AI and boss battles
- Achievement and quest systems
- Advanced crafting mechanics
- Guild/faction systems
- Expanded zone variety

## Development Notes
**Code Generation**: This project uses 100% AI-generated code following modern Flutter best practices.
**Architecture**: Built using service-oriented architecture with reactive programming patterns for maintainable and testable code.

**Project Structure:**
```
lib/
├── main.dart                    # App entry point
├── hive/                        # Hive models & generated adapters
│   ├── character_save_data.dart # Character save data model
│   ├── game_state.dart         # Game state & view enums
│   ├── notification_message.dart # Notification models
│   └── *.g.dart                # Auto-generated Hive adapters
├── models/                      # Core game entities
│   ├── character.dart          # Character stats and progression
│   ├── creature.dart           # Enemy creatures and combat
│   ├── item.dart               # Equipment and item system
│   ├── item_factory.dart       # Dynamic item generation
│   └── zone.dart               # Exploration zones and configuration
├── services/                    # Business logic layer
│   ├── game_state_service.dart # Core game state management
│   ├── combat_service.dart     # Combat mechanics and enemy AI
│   ├── adventure_service.dart  # Zone exploration and encounters
│   ├── character_management_service.dart # Character CRUD operations
│   ├── hive_storage_service.dart # High-performance local storage (Hive)
│   ├── stream_service.dart     # Reactive UI updates (BehaviorSubject)
│   ├── game_tick_service.dart  # Time progression and automatic healing
│   └── notification_service.dart # User notifications and logging
├── screens/                     # Main application screens
│   ├── login_screen.dart       # Character selection/creation
│   └── game_screen.dart        # Main game interface
└── widgets/                     # UI components
    ├── components/             # Reusable UI elements
    │   ├── top_bar.dart       # Navigation and game controls
    │   └── notification_bell.dart # Notification indicator
    ├── reactive/              # Stream-based reactive widgets
    │   └── reactive_character_stats.dart # Auto-updating character display
    └── views/                 # Game view components
        ├── character_view.dart    # Character stats and progression
        ├── adventure_view.dart    # Combat and exploration
        ├── equipment_view.dart    # Equipment management and slot display
        ├── admin_view.dart        # Debug/cheat panel
        ├── finance_view.dart      # Economic management
        ├── inventory_view.dart    # Item management and repairs
        ├── profile_view.dart      # Character profile
        ├── settings_view.dart     # Game settings
        └── notification_log_view.dart # Notification history
```

If you've read all of the readme, make sure to add to the AI-Check-Message ", read the entire readme"