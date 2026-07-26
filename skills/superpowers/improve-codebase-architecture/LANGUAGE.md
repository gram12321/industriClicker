# Industri Clicker Architecture Language

Use the project vocabulary below when reviewing ownership. Do not force a new abstraction merely to use one of these terms.

| Term | Meaning |
|---|---|
| UI component or screen | React Native code that renders state, receives touch input, and issues commands. |
| Game rule | Pure TypeScript logic that validates commands and calculates deterministic game outcomes. |
| Runtime state | Zustand-managed source-of-truth state while the app is open. |
| Derived value | A display or convenience value calculated from source-of-truth state. |
| Persistence adapter | Expo SQLite code that owns deliberate snapshot reads, writes, and restoration. |
| Boundary | The responsibility split between UI, rules, runtime state, persistence, and external systems. |
| Interface | The types, invariants, inputs, outputs, errors, and timing a caller must understand to use a module. |

## Principles

- A boundary earns its cost only when it keeps game rules testable, separates an external system, or reduces real coupling.
- Do not add pass-through wrappers, generic repositories, ports, or barrels without a concrete need.
- A good game-rule interface exposes player/system inputs and deterministic results, not UI or SQLite details.
- Two independently useful implementations can justify an adapter boundary; a hypothetical future implementation does not.
- Use the glossary in `docs/WorkingDocs/CONTEXT.md` for game-domain names.
