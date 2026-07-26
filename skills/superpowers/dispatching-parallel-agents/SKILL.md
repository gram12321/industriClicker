---
name: dispatching-parallel-agents
description: Use only when the user explicitly requests parallel or delegated work and two or more independent development, research, documentation, or design tasks can proceed without shared files or sequential dependencies.
---

# Dispatching Parallel Agents

Use parallel agents to shorten independent development or research work. The primary agent remains responsible for decomposition, integration, verification, and the final result.

## When To Use

Use this workflow only when the user explicitly asks for delegation, parallel work, or multiple agents, and all of these are true:

- At least two tasks are genuinely independent.
- Each task has a bounded goal and a clear output.
- Each implementation task has exclusive file ownership.
- No task needs another task's result before it can begin.

Good candidates:

- Independent research on Expo, React Native Paper, SQLite, or Supabase options.
- Separate read-only audits of unrelated documentation or subsystems.
- Independent design proposals for distinct game systems.
- Implementation slices with non-overlapping files after interfaces and ownership are already defined.

## Do Not Use

- Requirements, interfaces, terminology, or architecture are still being decided.
- Tasks edit the same files, database schema, router, shared types, or package configuration.
- One task's result determines another task's implementation.
- The work is small enough for one agent to finish faster than coordination would.
- The user has not requested parallel or delegated work.

## Workflow

1. Split the work into independent outcomes, not arbitrary file groups.
2. State file ownership, interfaces, constraints, and expected output for each agent.
3. Give research agents read-only scopes and ask for evidence, trade-offs, and a recommendation.
4. Give implementation agents exclusive files and prohibit unrelated refactors, commits, package changes, and edits outside their scope.
5. Run the agents concurrently only after verifying that their scopes do not overlap.
6. Review every result, reconcile conclusions or contracts, inspect the combined diff, and run the smallest relevant integration verification.

## Agent Prompt Template

```text
Goal: <one independent development or research outcome>

Scope:
- Own/read only: <exact files, directories, or sources>
- Do not touch: <shared files and out-of-scope areas>

Context:
- <relevant project decision or interface>

Output:
- <research findings, proposed design, or implemented change summary>
- <verification performed and result>

Constraints:
- Do not commit or change package configuration.
- Do not make unrelated refactors.
```

## Integration Rules

- The primary agent alone changes shared contracts, resolves disagreement, and combines overlapping conclusions.
- Treat research findings as input, not as an approved decision.
- Re-run verification after integration; parallel agents cannot verify the combined result independently.
- Report each delegated scope and any unresolved conflict to the user.

## Example

For an explicitly requested research pass, delegate one agent to evaluate Expo SQLite save patterns and another to evaluate React Native Paper component coverage. Both return evidence and recommendations; the primary agent makes the stack or architecture decision afterward.

For implementation, delegate a documented game-economy module and a separate read-only documentation audit only when they share no files or contracts.
