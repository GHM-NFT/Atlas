# Atlas Command Centre Map — v20 Experience Prototype

A complete, GitHub-ready UX/UI prototype for approving the Atlas command-centre experience before reconnecting production data.

## What this version changes

v20 is a controlled prototype rather than another incremental styling pass. It is deliberately populated end to end so design and interaction decisions can be reviewed without accidental blanks.

- 11 workstreams
- 88 fully populated work items
- 18 workstream dependencies
- 12 milestones and control gates
- 4 active decisions
- populated activity, evidence, ownership, risk, status and next-action fields
- consistent canonical colour system
- responsive desktop, tablet and mobile layouts

## Functional views

1. **Overview** — programme readiness, command signals, workstream cards, decisions and activity.
2. **Visual map** — selectable workstreams and dependency relationships with critical-path focus.
3. **Timeline** — filterable milestone and control-gate view.
4. **Register** — search, filters, sorting, pagination, density control and CSV export.
5. **Workstream command chamber** — overview, tasks, dependencies and decisions.
6. **Work-item detail** — ownership, due date, evidence, dependencies, decision state and notes.
7. **Command search** — keyboard-accessible search across views, workstreams and items.
8. **Prototype data entry** — creates a complete new item with required fields and updates every view.

## Prototype data

The default data is deterministic and stored in `js/data.js`. It is intentionally independent of the live Google Sheet so UX approval is not distorted by missing or inconsistent source fields.

The approved production phase can replace this adapter with the existing Google Sheet:

- Spreadsheet ID: `1TszfahbSPhV0c_1LK0Y_ub_0mlEiDiwzJdC93vX7JtM`
- Node tab: `Atlas_Command_Map_Nodes`
- Edge tab: `Atlas_Command_Map_Edges`

## Canonical colours

- Complete / healthy: green
- Active: blue
- Review / watch: amber
- Blocked / critical: red
- Planned: violet
- Atlas navigation and hierarchy: gold
- Risk is displayed separately from workflow status

## Publish on GitHub Pages

Upload the complete `GHM_Atlas_Command_Centre_Map_v20` folder to the `Atlas` repository.

The expected page path is:

`https://ghm-nft.github.io/Atlas/GHM_Atlas_Command_Centre_Map_v20/index.html`

No build step or external dependency is required.

## Validation

- JavaScript syntax checked with Node
- all 88 initial work items checked for required non-empty fields
- HTML asset references checked for missing files
- reduced-motion support included
- designed no-results states used only when a user deliberately filters to zero records
