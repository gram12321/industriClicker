# Progression Gates And Research System Direction

Implement a local-first progression-gate and timed research system in the existing Zustand and company-snapshot architecture. Reuse Winemaker04's declarative research prerequisites and chained rewards, but do not import its Supabase, activity system, or research-specific enforcer wrapper.

## Research result

| Source | Verdict | What to reuse |
|---|---|---|
| Winemaker04 `main` | Its research feature has a useful project catalogue, eligibility context, prerequisite chains, and reward-on-completion flow. Its `researchEnforcer` is only a thin research-unlock wrapper, not a global enforcement system. | Declarative prerequisites, chained projects, one-time completion records, and command-side eligibility validation. |
| Industri Clicker achievements | Durable IDs and evaluator already exist, with achievement unlock checks after relevant commands. | Achievement IDs as a gate source; do not duplicate achievement progress in research. |
| Industri Clicker prestige | A derived, potentially decaying company value built from persisted events. | Current prestige as a gate source at research start only. |
| Industri Clicker sales contracts | Offers are generated during foreground time and have no hard open-contract cap today. | A derived research effect that limits creation of additional open offers. |

Do not duplicate Winemaker04's async database records, work-category activities, or consumer-specific scattered unlock queries. Industri Clicker owns one local `GameSnapshot`, one foreground time path, and typed game-store commands.

## Current integration points

| Current system | Research/gate connection |
|---|---|
| `game/achievements/achievement.ts` | The `AchievementLedger` supplies durable completed-achievement IDs to gate evaluation. |
| `game/prestige/` | `calculateCompanyPrestigeSummary(...)` supplies current prestige to gate evaluation. A prestige requirement never revokes research already started or completed. |
| `game/company/companyTypes.ts` and `companySessionStore.ts` | `LocalCompany.startingConditionId` is the durable starting-condition source. It remains outside the game snapshot, but is copied into runtime game context whenever a company is activated. |
| `game/core/stores/gameStore.ts` | Owns research start, cancellation, foreground progress, completion, reward application, achievement re-evaluation, and sales-capacity calculation. |
| `game/core/state/gameSnapshot.ts` | Gains the required persisted research ledger. Existing saves without it are intentionally invalid and start fresh under the current no-migration policy. |
| `app/_layout.tsx` | Adds research state to the existing five-second snapshot-save subscription. The existing foreground clock advances research; inactive time does not. |
| `game/sales/salesContracts.ts` | Receives an explicit maximum-open-contract value before creating automatic or development-requested offers. Fulfilment and rejection remain available at every capacity. |
| `app/index.tsx` | Adds the Research surface to the existing profile menu instead of adding a seventh bottom-navigation tab. |

`game/market/marketAccess.ts` remains a future trade-access seam. Do not force the research system through that resource-specific module; progression gates are a new, generic domain.

## Recommended v1 mechanic

### Progression gates

Create a pure `game/gates` domain. It evaluates an all-of requirement list against a supplied context and returns both `allowed` and human-readable unmet reasons. It has no Zustand, UI, SQLite, or command-side effects.

Supported initial requirement kinds are:

- completed achievement ID;
- minimum current company prestige;
- completed research project ID;
- required starting-condition ID.

The game store builds the authoritative context and rechecks it within `startResearch`. The Research UI renders the same evaluation result for locked labels and disabled controls; it is not the authority. Starting condition is supported by the evaluator even though `standard` is its only current value and the initial catalogue has no artificial starting-condition gate.

### Research lifecycle

- A company may have exactly one active research project.
- A project is startable only when it is incomplete, no project is active, every gate is satisfied, and the current balance covers its full configured money cost.
- Starting research deducts its full cost immediately and records an active project with `projectId`, `progressMs`, and `paidCost`.
- `advanceGameTime` increases active research progress by the same foreground elapsed milliseconds used for production. Resume/background time adds no research progress; Fast-forward uses the same foreground path and does add progress.
- Completion records the project once, clears the active project, and applies its configured effect in the same store transition. A completed grant cannot be awarded twice after restore, repeated ticks, or a repeated button press.
- Cancelling first advances current foreground time, refunds exactly `paidCost` as a finance transaction, and clears the active project. It preserves no partial progress; a later restart begins at zero and pays the current project cost again.
- A project whose prestige gate was met when it started continues even if prestige later decays. Completed research is permanent.

