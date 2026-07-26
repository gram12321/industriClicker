---
name: finishing-a-development-branch
description: Use only when the user explicitly asks to inspect, merge, push, create a pull request for, or discard a development branch.
---

# Finishing A Development Branch

Git integration is user-controlled. Inspect first, state the available action and its impact, then perform only the action the user explicitly approves.

## Workflow

1. Inspect the current branch, worktree state, uncommitted changes, target branch, and relevant verification status with read-only Git commands.
2. Run the smallest relevant verification available for the changed code; do not assume `npm test` exists before the Expo scaffold exists.
3. State the exact requested action and its effect: keep, commit, merge, push, open a pull request, or discard.
4. Require an explicit user instruction before any state-changing Git operation.
5. Before discarding or deleting a branch/worktree, list exact targets and require a clear confirmation after the list.

## Constraints

- Never run `git pull`, merge, push, create a pull request, delete a branch, remove a worktree, or discard changes by default.
- Do not force-push or force-delete unless the user explicitly names that action after seeing the target.
- Do not remove a worktree that the current environment may own.
- Report the actual Git state and verification evidence; do not claim merge or release readiness without it.
