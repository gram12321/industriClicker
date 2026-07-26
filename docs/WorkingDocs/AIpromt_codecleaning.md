# Code Cleanup and Optimization Prompt

Canonical location: `docs/WorkingDocs/AIpromt_codecleaning.md`

Use this guide when asking an AI coding agent to clean up or refactor the project. The goal is to improve structure without changing game behavior.

## Cleanup Targets

- **Illogical code placement**: move functions, services, types, or constants to the domain where they belong.
- **Duplicate code**: consolidate repeated logic behind a shared helper, service, hook, or component.
- **Dead code**: remove unused imports, unused files, obsolete placeholders, and unreachable branches.
- **Redundant abstractions**: remove wrappers that do not clarify ownership or reduce complexity.
- **Inefficient code**: reduce unnecessary recalculation, repeated persistence calls, expensive renders, or poor algorithms.
- **Excessive comments**: remove comments that restate the code. Keep comments that explain business rules, formulas, tradeoffs, or non-obvious technical constraints.

## Areas to Review

- **Engine/services**: domain rules, calculations, tick logic, and side effects.
- **State/stores**: persistence boundaries, selectors, derived state, and update actions.
- **Hooks**: repeated loading, formatting, subscription, or state orchestration patterns.
- **Components/UI**: duplicated layouts, overly large components, and business logic in presentation code.
- **Types**: overlapping interfaces, unclear domain contracts, and duplicated literal unions.
- **Constants/data**: magic numbers, unused balance values, and scattered tuning data.
- **Tests**: missing coverage around changed mechanics or cleanup-sensitive behavior.

## Cleanup Goals

- Improve readability and naming.
- Keep game rules outside UI components.
- Make formulas and balance values easy to inspect and tune.
- Reduce duplication without inventing broad abstractions too early.
- Preserve behavior unless the task explicitly includes a behavior change.
- Keep changes small enough to review.

## Cleanup Process

1. Read the relevant docs and current code before changing anything.
2. Identify concrete cleanup issues with file references.
3. Separate safe mechanical cleanup from behavior-risking refactors.
4. Make the smallest useful change.
5. Run the relevant tests.
6. Add or update tests if behavior could regress.
7. Update docs only when structure, commands, or conventions changed.
8. If documentation paths move, update `readme.md`, `docs/WorkingDocs/PROJECT_INFO.md`, agent instructions, and any compatibility aliases together.

## Import and Export Preferences

Use these only when they match the project's current structure:

- Prefer barrel exports for stable public module boundaries.
- Keep imports readable and consistent.
- Avoid deep imports into another domain's private files.
- Do not add barrel files just for style unless they reduce real friction.

## Agent Instruction Template

When requesting cleanup, include:

- The files or subsystem to review.
- Whether behavior changes are allowed.
- Which tests to run.
- Any known risky areas.
- Whether documentation should be updated.
