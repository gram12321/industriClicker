# JS and TS Best Practices

## Structure

```text
best-practices/js-ts-best-practices/
  SKILL.md             # Agent-facing instructions
  README.md            # This package guide
  AGENTS.md            # Lightweight navigation for agents
  agents/openai.yaml   # Display metadata
```

## Role In This Project

Use this skill for implementation mechanics after `../../mobilegamedev-gram/SKILL.md` has established repo boundaries. It complements `../supabase-best-practices/SKILL.md` only when an approved backend task requires Supabase/Postgres work.

## Maintenance Notes

- Keep `SKILL.md` concise and behavior-focused.
- Add heavier examples or deterministic helpers as separate files only when they become reusable.
- Keep examples aligned with the current stack: Expo, React Native, TypeScript, Zustand, Expo SQLite, and deferred Supabase.
- Do not duplicate full Supabase rules here; link to that skill only for approved backend work.
