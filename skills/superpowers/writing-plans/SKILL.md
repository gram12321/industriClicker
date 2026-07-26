---
name: writing-plans
description: Use when an approved Industri Clicker goal needs a written multi-step implementation plan before code changes.
---

# Writing Plans

Write a concrete plan only when the work is large, risky, cross-cutting, or the user explicitly requests one. Routine work uses the router's small-steps workflow instead.

## Before Writing

1. Read the approved goal and the smallest relevant context: `readme.md`, `CONTEXT.md`, `design.md`, `gameflow.md`, `PROJECT_INFO.md`, and current code where it exists.
2. Confirm that the plan uses the locked stack: Expo, React Native, TypeScript, Expo Router, React Native Paper, Zustand, and Expo SQLite; Supabase requires separate explicit approval.
3. List only real existing files and required new files. Do not invent `src/`, routes, package scripts, schemas, or test frameworks before the Expo project is scaffolded.

## Plan Shape

Use a short header with goal, scope, constraints, architecture, files, and verification. Then write ordered tasks that each contain:

- exact file targets;
- the intended behavior and ownership boundary;
- focused tests or manual Android-emulator verification where applicable;
- documentation updates when a durable decision changes.

Keep tasks small enough to review independently. Include commands only when the scaffold confirms they exist. Do not include a commit, branch, PR, worktree, subagent, migration, or cloud step unless the user has approved it.

## Storage And Handoff

Present the plan in the conversation by default. Save it only when the user asks for a durable plan; use `docs/WorkingDocs/plans/YYYY-MM-DD-<topic>.md` unless the user names another location.

Review the plan against the approved goal for missing requirements, ambiguity, stack conflicts, and unowned persistence or time behavior before presenting it.
