---
name: brainstorming
description: Use when the user asks to explore Industri Clicker mechanics, economy, progression, UX options, or other unclear product requirements before implementation.
---

# Brainstorming

Explore a product decision with the user before implementation. This is an explicit design workflow, not a gate for routine changes.

## Use When

- The user asks for ideas, alternatives, trade-offs, or a design discussion.
- A game mechanic, progression rule, economy rule, mobile interaction, or persistence policy is unclear enough that coding would guess at product behavior.

## Do Not Use When

- The user has asked for a narrow, clear implementation or documentation edit.
- The answer is already established in `docs/WorkingDocs/` or current code.

## Workflow

1. Read the smallest relevant project context: `readme.md`, `CONTEXT.md`, `design.md`, and `gameflow.md` when the topic affects mechanics or persistence.
2. State the decision being explored and confirmed constraints: native Android, Expo/React Native, code-defined UI, local-first state, and no assumed backend.
3. Ask only the questions that cannot be answered from the repository. Ask one at a time when a choice materially changes the outcome.
4. Present the smallest useful set of options with player impact, implementation impact, and a recommendation.
5. Record durable approved decisions in `docs/WorkingDocs/design.md`; record mechanics, formulas, variables, ticks, or saves in their owning documents.
6. Do not implement, commit, create plans, use browser mockups, or dispatch agents unless the user separately asks for that work.

## Design Checks

- Do not invent concrete resources, production chains, currencies, monetization, or offline rules before the user approves them.
- Keep portrait-phone interaction, touch feedback, accessibility, and repeated-tap responsiveness in scope for UI decisions.
- Keep formulas deterministic and game rules independent from UI and SQLite.
- State unresolved choices explicitly rather than filling them with predecessor-project assumptions.

## Output

End with confirmed decisions, open questions, and the smallest next action. If the user approves a substantial implementation, use `../writing-plans/SKILL.md` only when a written multi-step plan is actually needed.
