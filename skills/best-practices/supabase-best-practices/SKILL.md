---
name: supabase-best-practices
description: Use only after Industri Clicker explicitly adopts Supabase for an approved cloud feature, such as backup, cross-device sync, accounts, or server-owned data.
---

# Supabase Best Practices

Supabase is deferred for Industri Clicker. This skill applies only after the user approves a concrete cloud requirement; local single-player saves belong in Expo SQLite.

## Use When

- Designing approved Supabase/Postgres tables, queries, indexes, RLS, migrations, or synchronization.
- Implementing a cloud backup, cross-device sync, account, or server-owned feature.
- Diagnosing approved Supabase query, locking, RLS, or performance work.

## Do Not Use When

- Working on local single-player state, saves, or normal game progression.
- Introducing a backend merely for convenience or speculative future needs.

## Rules

- Keep Supabase access in dedicated adapters; UI components and pure game logic do not call it directly.
- Keep local gameplay responsive and authoritative while offline. Define sync ownership, conflict behavior, and failure handling before implementing cloud writes.
- Use explicit player/save/profile ownership only if the approved feature requires identity. Do not inherit company-scoping terminology or old schemas.
- Use migrations, constraints, indexes, prepared/parameterized queries, least privilege, and RLS when they apply.
- Keep SQL examples and detailed Postgres guidance in `references/`; consult the smallest relevant reference file.

## Workflow

1. Confirm the approved cloud requirement and identify what must remain local.
2. Define data ownership, sync direction, conflict behavior, and offline failure behavior.
3. Implement the narrow adapter, schema/migration, and RLS/query path required.
4. Keep engine and UI contracts independent of Supabase implementation details.
5. Verify the focused behavior, security boundaries, and query plan when performance changes.
