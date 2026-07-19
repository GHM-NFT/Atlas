# Prototype Data Schema

Every work item in `js/data.js` includes:

- `id`
- `workstream`
- `title`
- `owner`
- `status`
- `risk`
- `priority`
- `due`
- `updated`
- `progress`
- `description`
- `evidence`
- `dependencies`
- `decision`
- `nextAction`
- `notes`

The production adapter should normalise source data into this same shape. Missing source values should be surfaced as a deliberate data-quality state rather than rendered as blank UI.
