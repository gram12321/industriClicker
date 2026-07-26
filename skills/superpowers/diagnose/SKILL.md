---
name: diagnose
description: Use for an intermittent, performance-heavy, or otherwise difficult Industri Clicker defect after baseline debugging has not isolated the cause.
---

# Diagnose

Use a repeatable feedback loop to isolate hard defects. Start with `../systematic-debugging/SKILL.md`; use this skill only when a deeper loop is needed.

## Build The Feedback Loop

Prefer the narrowest reliable signal:

1. A focused pure-TypeScript unit or integration test for a game rule, tick, catch-up calculation, selector, or persistence adapter.
2. A controlled fixture or replay of the affected game state.
3. Expo logs and a focused Android Emulator interaction path.
4. A physical Android-device reproduction at a meaningful checkpoint.
5. A small benchmark/profiler measurement for repeated taps, rerenders, SQLite writes, or tick performance.
6. `git bisect` only when a known commit range and automated feedback loop exist.

Do not use Expo web or browser DOM automation as proof of native Android behavior.

## Investigation

1. Reproduce the reported symptom and capture exact inputs, state, time conditions, and result.
2. List falsifiable hypotheses and test one discriminator at a time.
3. Add temporary, narrowly scoped instrumentation only when it separates hypotheses; remove it after the diagnosis.
4. Convert the minimized real failure into a failing regression test when a valid test seam exists.
5. Fix the root cause, rerun the original loop, and report actual evidence and any remaining gap.

## Project Focus

Check first for stale/derived state mistakes, repeated-tap behavior, tick ordering, elapsed-time catch-up, rounding/caps, Zustand selector churn, and save-boundary errors. Keep UI rendering, game rules, state, and SQLite adapters separate while diagnosing.

## Stop Conditions

If no reliable loop can be created, report what was tried and ask for the needed device state, recording, logs, or permission for temporary instrumentation. Do not guess a fix from an unverified theory.
