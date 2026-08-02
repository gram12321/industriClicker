# Local Player, Company, And Onboarding Plan

Build a device-local player and company selection system before adding cloud accounts. It supports several companies and several local player profiles on one device, while keeping every company's progress isolated. The player-facing screen may say **Log in**, but it is local profile selection rather than authentication: no password, security guarantee, cross-device access, or online account is implied.

Use the ownership and lifecycle boundaries from Winemaker04 and the onboarding/UI ideas from Simulus as references. Do not copy their web UI, Firebase/Supabase code, storage keys, desktop layouts, or company-name-as-identity behaviour.

## Product outcome

```text
Local player profile
  -> owns one or more companies
      -> has one isolated GameSnapshot
      -> has company tutorial state and starting condition

Device session
  -> remembers the selected local player and active company

```

The app opens either the local welcome/selection flow or the saved active company. Logging out returns to selection and preserves every local profile and company. Resetting resets only the active company's progress. Deleting a company is a separate, later destructive action.

## Research direction

| Reference | Reuse | Do not reuse |
|---|---|---|
| Simulus | Welcome guide, company-selection cards, optional player profile, per-company tutorial/settings concepts, README/version-log dialogs. | Web/Tailwind layout, Firebase/highscore implementation, global-market assumptions, names used as identity, first-company autologin. |
| Winemaker04 | Explicit player and company records, active-company lifecycle, company-scoped preferences, typed starting conditions, feature-facing domain types. | Supabase session/authentication, database schema/migrations, desktop-wide starting-condition modal, wine-specific content. |
| Tradergame04 | Persisted active-company selection and basic local-profile flow. | Treating a company-name list on a player record as the company source of truth. |

The visual references in the approved screenshots are direction only. Industri Clicker remains an Expo/React Native/React Native Paper Android app; the portrait-phone flow must not recreate desktop-width panels, tiny tables, hover interactions, or a decorative character-image dependency.

## Current integration points

| Current area | Required change |
|---|---|
| `game/company/companyDatabase.ts` | Own company-keyed snapshots plus local player, company, session, and tutorial SQLite CRUD. The previous one-row save is deliberately discarded; do not add a compatibility layer. |
| `app/_layout.tsx` | Make boot, batch saving, foreground-time processing, and app-background flush operate only for the active company. |
| `game/core/stores/gameStore.ts` | Continue to own only runtime progress. It restores/reset snapshots supplied by the active-company lifecycle; it does not own player/company records. |
| `app/index.tsx` | Replace the inert logout action with local-session logout; route Profile, Settings, and Leaderboard through their respective screens. |
| `LoginView.tsx`, `ProfileScreen.tsx`, and `CompanyView.tsx` | Provide local selection and company-management entry points using the screen/view naming convention. |

## Data ownership and validation

Persist current-version, local-only records in Expo SQLite:

| Record | Scope | Required v1 fields |
|---|---|---|
| Local profile | Player | Stable ID, display name, created/updated timestamps. |
| Company record | Company | Stable ID, owner profile ID, display name, starting-condition ID, created/updated timestamps. |
| Company save | Company | Company ID, validated `GameSnapshot` JSON, updated timestamp. |
| Company tutorial state | Company | Company ID, completed welcome/tutorial step IDs or a current intro version. |
| Device session | Device | Selected profile ID and active company ID, each nullable. |

- IDs, not display names, are relationships and SQLite keys. A company name may be unique within its owner for selection clarity; it must never be globally unique or used as a save key.
- Validate public create/update inputs before persistence: trimmed non-empty names, a bounded visible length, valid owner/company relation, known starting-condition ID, and valid snapshots.
- Do not expose raw SQLite rows beyond their owning `*Database.ts` module. Domain services return typed local profile, company, tutorial, and session values.
- Do not create a speculative generic backend repository layer. Centralising typed local persistence and company-session orchestration is sufficient preparation for a later cloud adapter.
- A local owner relation is organisation, not security. Global accounts, password handling, remote score validation, backups, and cross-device sync stay deferred.

## Active-company lifecycle

Company switching is a persistence boundary, not merely a UI state change:

1. Disable company-changing interactions and flush the outgoing company's current snapshot under its outgoing company ID.
2. Cancel or await any queued batch save so it cannot later write under the new company ID.
3. Load the requested company's valid snapshot, or initialise its approved starting snapshot.
4. Restore Zustand from that snapshot, set the persisted device session, and reset the realtime observation anchor.
5. Re-enable interaction and ensure subsequent store subscriptions save only to the new active company.

Creation should write the profile/company metadata and its starting snapshot as one deliberate local operation before activation. On failure, do not leave a selectable half-created company.

The existing reset card becomes **Reset this company**: it deletes/recreates only the active company save, then restores starting state while retaining its name, owner, selected start, tutorial state, and other companies. A future **Delete company** action must remove that company record and snapshot only after a stronger confirmation.

