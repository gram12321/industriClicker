---
name: systematic-debugging
description: Use as the default Industri Clicker debugging workflow for bugs, test failures, regressions, build failures, and unexpected Android or game-state behavior.
---

# Systematic Debugging

Find evidence for the root cause before changing behavior. A narrow fix is only safe when the failing path and responsible owner are understood.

## Workflow

1. **Reproduce:** capture the player action or system event, current state, time/background conditions, expected result, actual result, and error output.
2. **Inspect ownership:** trace the path through React Native UI, command, pure game logic, Zustand state, and Expo SQLite only as relevant. Review recent local changes and existing working examples.
3. **Form one falsifiable hypothesis:** state what evidence would confirm or reject it. Change or instrument one variable at a time.
4. **Test the cause:** use the smallest focused test, fixture, emulator path, or log needed to distinguish the hypothesis.
5. **Fix and protect:** create a regression test when a real seam exists, make the smallest root-cause fix, rerun the original reproduction, and remove temporary instrumentation.

## Project Checks

- For game bugs, inspect deterministic formulas, rounding, caps, command validation, tick ordering, and elapsed-time catch-up.
- For repeated-tap or UI bugs, inspect render frequency, command de-duplication, selector behavior, and touch feedback.
- For persistence bugs, inspect save boundaries, snapshot validity, restore behavior, and device-clock assumptions before changing SQLite code.
- For native UI bugs, verify the Android Emulator path; Expo web is only a development aid.

## Escalation

Use `../diagnose/SKILL.md` when the defect is intermittent, performance-heavy, or cannot be isolated with a normal focused loop. Ask the user before architectural changes, new dependencies, cloud changes, or broad refactors.

## Constraints

- Do not bundle speculative fixes or unrelated cleanup.
- Do not claim a bug is fixed until the original reproduction and focused verification provide evidence.
- Do not introduce a backend, schema, migration, or permanent instrumentation without approval.
