# Supabase Best Practices

## Structure

```text
best-practices/supabase-best-practices/
  SKILL.md             # Agent-facing instructions
  README.md            # This package guide
  AGENTS.md            # Lightweight navigation for agents
  agents/openai.yaml   # Display metadata
  references/          # Detailed Supabase/Postgres reference files
    _sections.md       # Category ordering and impact definitions
    _template.md       # Reference authoring template
    _contributing.md   # Writing guidelines
    *.md               # Detailed rules with incorrect/correct SQL
```

## Role In This Project

Use this skill only after `../../mobilegamedev-gram/SKILL.md` establishes that the user has approved a concrete cloud requirement. It then applies Supabase/Postgres guidance to the approved cloud boundary; it does not apply to normal local saves or game progression.

## Rule Categories

| Prefix | Category |
|---|---|
| `query-` | Query performance |
| `conn-` | Connection management |
| `security-` | Security and RLS |
| `schema-` | Schema design |
| `lock-` | Concurrency and locking |
| `data-` | Data access patterns |
| `monitor-` | Monitoring and diagnostics |
| `advanced-` | Advanced features |

## Maintenance Notes

1. Keep `SKILL.md` concise and repo-aware.
2. Keep detailed SQL examples in `references/`.
3. When adding a reference, copy `references/_template.md` to `references/<prefix>-<name>.md`.
4. Use impact levels from `references/_sections.md`.
5. Keep `README.md` and `AGENTS.md` as navigation files, not duplicated rule bodies.
6. Keep the references conditional on approved Supabase work and adapt repo-specific workflow in `SKILL.md`.

## Original References

Core reference sources remain:

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
