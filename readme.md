# Industri Clicker

Industri Clicker is a pre-alpha, single-player industrial clicker for native Android. It is mobile-first, local-first, deterministic, and built with code-defined UI rather than bespoke artwork.

## Direction

- Design portrait-phone interaction first; support touch, safe areas, text scaling, accessibility, and interrupted foreground play.
- Keep game rules, formulas, progression, and tick processing deterministic and testable outside React Native.
- Defer cloud services, accounts, offline catch-up, iOS, web release, and monetization until explicitly approved.
- Treat predecessor-project material as archive only; current docs and code define this project.

Verified stack and repository facts live in [PROJECT_INFO.md](docs/WorkingDocs/PROJECT_INFO.md).

## Setup

```bash
npm install
npm run start
```

Use Expo Go on a physical Android device. `npm run web` is for layout inspection and `npm run android` is an optional emulator shortcut. Android preview/build details live in [PROJECT_INFO.md](docs/WorkingDocs/PROJECT_INFO.md).

## Architecture

```text
React Native UI -> hooks/view models -> game commands/services -> Zustand -> SQLite adapters
```

- UI renders state and issues commands; it owns no rules, calculations, or database access.
- Pure `game/` modules own formulas, catalogues, validation, tick order, and derived values.
- Zustand owns active source-of-truth state. SQLite writes deliberate snapshots through domain-bounded `*Database.ts` adapters; there is no compatibility layer for obsolete saves.
- Put tunable domain values and deterministic catalogues in the owning `*Constants.ts` module. Keep shared theme tokens in `theme.ts` and screen styles beside their screens.
- Public barrels are `game/core/index.ts`, `game/index.ts`, and `ui/index.ts`; use leaf imports where a barrel would create a cycle.

## Validation

- Docs: review links and stale terminology, then run `git diff --check`.
- Code: use focused tests and `npm run typecheck`; run `npm test` and facility/recipe checks at cross-cutting or integration checkpoints. Focused Vitest execution is currently blocked by the repository's Windows `spawn EPERM` environment issue.
- Do not start servers, create builds, or commit unless the task explicitly requires it.

## Documentation

| Document | Owns | Keep out |
|---|---|---|
| `CONTEXT.md` | Stable shared names and short definitions. | Formulas, relationships, product decisions, repo status. |
| `design.md` | Durable player-facing direction and deferred decisions. | Exact formulas, tick/save mechanics, variable registers. |
| `gameflow.md` | Rules, formulas, tick order, state ownership, and save lifecycle. | Full variable/dependency register, repo map, player rationale. |
| `VariableRelationshipMap.md` | Variables, dependencies, commands, resource/facility relationships, and persistence mappings. | Player rationale, broad status, duplicate prose. |
| `PROJECT_INFO.md` | Verified stack, repo shape, routes, commands, release setup, and implementation status. | Design authority and detailed mechanics. |
| `AIDescriptions_coregame.md` | Compact agent orientation and links to the authorities above. | Authority for mechanics or implementation status. |
| `AIpromt_docs.md` | Documentation-maintenance workflow. | Project facts already owned by the documents above. |
| `AIpromt_codecleaning.md` | Behavior-preserving cleanup workflow. | Gameplay design and current implementation status. |
| `handoffs/economy-balance.md` | Economy-report interpretation, parity checks, and balance workflow. | Runtime rule authority and duplicated catalogues. |
| `versionlog.md` | Active reviewed history, limited to 300 lines. | Current rules; use `oldversionslog.md` for archived history. |
| `oldversionslog.md` | Historical version entries moved from the active log. | New entries and current implementation guidance. |

The README owns these boundaries. When a fact belongs in multiple documents, link to its owner instead of repeating it.
