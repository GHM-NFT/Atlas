# GHM Atlas — Command Canvas v12

A GitHub-ready, responsive insight and interaction refinement of the Atlas project overview.

## Included views

1. **Bird’s-eye:** the eleven fixed workstreams shown as branded command cards.
2. **Structured:** the underlying items grouped by workflow state.
3. **Square chart:** one square per workstream, coloured by dominant workflow state.
4. **Waffle chart:** one cell per visible item for rapid status scanning.

Workflow state controls the main fill colour. `RAG_Risk` is deliberately separate and appears as an outer risk ring or risk count.

## Live data

The build reads the existing public Google Sheets register:

- Spreadsheet: `1TszfahbSPhV0c_1LK0Y_ub_0mlEiDiwzJdC93vX7JtM`
- Nodes tab: `Atlas_Command_Map_Nodes`
- Edges tab reserved for the next dependency-map iteration: `Atlas_Command_Map_Edges`

The loader accepts several common header variants. The preferred source fields are:

- `Node_ID`
- `Node_Name` or `Title`
- `Workstream_ID` or `Workstream`
- `Owner`
- `State_Bucket`
- `RAG_Risk`
- `Evidence`

If the public sheet cannot be reached, clearly labelled demonstration records are shown so the layout remains testable.

## Fixed workstreams

- WS001 — White Paper
- WS002 — Website
- WS003 — Pipeline / Technical
- WS004 — Video Production
- WS005 — Metadata / Manifest
- WS006 — Launch / Market Readiness
- WS007 — Atlas / Story / Portal
- WS008 — Artwork / Collections
- WS009 — QA / Review / Decisions
- WS010 — Sources / Library
- WS011 — Prints / Fulfilment

## Publish on GitHub Pages

1. Copy this folder into the repository.
2. Commit the files.
3. Open `GHM_Atlas_Command_Canvas_v11/index.html`, or rename it at repository root if desired.
4. GitHub Pages will serve the page without a build step.

## Local preview

Because the page fetches a remote CSV, use a small local web server rather than opening `index.html` directly:

```bash
python -m http.server 8000
```

Then browse to `http://localhost:8000/GHM_Atlas_Command_Canvas_v11/`.

## Asset approach

The supplied design is used as the visual source. Two sizes are included for each major raster treatment:

- desktop
- responsive/mobile

The functional cards, filters, legend, status system, and charts are HTML/CSS rather than a single flattened image, so they remain accessible and responsive.


## v12 additions

- Filter-aware headline totals
- “Needs attention” intelligence panel
- Priority ordering of workstreams
- Composite health indicators
- Stronger selected states and tooltips
- Separate risk markers across all overview views
- Richer workstream drill-down
- Priority, state, owner, and title sorting
- Direct evidence links where the register contains a valid URL
- Improved mobile details behaviour
