# GHM Atlas — Command Canvas v16

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


## v13 additions

- Atlas logo extracted from the layered PSD
- Eleven complete, square, transparent workstream icon assets
- Desktop and responsive PNG exports for every icon
- Larger icon-led bird’s-eye cards
- Full workstream command chamber
- Overview, items, owners, and evidence tabs
- Workstream health, blocked, and review intelligence
- Priority stack for immediate intervention
- Ownership distribution
- Linked evidence register
- Responsive presentation using the original PSD artwork


## v16 additions

- v13 remains the primary card-based experience
- New dedicated Visual Map mode inspired by the strongest v10 layouts
- Bird’s-eye layout with icon anchor nodes and clustered live items
- Territory layout
- Workflow layout
- Dependency-weighted layout
- Status-coloured dots with separate risk rings
- Node size reflects dependency count
- Optional labels, edges and icon anchors
- Hover intelligence for every node and workstream
- Click a dot to isolate its direct dependency neighbourhood
- Click a workstream icon to open the v13 command chamber
- Pan, wheel zoom, fit and focus reset
- Right-hand command panel removed only while the Visual Map is active
