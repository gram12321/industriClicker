# Winemaker Copilot instructions

The canonical repository instructions are in the root `readme.md`; use `skills/winemaker-game/SKILL.md` for routing. This file exists as an adapter for tools that discover Copilot instructions here.

- The human owns git commits; do not commit.
- Do not start `npm run dev` unless explicitly asked.
- Follow the README Validation Policy: focused checks during implementation, no tests/builds for documentation-only work, and one full suite/build at the integration gate.
- Keep business rules in services/features, Supabase CRUD and mapping in `src/lib/database/`, and React focused on presentation.
- Use current feature facades and shared types. Do not add compatibility wrappers, aliases, backfills, or legacy schema support unless explicitly requested.
