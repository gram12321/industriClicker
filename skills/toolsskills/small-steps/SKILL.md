---
name: small-steps
description: Use when the user wants minimal changes, low-scope implementation, small safe steps, terse feedback, or asks to avoid broad plans, design docs, refactors, schemas, migrations, or new abstractions.
---

# Small Steps

## Purpose

Make the smallest useful change that satisfies the user's request. Prefer direct implementation, minimal feedback, and explicit permission before broadening scope.

This pairs well with `../caveman/SKILL.md` when the user also wants compressed responses.

## Use When

- The user asks for "small steps", "minimal change", "keep it simple", "no big refactor", or similar.
- The requested work can be fulfilled without new architecture, new schemas, broad plans, or design docs.
- The repo is early-stage and the safest progress is a narrow edit.
- The user wants concise status updates and low ceremony.

## Do Not Use When

- The user explicitly asks for brainstorming, architecture review, a design doc, or an implementation plan.
- The task is unsafe to change without deeper diagnosis.
- The change is inherently large and cannot be reduced to a narrow slice.

## Core Rules

- Minimum implementation first.
- Advise the user toward the smallest change that completes the request.
- Ask before major changes.
- No plans or design docs while using this skill.
- No DB schemas, migrations, or persisted data-shape changes without user permission.
- Keep user feedback minimal: short status updates, blockers, and final result only.
- Do not bundle opportunistic cleanup, refactors, renames, formatting churn, or "while here" improvements.

## Scope Gate

Before editing, identify the smallest file set and behavior surface that can satisfy the request.

If the minimum implementation appears to require any of these, stop and ask permission before implementing:

- New database schema, migration, table, column, RLS policy, or seed data.
- New dependency, framework, build tool, or generated project structure.
- Broad refactor across unrelated modules.
- Several new types, interfaces, classes, or abstractions.
- A design document, implementation plan, PRD, ADR, or issue breakdown.

When asking, give the minimum viable suggestion:

```text
This needs <major change> to satisfy the request. Minimum path: <one sentence>. Proceed?
```

## Types And Abstractions

Minimize new types, interfaces, classes, and abstractions.

Allowed:

- Extending an existing type when the changed behavior needs it.
- Adding one narrow local type if it makes the implementation safer and smaller.
- Extracting a helper only when it reduces real duplication in the touched code.

Ask first when:

- More than one new exported type/interface/class is needed.
- A new abstraction would become part of the shared public module surface.
- The implementation starts needing a new domain model instead of a direct behavior change.

## Work Loop

1. Restate the smallest intended change internally.
2. Read only the files needed to make that change safely.
3. Edit only the files needed for the requested behavior.
4. Reuse existing functions, types, folders, constants, and patterns.
5. Run the smallest relevant verification when finishing.
6. Final response: what changed, where, verification status.

## Feedback Style

- Keep progress updates to one or two short sentences.
- Do not narrate obvious steps.
- Do not produce long alternatives unless permission is needed.
- Prefer "I found X; changing Y" over broad planning language.
- If combined with Caveman, use Caveman's compressed style for wording while preserving this skill's scope rules.

## Red Flags

Stop and narrow scope if you are about to say:

- "While I am here..."
- "This would be a good time to refactor..."
- "I will create a plan/doc first..."
- "I need to add a new schema/migration..."
- "Let's introduce an abstraction..."
- "This simple request should become a larger cleanup..."

All of these mean: return to the user's request, find the minimum implementation, or ask permission.

## Verification

Use the smallest useful check for the change. For documentation-only edits, targeted searches or file reads are enough. For code behavior, prefer focused tests over full-suite runs unless the risk justifies more.
