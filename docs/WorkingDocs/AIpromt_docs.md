# Documentation Maintenance Prompt

Use the ownership table in the root [readme.md](../../readme.md) as the boundary authority.

## Rules

- Update the smallest owning document; do not copy a mechanic into multiple files.
- Put cross-document variable, dependency, command, and persistence relationships only in [VariableRelationshipMap.md](VariableRelationshipMap.md).
- Keep planned, deferred, and implemented claims distinct; verify implemented claims against code.
- Use repository-relative links, remove obsolete names, and prefer links to repeated explanation.
- Keep [versionlog.md](versionlog.md) factual and append only reviewed, committed changes. Move complete old entries to [oldversionslog.md](oldversionslog.md) when the active log would exceed 300 lines.

## Verification

For docs-only work, check links, stale terminology, ownership boundaries, and run `git diff --check`.
