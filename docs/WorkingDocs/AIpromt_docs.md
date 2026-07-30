# Documentation Maintenance Prompt

Use this guide when updating the canonical Industri Clicker working documents.

## Documentation Boundaries

| File | Owns | Does not own |
|---|---|---|
| `CONTEXT.md` | Stable domain vocabulary and naming policy. | Product decisions, formulas, implementation status, or repository details. |
| `design.md` | Durable player-facing direction, decisions, and deferred product scope. | Exact formulas, tick order, persistence mechanics, or verified code facts. |
| `gameflow.md` | System mechanics, formulas, commands at flow level, tick order, state ownership, and save boundaries. | The full variable register or repository status. |
| `VariableRelationshipMap.md` | Concrete variables, dependencies, command effects, time effects, and persistence mappings. | Player-facing rationale or general repository information. |
| `PROJECT_INFO.md` | Verified repository layout, commands, routes, stack, and implementation status. | Design authority or detailed mechanics. |
| `readme.md` | Short project overview, setup, and documentation entry points. | Working-document detail. |

Supporting documents such as `AIDescriptions_coregame.md`, `AIpromt_codecleaning.md`, and `versionlog.md` keep their own narrower roles; do not copy their content into these six documents.

## Update Rules

- Update the smallest document that owns the changed fact.
- If one decision affects several documents, record the player-facing decision in `design.md`, the system rule in `gameflow.md`, concrete dependencies in `VariableRelationshipMap.md`, and verified implementation facts in `PROJECT_INFO.md`.
- Add canonical terms to `CONTEXT.md` only when their meaning is stable and needed across documents or code.
- Keep planned, deferred, and implemented claims distinct. `PROJECT_INFO.md` may call something implemented only when the repository supports that claim.
- Use repository-relative links that resolve from the document containing them.
- Remove stale names and obsolete claims instead of documenting compatibility aliases.
- Do not repeat a complete mechanic in more than one document: link to the owning document and keep only the context needed to use the link.

## Verification

For documentation-only changes, review links, terminology, and status claims, then run `git diff --check` before handoff.
