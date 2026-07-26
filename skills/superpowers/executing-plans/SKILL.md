---
name: executing-plans
description: Use when the user has approved a written Industri Clicker implementation plan and wants it executed in order.
---

# Executing Plans

Execute an approved plan without expanding its scope or taking ownership of Git workflow.

## Workflow

1. Read the plan, the relevant working documents, and the current affected files.
2. Identify a material gap, an outdated stack assumption, or a missing user decision before editing; ask the user rather than guessing.
3. Complete one planned slice at a time, preserving the React Native UI, pure game logic, Zustand state, and Expo SQLite adapter boundaries.
4. Use focused verification appropriate to the slice. Do not invent commands before the Expo scaffold exists.
5. Report completed work, verification actually run, and any remaining plan items.

## Constraints

- Do not automatically create a branch, worktree, commit, pull request, or merge.
- Do not dispatch agents unless the user explicitly requests parallel work and `../dispatching-parallel-agents/SKILL.md` applies.
- If a plan changes game direction, persistence shape, cloud scope, package choice, or a large architecture boundary, return to the user for approval.
- Use `../finishing-a-development-branch/SKILL.md` only when the user explicitly asks to finish a branch or choose an integration action.
