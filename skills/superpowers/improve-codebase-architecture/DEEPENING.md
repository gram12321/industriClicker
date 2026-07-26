# Focused Architecture Changes

Use this reference only during an explicitly requested architecture review.

## Safe Candidates

| Candidate | Useful outcome | Guardrail |
|---|---|---|
| UI-owned calculation | Move a deterministic rule into pure TypeScript | Keep UI responsible for input and rendering only. |
| Duplicated formula | Create one named game-rule function or balance value | Do not create a generic framework around one use. |
| Derived state stored twice | Derive it through a selector or view-model helper | Preserve a clear runtime source of truth. |
| SQLite calls in UI/state logic | Move them to a narrow persistence adapter | Define the deliberate save and restore boundary. |
| Large mixed-responsibility module | Split by real UI, rule, state, or persistence ownership | Do not split merely by line count. |

## External Boundaries

- Expo SQLite is a local persistence boundary. Keep it behind a focused adapter and test game rules without it.
- Android/device APIs are external boundaries. Isolate them only when their behavior must be substituted or tested separately.
- Supabase is not a current boundary. Do not design adapters, schemas, or sync layers for it unless the user approves a cloud feature.

## Review Question

For each proposed change, explain the current friction, smallest affected files, intended ownership, player or maintenance benefit, risk, and focused verification. Wait for the user's direction before a broad refactor.
