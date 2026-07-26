# Supabase Best Practices

Read `SKILL.md` first. This directory contains Supabase/Postgres performance, schema, security, and data-access guidance adapted to the project database layer.

## Quick Navigation

| Task | Use |
|---|---|
| Agent-facing workflow and repo boundaries | `SKILL.md` |
| Category order and impact levels | `references/_sections.md` |
| New reference template | `references/_template.md` |
| Reference writing guidance | `references/_contributing.md` |
| Missing or poor indexes | `references/query-missing-indexes.md`, `references/query-composite-indexes.md`, `references/query-partial-indexes.md` |
| Foreign keys, constraints, identifiers, data types | `references/schema-*.md` |
| RLS and privileges | `references/security-*.md` |
| N+1 queries, batching, pagination, upsert | `references/data-*.md` |
| Locking and transactions | `references/lock-*.md` |
| Explain plans, statistics, vacuum/analyze | `references/monitor-*.md` |
| JSONB and full-text search | `references/advanced-*.md` |

## Current Repo Bias

Supabase is deferred. When approved, keep cloud access in dedicated adapters, keep game logic/UI independent from it, and define explicit player/save ownership rather than importing prior-project terminology.