Persist a `ResearchLedgerSnapshot` with completed project IDs/timestamps and the optional active project. Research catalogue definitions, costs, durations, requirements, labels, and effects remain code-owned constants.

### Initial research catalogue

The first slice contains two five-project linear chains. Each project requires the previous project in its own chain, in addition to the listed external gate. Costs and grants deliberately scale by tier; all figures are initial balance configuration, not derived formulas.

| Chain and tier | Cost | Foreground time | Additional start gate | Completion effect |
|---|---:|---:|---|---|
| Capital Grant I | €1,000 | 1 min | `facility_portfolio_tier_1` | Grant €5,000 |
| Capital Grant II | €2,500 | 2 min | `cash_reserves_tier_1` | Grant €10,000 |
| Capital Grant III | €7,500 | 4 min | `fulfilled_contracts_tier_1` | Grant €20,000 |
| Capital Grant IV | €17,500 | 8 min | current prestige ≥ 1 | Grant €35,000 |
| Capital Grant V | €35,000 | 15 min | `fulfilled_contracts_tier_2` | Grant €60,000 |
| Sales Capacity I | €500 | 30 sec | `facility_portfolio_tier_1` | Maximum open contracts: 2 |
| Sales Capacity II | €1,500 | 1 min | `fulfilled_contracts_tier_1` | Maximum open contracts: 3 |
| Sales Capacity III | €4,000 | 3 min | `cash_reserves_tier_1` | Maximum open contracts: 5 |
| Sales Capacity IV | €9,000 | 6 min | current prestige ≥ 1 | Maximum open contracts: 7 |
| Sales Capacity V | €20,000 | 12 min | `fulfilled_contracts_tier_2` | Maximum open contracts: 10 |

The baseline maximum is one open sales contract. Sales capacity is a persistent derived effect: calculate the highest completed capacity tier, then prevent only additional offer creation while the current open count is at that maximum. Do not change offer reward, chance, fulfilment, rejection, history, or customer-pipeline progress semantics. Capacity effects do not stack; the highest completed tier defines the maximum.

## UI recommendation

Add a Research item to the profile menu and render a portrait-first `ResearchView` in the existing full-content area.

- Display the active project first with title, elapsed/total foreground time, a React Native Paper `ProgressBar`, cost already paid, and an explicit Cancel button that states the full refund and reset behavior.
- Display both chains as compact vertical lists or cards. Completed projects show their reward/effect; the next available project shows cost, duration, requirements, and Start; locked projects show every unmet reason; later chain tiers may be visible but subdued.
- While any research is active, all other Start actions are disabled with one clear `Research in progress` reason.
- Add `Open contracts: current / maximum` to the Sales summary so the sales-capacity reward is visible where it is enforced.
- Use accessible labels for start, cancel, progress, locked conditions, and current capacity. Do not put a dense research tree or a seventh bottom tab into the first mobile surface.

## Implementation sequence

1. Add `game/gates/gate.ts`, `game/gates/index.ts`, and exports from `game/index.ts`.
   - Define typed gate requirements, gate context, unmet-reason result, and a pure evaluator.
   - Keep presentation-ready reason text generated from named requirement values; use no store or UI imports.
   - Verify gate evaluation with focused pure-function cases when a test harness exists; otherwise keep it independently callable and cover the cases in the manual verification pass.

