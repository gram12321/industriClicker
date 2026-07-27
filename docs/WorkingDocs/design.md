# Industri Clicker Design

This document holds durable player-facing design decisions. It is a template at the foundation stage: sections preserve the intended design workflow, while unapproved mechanics remain explicitly planned.

## How To Use This Document

- Record a decision when it changes what the player sees, does, earns, unlocks, or understands.
- State the player effect, the rule, and any known trade-off.
- Put exact formulas, tick order, and save boundaries in `gameflow.md`; put variable dependencies in `../../VariableRelationshipMap.md`.
- Keep verified implementation facts in `PROJECT_INFO.md`.

## Game Direction

**Confirmed direction:** Industri Clicker is a single-player, mobile-first industrial clicker for native Android.

**Planned product shape:** an approachable portrait-phone game with code-defined UI, explicit progression, a local-first save, and a time-controlled gameplay loop.

## Player Experience Goals

- Make the next useful action understandable on a narrow phone screen.
- Give frequent, readable feedback for player actions and production changes.
- Make longer-term progression visible without requiring dense desktop-style interfaces.
- Keep ordinary play responsive, offline-capable, and free of required accounts.

## Core Loop

Planned template:

1. The player performs or selects an available action.
2. The game applies a clear cost, gain, or production change.
3. The player receives feedback and sees the updated state.
4. Progress creates a choice, upgrade, unlock, or more efficient path.
5. Time-based rules advance only where the final gameflow explicitly allows them.

Replace this with the approved concrete loop before implementing core mechanics.

## Production And Progression

Document each approved system here using this shape:

| System | Player purpose | Main input | Main output | Unlock/progression rule | Status |
|---|---|---|---|---|---|
| Example production step | Demonstrates the format only | To be designed | To be designed | To be designed | Placeholder |

### Initial Resource Foundation

- The initial closed resource catalogue contains **Grain** and **Bread** only.
- Resources are code-defined class instances keyed by an exported `ResourceType` enum. Player-held values are not stored on those definitions.
- Player inventory owns a resource's quantity and quality together. Quality is currently the placeholder value `1`; no quality calculation is defined yet.
- `RecipeName` and typed recipe input/output shapes reserve the Grain-to-Bread chain, but recipe costs, yields, and player actions remain unapproved and unimplemented.
- Local and global market mechanics are explicitly out of scope for this foundation.

### Initial Facility Foundation

- The initial facility catalogue contains **Farm** and **Bakery** only.
- A constructed facility stores its type, selected recipe identifier, and active/inactive state. The Farm accepts only `GrowGrain`; the Bakery accepts only `BakeBread`.
- Facility definitions remain code-owned. The player's constructed facility collection is separate, JSON-safe snapshot data for a future Expo SQLite save.
- Construction costs, currencies, research, production timing, recipe execution, upgrades, and UI build controls are deliberately deferred rather than copied from Baseclicker without their supporting systems.

Questions to settle:

- What does the player do manually at the start?
- Which actions become automated, accelerated, expanded, or replaced over time?
- Which choices are strategic rather than merely larger numbers?
- What is the current progression horizon for the first playable version?

## Economy And Balance

- Use named balance values and deterministic formulas.
- Show costs, gains, requirements, and blocked states clearly to the player.
- Avoid hidden losses or unclear time calculations.
- Record actual resource relationships, rates, and caps in `../../VariableRelationshipMap.md`; record formula examples in `gameflow.md`.

## Time-Controlled Progression

The game may include active-session ticks and elapsed-time catch-up after resume. Neither rule is designed yet.

Before implementation, define:

- what can progress while active;
- what can progress while the app is closed;
- maximum catch-up duration or caps, if any;
- how timestamps, device-clock changes, and invalid elapsed time are handled;
- what feedback the player receives on resume.

## Mobile Interaction And UI

- Design portrait phone screens first, using React Native Paper and React Native primitives.
- Use large, touch-friendly controls with visible press and completion feedback.
- Do not depend on hover, right-click, mouse precision, or web-only UI behavior.
- Use accessible labels, readable text, safe-area-aware layouts, and non-color-only state cues.
- The project uses no bespoke graphic-design pipeline; visual language comes from code-native primitives and still images only when later approved.

## Persistence And Offline Play

- Runtime state belongs in Zustand.
- Deliberate durable snapshots belong in Expo SQLite.
- Do not save on every tap; define save boundaries in `gameflow.md`.
- Supabase is deferred unless an approved cloud need changes this decision.

## Events And Notifications

Planned. Define player-facing completion, unlock, warning, and resume events here before implementation. Do not assume local push notifications or background execution are available until the product specifically adopts them.

## Architecture Intent

Keep these responsibilities separate:

```text
React Native UI -> typed command -> pure game logic -> Zustand runtime state
                                                  -> deliberate Expo SQLite snapshot
```

UI renders state and requests actions. Pure TypeScript game logic owns validation and calculations. Persistence code owns SQLite access and restoration.

## Development Principles

- Build the smallest playable slice before expanding systems.
- Keep gameplay rules deterministic and testable outside the UI.
- Prefer derived display values over redundant stored values where practical.
- Make time, persistence, and offline behavior explicit before relying on them.
- Do not add a backend, account system, or cloud dependency without approval.

## Testing Expectations

- Test game rules, calculation boundaries, and tick/catch-up behavior outside UI components.
- Add focused interaction coverage for essential player paths once screens exist.
- Verify important UI changes at narrow Android phone dimensions and on a physical Android device at meaningful checkpoints.

## Decisions And Deferred Scope

| Topic | Decision | Status |
|---|---|---|
| Platform | Native Android first | Confirmed |
| App stack | Expo, React Native, TypeScript, Expo Router | Confirmed |
| Local state | Zustand runtime state and Expo SQLite saves | Confirmed |
| Cloud backend | Supabase only after an approved need | Deferred |
| Concrete production loop | To be designed | Open |
| Initial resources | Grain and Bread, held in a class-based inventory | Confirmed foundation |
| Resource quality | Fixed placeholder value `1` until rules are designed | Confirmed foundation |
| Market | Not part of the initial resource implementation | Deferred |
| Initial facilities | Farm and Bakery class-based runtime state | Confirmed foundation |
| Facility construction and production | Costs, execution rules, and timing are not designed | Deferred |
| Monetization | To be designed | Open |
| Concrete art assets | No bespoke graphic-design pipeline | Confirmed direction |

## References

- `CONTEXT.md` for canonical terminology.
- `gameflow.md` for mechanics, formulas, and state flow.
- `../../VariableRelationshipMap.md` for concrete variable relationships.
- `PROJECT_INFO.md` for verified implementation facts and repository shape.
