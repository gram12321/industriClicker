# Industri Clicker Code Review Template

Use this format for a self-review or an explicitly requested independent review.

```md
## Review Scope

- Target: <working tree, commit range, branch, pull request, or plan>
- Requirements reviewed: <paths or user request>
- Verification reviewed: <commands/output, or gaps>

## Findings

### Critical

- `path:line` — <evidence, player/technical impact, and required correction>

### Important

- `path:line` — <evidence, impact, and correction>

### Minor

- `path:line` — <evidence and optional improvement>

## Verification Gaps

- <what was not verified and why>

## Assessment

<Whether the reviewed target meets the stated requirements, plus any conditions.>
```

Review the native mobile boundaries: UI versus game logic, Zustand runtime state, Expo SQLite persistence, deterministic tick/catch-up rules, touch interaction, and documentation accuracy. Do not infer a defect from archived predecessor material.
