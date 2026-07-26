---
name: verification-before-completion
description: Use before reporting an Industri Clicker code, mechanics, UI, documentation, or branch task as complete when fresh evidence is needed.
---

# Verification Before Completion

Make completion claims proportionate to fresh evidence. Choose the smallest check that proves the change; never claim checks that were not run.

## Choose Evidence By Change

| Change | Minimum useful evidence |
|---|---|
| Documentation only | Read changed links and terminology; run `git diff --check`. |
| Pure game rule or tick logic | Focused unit tests covering changed behavior and boundary cases. |
| Zustand or SQLite persistence | Focused state/persistence test or a documented manual restore path once the scaffold exists. |
| React Native UI | Narrow Android-emulator layout and affected touch interaction; physical Android check at meaningful checkpoints. |
| Expo configuration or release work | The exact relevant Expo/build command after confirming it exists. |
| Branch or pull-request work | Review the actual diff and user-requested verification. |

## Workflow

1. State what changed and what it could break.
2. Run the focused check that exists in the repository or explain why it cannot run yet.
3. Read the full result and report pass, fail, or gap accurately.
4. Do not substitute a browser/PWA check for native Android validation.

## Constraints

- Do not assume `npm test`, a typecheck script, a build command, or an Expo project exists before scaffolding.
- Do not run broad checks, start a server, create a build, commit, push, or open a pull request unless the task or user authorizes it.
- Do not call a task complete when required verification is unavailable; state the remaining gap instead.