2. Add `game/research/researchConstants.ts`, `game/research/research.ts`, `game/research/researchEffects.ts`, `game/research/index.ts`, and exports from `game/index.ts`.
   - Define the ten projects above, their IDs, requirements, costs, foreground durations, and exhaustive effects (`grant` or `max-open-sales-contracts`).
   - Implement snapshot validation, clone/restore, active progress, cancellation/reset, one-time completion, and derived maximum-sales-capacity helpers.
   - Keep balance values in `researchConstants.ts`; do not hide them in store or UI code.

3. Update `game/core/state/gameSnapshot.ts`, `game/core/stores/gameStore.ts`, and `game/company/companySessionStore.ts`.
   - Add the research ledger to starting snapshots, validation, creation, restoration, reset, and store state.
   - Add runtime-only active-company starting-condition context and set it during company activation; do not duplicate it into the snapshot or add a database table.
   - Add `getResearchAvailability`, `startResearch`, and `cancelResearch` store commands. The start command must evaluate gates and affordability again before charging money.
   - Advance research through `advanceGameTime`; complete atomically, record grant transactions, refresh balance prestige, and evaluate affected finance/prestige achievements after a grant or refund.
   - Treat missing research snapshot data as invalid current-version save data rather than creating a compatibility branch.

4. Update `game/sales/salesContracts.ts`, `game/core/stores/gameStore.ts`, and `ui/dashboard/views/SalesView.tsx`.
   - Add an explicit capacity check to both timed offer generation and `createSalesContractRequest`; do not generate an offer above the derived maximum.
   - Preserve all currently open offers if a future catalogue change lowers a cap; only future creation is blocked.
   - Pass and render the derived maximum in Sales UI with the current-open count.

5. Add `ui/dashboard/views/userpages/ResearchView.tsx`, export it from `ui/index.ts`, and update `app/index.tsx` and `icons.ts`.
   - Add the profile-menu entry, active-screen route branch, store selectors/actions, and Research view props.
   - Render active progress, cancellation, project requirements, cost, duration, effect, completion, and capacity feedback without embedding business logic in UI components.

6. Update `app/_layout.tsx` and canonical documentation.
   - Include research-reference changes in the batched save subscription.
   - Update `docs/WorkingDocs/CONTEXT.md` with research, active research, progression gate, and sales capacity terms.
   - Update `docs/WorkingDocs/design.md` with the two-chain player-facing direction; `gameflow.md` with foreground research order, cancellation/refund, and sales-cap enforcement; `VariableRelationshipMap.md` with state ownership, commands, dependencies, and snapshot persistence; and `PROJECT_INFO.md` with the verified source/UI map after implementation.
   - Do not update the version log until a reviewed commit exists.

7. Verify the finished slice.
   - Run `npm run typecheck`.
   - On a narrow Android/Expo Go surface, verify: locked reason display; one active project; immediate charge; foreground and Fast-forward progress; no background progress; full refund/reset cancellation; grant once-only behavior after save/restore; prestige start gate persistence after decay; and sales capacity blocking only new offers at 1/2/3/5/7/10.
   - The repository currently has no configured test runner. Do not add a dependency solely for this slice; keep gate, research, and capacity calculations pure for later focused tests.

## Confirmed decisions

- Progression gates are a shared pure evaluator, not a research-only enforcer and not global mutable state.
- Initial gate sources are achievements, current prestige, completed research, and starting condition.
- Research is foreground-time only and uses the existing real-time/fast-forward path; offline progress remains deferred.
- One active research project is allowed at a time.
- Research pays in full at start. Cancellation refunds the full paid cost and discards all progress.
- The first catalogue contains two linear five-tier chains: scaled Capital Grants and Sales Capacity.
- Capital grants increase by tier: €5,000, €10,000, €20,000, €35,000, and €60,000.
- Sales capacity increases from the base cap of 1 to 2, 3, 5, 7, and 10 open contracts. It limits only creation of new offers.
- Positive balance remains uncapped; research does not introduce a finance ceiling.
- All state stays device-local in Zustand plus the existing company-keyed SQLite snapshot. No backend, cloud sync, account, or new SQLite table is introduced.
