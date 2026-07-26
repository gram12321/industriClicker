# Documentation Maintenance Prompt

Use this guide when updating Industri Clicker documentation.

## Documentation Roles

| File | Role |
|---|---|
| `readme.md` | Project overview, locked stack, and entry points. |
| `CONTEXT.md` | Stable domain vocabulary and naming policy. |
| `design.md` | Durable game direction and product decisions. |
| `gameflow.md` | Mechanics, tick order, state, and persistence flow. |
| `../../VariableRelationshipMap.md` | Variable ownership, dependencies, commands, and persistence relationships. |
| `PROJECT_INFO.md` | Verified layout, commands, and implementation map. |
| `AIDescriptions_coregame.md` | Current verified systems and deferred areas. |
| `AI_AGENT_INSTRUCTIONS.md` | Agent boundaries and workflow. |
| `AIpromt_codecleaning.md` | Cleanup workflow. |
| `versionlog.md` | Commit-backed history. |

## Update Rules

- Keep README concise.
- Mark planned work as planned; do not inherit implementation claims from prior projects.
- Update the smallest document that owns the changed fact.
- Keep stack references aligned with Expo, React Native, TypeScript, Zustand, Expo SQLite, and deferred Supabase.
- Remove stale names rather than documenting compatibility aliases.

## Verification

Review links, terminology, and implementation claims. For documentation-only work, run `git diff --check` before handoff.
