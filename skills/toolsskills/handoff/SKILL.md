---
name: handoff
description: Use when compacting the current conversation into a handoff document so another agent or future session can continue with the right context, artifacts, skills, and next steps.
argument-hint: "What will the next session be used for?"
---

# Handoff

## Purpose

Create a compact continuation document for a fresh agent. The handoff should preserve the state of the work without duplicating artifacts that already exist elsewhere.

## Use When

- The user asks for a handoff, continuation note, session summary, or context transfer.
- Work is paused and another agent or future session should resume it.
- The current conversation contains decisions, constraints, blockers, or partial progress that are not fully captured in files.

## Do Not Use When

- A short final response is enough.
- The needed context already exists in a plan, commit, diff, or doc.
- The user asks for a user-facing summary rather than an agent continuation document.

## Repo Fit

Default repo router: `../../mobilegamedev-gram/SKILL.md`.

Suggest relevant next-session skills when useful, especially `../../mobilegamedev-gram/SKILL.md`, `../writeskills-gram/SKILL.md`, or the applicable specialist skill.

## Workflow

1. Determine what the next session is meant to do. If the user passed arguments, treat them as that focus.
2. Write only the context needed to resume; reference existing artifacts by path instead of duplicating them.
3. Include verification status, blockers, and exact next steps.
4. Present the handoff in the response by default. Create `docs/WorkingDocs/handoffs/<topic>.md` only when the user requests a durable file.
5. Report the handoff location when a file was requested.

## Handoff Shape

Use this structure unless the request calls for something smaller:

```markdown
# Handoff: <topic>

## Goal
<what the next session should accomplish>

## Current State
<what has been done and where>

## Key Context
<decisions, constraints, repo conventions, relevant files>

## Suggested Skills
<skills the next session should use, if any>

## Verification
<commands run, results, and known gaps>

## Next Steps
<ordered continuation steps>
```
