# Project Context

Date: 2026-06-21

This is the canonical domain glossary for this repo. Keep it aligned with the current codebase and use its terms in agent instructions, code, and documentation.

Office Tycoon is a management game about directing staff, software projects, releases, sales, finance, and company reputation. AI agents should use the terms below instead of importing vocabulary from older projects.

## Software Lifecycle Language

**Software Project**:
A company effort that progresses through a defined lifecycle and can create project Activities for staff work.
Avoid: Activity, task, ticket as synonyms for the project itself

**Design Phase**:
The first lifecycle phase where the product's scope and structure are planned. Produces Design Quality.
Avoid: Planning phase, planning stage

**Development Phase**:
The second lifecycle phase where features and architecture are built. Consumes Design Quality as a speed modifier.
Avoid: Production phase, coding phase

**Beta Phase**:
The third lifecycle phase where open bugs are fixed before release.
Avoid: Testing phase, QA phase

**Release**:
The act of shipping a Software Project, capturing a price and base price snapshot and registering a Released Product.
Avoid: Launch, publish, deploy

**Released Product**:
A persisted product entity that generates daily sales after a Release.
Avoid: Published product, shipped game

**Design Quality**:
A `0..1` value derived from completed design iterations and partial progress, used as a development speed modifier.
Avoid: Design score, design level

**Software Quality**:
A `0..1` value calculated from Architecture Quality and average Feature Score, subject to open-bug penalties.
Avoid: Product quality, code quality

**Feature**:
A scoped capability inside a Software Project that contributes to work, quality, and market appeal.
Avoid: Project, staffing unit, task

**Architecture**:
The structural foundation of a Software Project's development state. Improves alongside Features but on its own work track.
Avoid: Framework, system design

**Scope Complexity**:
A numeric value summing the complexity of the selected software type, features, and subfeatures. Controls how much work each phase requires.
Avoid: Project size, difficulty

**Bug**:
A source-attributed defect created during development that reduces quality until fixed in beta.
Avoid: Issue, error, defect

## Market Language

**Prestige**:
An accumulated numeric score derived from release success events and sales events, stored as decaying Prestige Events.
Avoid: Score, fame, renown

**Prestige Event**:
A single scored event with a type, scope, decay rate, amount, and source metadata.
Avoid: Achievement, badge, milestone

**Reputation**:
A derived `0..100` value computed from total Prestige using a logarithmic normalization curve. It is not stored as source-of-truth state.
Avoid: Rating, rank, standing

**Reach**:
The market mechanics that translate Released Product attributes, global market size, and Reputation into daily unit sales.
Avoid: Market penetration, distribution

**Addressable Market**:
The number of potential buyers on a given day, derived from global market size, software type reach multiplier, and platform limit.
Avoid: Total market, market size

## Dependency Language

**Capability**:
A named technical support area that one product can provide and another can require, such as `os_runtime`, `network_stack`, `game_engine_runtime`, or `engine_2d`.
Avoid: Exact product dependency, hard-coded tool requirement

**Capability Requirement**:
A dependency on a Capability with a minimum supported level.
Avoid: Exact product lock, generic tech score

**Capability Level**:
A numeric maturity or support level for one Capability. Compatibility checks compare provider level against required minimum level.
Avoid: Global year score, one-size-fits-all tech rating

**Host Environment**:
A broad hosting classification for a Software Type, such as `none` or `operating_system`. It is a convenience label, not a substitute for Capability Requirements.
Avoid: Full dependency graph, exact runtime implementation

## Staff Language

**Staff Member**:
A hireable company worker with wages, Skills, Specializations, Capacity, and Experience.
Avoid: Employee, worker

**Skill**:
A broad work domain (`leadership`, `development`, `design`, `qa`, `marketing`, `operations`) that a Staff Member improves in.
Avoid: Top-level skill, department

**Specialization**:
A narrower expertise nested under exactly one Skill (for example `architecture` under development and `bug_triage` under qa).
Avoid: Sub-task, sub-skill

**Experience** (XP):
Accumulated progress stored per Skill and Specialization key that improves a Staff Member's effective output asymptotically. `XP` is the accepted shorthand in code and docs.
Avoid: XP level, discrete level, generic score

**Team**:
A named group of Staff Members used for management convenience. It does not restrict project assignment.
Avoid: Activity owner, project container, department

**Team Membership**:
A Staff Member's inclusion in a Team.
Avoid: Primary department, exclusive role

**Staff Work Profile**:
The Skill and Specialization weights for a given project phase, used to calculate weighted effective skill and determine XP award keys.
Avoid: Role template, job requirements

**Capacity**:
A `0-100` scale factor on a Staff Member's individual work output. Defaults to `100`. Reduces output proportionally when below `100`.
Avoid: Availability, bandwidth

**Payroll**:
The periodic wage expense recorded as `staff_wages` finance transactions for active Staff Members. `Salary` is acceptable for the per-staff per-day cost (`salaryPerDay`).
Avoid: Salary run, wage payment

**Activity**:
A staff-assignable unit of work. A Software Project creates software Activities for design, development, and beta work, but Activities can also represent administration, research, staffing, marketing, or operations work.
Avoid: using Activity to mean the Software Project itself

## Relationships

- A **Specialization** belongs to exactly one **Skill**.
- A **Staff Member** has base values in both **Skills** and **Specializations**.
- A **Staff Member** can gain **Experience** in both a **Skill** and a **Specialization**.
- A **Software Project** progresses through Design -> Development -> Beta -> Release phases.
- A **Software Project** can contain many **Features**.
- A **Software Project** can have one current software **Activity** while it is in Design, Development, or Beta.
- A **Staff Member** can be assigned to multiple **Activities**; their work output is split across those assignments.
- A **Feature** can weight multiple **Specializations** in a Staff Work Profile.
- A **Team** can contain many **Staff Members**.
- A **Released Product** is registered on Release and generates daily sales via Reach.
- **Reputation** is derived from **Prestige**; it is never stored as source-of-truth state.

## Current Implementation Notes

- **Software Projects** are persisted in `src/stores/productionStore.ts` as a project list. There is no single selected work focus.
- **Activities** are persisted in `src/stores/activityStore.ts` as the staff-assignment surface. Software Project Activities mirror project phase/progress; future non-project Activities use the same panel and assignment model.
- **Released Products** are persisted separately in `src/stores/releasedProductStore.ts` and become the source of launch-day and recurring sales.
- **Reputation** is recalculated from persisted **Prestige Events** whenever it is needed.
- **Payroll** is recorded into the finance ledger as `staff_wages`; revenue is recorded as `product_sales`.

## Flagged Ambiguities

- `activity` is now a gameplay domain term for staff-assignable work, but it should not be used as a synonym for **Software Project**.
- `production phase` was used in older docs for the second lifecycle stage; use **Development Phase**.
- `QA phase` was used in older docs for the third lifecycle stage; use **Beta Phase**.
- `reputation store` is incorrect wording; the store persists **Prestige Events**, while **Reputation** stays derived.