## Mobile-first UI direction

### Welcome, local login, and company selection

Adapt Simulus's welcoming selection experience to one vertical, scrollable phone surface:

- A calm Industri Clicker welcome header and concise explanation that data remains on this device.
- A guide/mentor placeholder card, using an icon or code-defined avatar rather than imported character art. It gives short contextual help and links into the first tutorial step.
- Local-player selector with create-profile action.
- Large company cards showing company name, a compact progress summary, and last played time. Cards are full-width touch targets, not desktop table rows.
- `Create company` as the primary action. Company switching is explicit; do not automatically choose the first company.
- A compact local-device leaderboard placeholder or summary is allowed, labelled clearly as **This device**. A global leaderboard remains a future online feature.
- README and version-log actions open accessible React Native Paper dialogs or full-screen route views. Render project-owned document content deliberately; do not embed browser-only Markdown/HTML UI or external links as a required flow.

### Starting-condition template

Use the information hierarchy of Winemaker04's starting-condition screen, but make v1 intentionally small:

- At company creation, show a `Standard start` card as the only selectable condition.
- Show a readable preview of its initial company facts: opening funds and the existing initial gameplay state. Do not invent staff, loans, resources, images, or a country system.
- Persist `standard` as a named starting-condition ID from a company-owned constants module.
- Leave the layout ready for future condition cards and a selected-condition detail panel, but do not build unapproved options or a wide multi-column desktop modal.

### Tutorial-guide placeholder

Borrow the Simulus tutorial rhythm, not its assets:

- A React Native Paper `Portal` + `Dialog` (or focused full-screen mobile sheet if content needs more room) dims the current view.
- It contains a guide avatar/icon, title, `Step n of m`, short copy, Previous/Next/Skip controls, and an explicit close affordance.
- The first implementation needs only a welcome/setup step and one company-dashboard step. It persists completion per company and is safe to reopen from Settings.
- Do not implement DOM element highlighting until native anchoring and accessibility behaviour are explicitly designed. The placeholder must never block the core game permanently.

## Profiles, settings, leaderboards, and future gates

| Surface | v1 responsibility | Later connection |
|---|---|---|
| Profile | Show selected local player, active company, company portfolio, switching/creation entry point, and company reset. | Profile editing, company deletion, account/cloud migration. |
| Settings | Tutorial replay, local-data explanation, and logout. | Notifications, accessibility preferences, theme selection, backup/sync controls. |
| Leaderboard | Clearly labelled device-local placeholder or no-result state; never describe it as global. | Server-owned score submission, validation, ranking, and global views. |
| Starting conditions | Persist and preview only `standard`. | Additional balanced starts and previews. |
| Achievement/prestige gates | None introduced here. | Gates accept explicit company IDs and evaluate that company's snapshot only. |

Achievements, production statistics, prestige, and future research gates already belong inside `GameSnapshot`; company-keyed saves naturally isolate them once the active-company lifecycle is in place. No gate may read a previous company's cached state.

## Implementation sequence

1. Define the player/company/session domain types, `standard` starting-condition constant, pure validation, and local SQLite `*Database.ts` boundaries.
2. Replace singleton snapshot persistence with company-keyed saves and a queued active-company lifecycle; cover load, create, switch, background flush, reset, and invalid snapshot cases.
3. Add the bootstrap gate so no game clock or game-save subscription runs before an active company exists.
4. Implement the mobile welcome/profile/company-selection flow and company-creation setup template.
5. Wire Profile, Settings, real local logout, tutorial replay, and reset-this-company behaviour.
6. Add the compact guide tutorial placeholder and documentation dialogs/routes for the project README and version log.
7. Add the device-local leaderboard placeholder, with no global claims or score persistence that would constrain the future server design.
8. Update `CONTEXT.md`, `design.md`, `PROJECT_INFO.md`, `gameflow.md`, and `VariableRelationshipMap.md` after implementation decisions are verified.

## Verification focus

- New profile/company creation persists distinct metadata and snapshots.
- Switching A -> B -> A never leaks runtime state, queued saves, achievements, prestige, or tutorial completion between companies.
- Logout clears only the device session; profiles and companies remain selectable.
- Reset affects only the active company's progress and preserves its record.
- A malformed snapshot starts only that company fresh and leaves other companies untouched.
- Portrait-phone selection, setup, dialogs, and tutorial controls remain reachable with text scaling and keyboard input.
- README/version-log presentation handles long content with native scrolling and dismiss controls.
- Use focused tests/type checks available at implementation time; do not start a development server or run broad verification until the implementation scope justifies it.

## Explicitly deferred

- Supabase, Google/third-party authentication, passwords, remote accounts, backups, and cross-device sync.
- Global leaderboards and authoritative anti-tamper score validation.
- Additional starting conditions, country/family content, loans, staff, or bespoke visual art.
- Achievement/prestige/research gate consumption beyond explicit future company-scoped interfaces.
