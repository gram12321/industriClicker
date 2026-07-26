---
name: requesting-code-review
description: Use when the user explicitly requests a review of an Industri Clicker change, feature slice, branch, pull request, or implementation plan.
---

# Requesting Code Review

Review the actual diff and requirements. This is an explicit quality workflow, not a mandatory subagent or merge gate.

## Workflow

1. Establish the review target: working tree, commit range, branch, pull request, or plan.
2. Read the relevant requirements and the actual changed files before reaching conclusions.
3. Check player-visible behavior, deterministic game rules, UI/game-state/persistence ownership, touch/mobile constraints, tests, and documentation claims.
4. Categorize findings as **Critical**, **Important**, or **Minor**. Every finding needs a file reference, evidence, impact, and a practical correction.
5. State any verification gaps separately from defects.

## Project Checks

- React Native UI must not own gameplay calculations or SQLite access.
- Game rules, time progression, and catch-up behavior must be deterministic and testable outside UI.
- Zustand is runtime state; Expo SQLite is deliberate local persistence. Supabase must not appear without an approved cloud requirement.
- Player-facing UI must remain portrait-phone and touch-first.
- Do not treat archived predecessor material as implementation evidence.

## Constraints

- Do not modify code, create a commit, push, open a pull request, or dispatch a reviewer agent unless the user separately asks.
- A second reviewer or parallel review is allowed only when the user explicitly requests delegation and scopes do not overlap.

Use `code-reviewer.md` as the review-output template.
