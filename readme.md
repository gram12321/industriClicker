# Industri Clicker

Industri Clicker is an early-stage, single-player industrial clicker game for Android. It is mobile-first, UI-driven, and maintained entirely through coding agents. The game uses code-defined interface components and primitives rather than bespoke graphic design.

## Project Direction

- Build a responsive, touch-first clicker experience for portrait phones before adapting it to larger screens.
- Keep gameplay, economy, progression, and time-controlled tick processing deterministic, explicit, and testable outside the UI.
- Keep the first release local-first and single-player. Cloud services are a later product decision, not a foundation requirement.
- Use established, code-acquirable UI primitives instead of custom artwork or manually designed visual assets.
- Keep shared visual tokens and the React Native Paper theme in `theme.ts`; keep dashboard-specific layout rules in `ui/dashboard/dashboard.styles.ts`.
- Treat predecessor-project documents as references only. They do not define Industri Clicker's domain, implementation status, routes, or persistence.

## Locked Technology Stack

| Area | Decision |
|---|---|
| Product target | Native Android app first |
| App framework | Expo + React Native |
| Language | TypeScript |
| Navigation | Expo Router |
| UI | React Native Paper and React Native core components |
| Game logic | Pure TypeScript engine and services, independent from UI |
| In-memory state | Zustand |
| Local persistence | Expo SQLite |
| Cloud/backend | None initially; Supabase only when a real cloud need exists |
| Development preview | Expo Go on a physical Android device; browser preview and DevTools as lightweight secondary tools |
| Release path | Native Android build; no PWA or web release target |

Exact package versions are intentionally not fixed here. The selected Expo SDK determines compatible versions when the project is scaffolded.

## Local Setup

```bash
npm install
npm run web
```

The web command is a local browser preview for development and layout inspection; Android remains the product target. For the preferred native preview, run `npm run start`, keep the phone and computer on the same network, and scan the QR code from Expo Go. `npm run android` is an optional emulator shortcut when an emulator is available.

## Why This Stack

Expo and React Native provide a native Android application rather than a browser application, while retaining TypeScript and React's component model. This gives coding agents a familiar, well-supported way to produce native mobile UI.

React Native Paper supplies reusable Material-based controls, layouts, dialogs, lists, and feedback entirely through code. It meets the requirement for a coherent UI without relying on bespoke graphic design.

Game state stays in memory for responsive taps and progression. Expo SQLite stores deliberate saves, checkpoints, and history; it is not written on every tap. Supabase is deferred until the game needs cloud backup, cross-device sync, accounts, or another explicitly approved server feature.

## Architecture Principles

Keep responsibilities separate:

```text
React Native UI -> hooks/view models -> game commands/services -> state and persistence adapters
```

- UI components render state and collect player input. They do not own business rules, calculations, or database access.
- Expo Router `_layout.tsx` owns shared providers and navigation configuration; route screens own their rendering and interaction logic.
- Shared colors and Paper theme configuration belong in `theme.ts`; screen-specific `StyleSheet` objects belong beside their screen. Avoid a global catch-all stylesheet.
- Pure TypeScript engine/service modules own gameplay formulas, progression, tick order, validation, and derived values.
- Zustand holds active source-of-truth runtime state. Derive view data instead of persisting every display value.
- Expo SQLite adapters own durable local reads and writes. Save deliberately at meaningful checkpoints or batched intervals.
- Keep balance values named, centralized, and easy to tune. Do not hide tunable values in UI components.
- Do not add compatibility layers, legacy data shapes, or backend infrastructure unless the task explicitly requires them.

## Mobile-First Experience

- Design the portrait-phone interaction first; add tablet or larger-screen layouts intentionally.
- Use touch-friendly controls with visible feedback. Do not require hover, right-click, or mouse-only interaction.
- Respect safe areas, keyboard movement, text scaling, accessibility labels, readable contrast, and reduced-motion preferences.
- Keep repeated tapping efficient: avoid unnecessary rerenders, allocations, animations, network calls, and persistence writes.
- Make background/resume behavior and elapsed-time catch-up explicit before implementing them.

## Development and Validation

The primary native preview is a physical Android device running Expo Go. Expo Fast Refresh should update ordinary TypeScript and UI edits quickly. Expo web may be used for browser DevTools and fast layout inspection, but it is a development aid only. The emulator is optional; physical-device checks are the preferred truth for native behavior.

Use the smallest useful verification for each change:

- Documentation-only changes: review links and stale terminology; run `git diff --check` before handoff.
- Gameplay changes: add or update focused tests for player-visible behavior, formulas, and tick order.
- UI changes: inspect the narrow physical-device layout and the affected interaction path; use the emulator only when available.
- Cross-cutting or release-style work: run the relevant full test/build checks once at the integration gate.

Do not start a development server, create a release build, or commit changes unless the task or user explicitly calls for it.

## Documentation

- `docs/WorkingDocs/CONTEXT.md` — canonical Industri Clicker terminology.
- `docs/WorkingDocs/design.md` — durable game and product direction.
- `docs/WorkingDocs/PROJECT_INFO.md` — verified repository map, commands, and implementation status.
- `docs/WorkingDocs/gameflow.md` — mechanics, tick order, formulas, state ownership, and persistence flow.
- `VariableRelationshipMap.md` — variable ownership, dependencies, commands, and persistence relationships.
- `docs/WorkingDocs/versionlog.md` — change history after commits exist.
- `skills/mobilegamedev-gram/SKILL.md` — repository router and agent conventions.


