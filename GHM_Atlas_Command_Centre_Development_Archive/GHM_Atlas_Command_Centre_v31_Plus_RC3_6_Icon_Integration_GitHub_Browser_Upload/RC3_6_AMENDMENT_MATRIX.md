# RC3.6 Amendment Matrix — Supplied Icon Integration

| Requirement | Implementation |
|---|---|
| Add all 11 completed main icons | Integrated the full supplied set and mapped WS001–WS011 explicitly. |
| Use correct production sizes | Normalised source canvases without cropping; exported 512 × 512 lossless WebP derivatives with alpha. |
| Update every page and map | Replaced both `icon` and `navIcon` data paths and all static navigation references. |
| Keep artwork clean for effects | No shadow was baked into the assets; interface shadows remain CSS-only. |
| Update Overview and Territory pages | Dynamic hero, summary, condensed, status and register surfaces now use the supplied set. |
| Update Bird’s-eye and mini maps | Full, Overview and Territory mini-map SVG images now load the supplied set. |
| Update Block, Waffle, Quick Chamber and cards | All dynamically rendered workstream images share the new production mapping. |
| Update desktop and responsive navigation | Left rail and slide-in navigation now use the same supplied icons. |
| Preserve approved data | The 21 July 2026 snapshot and all record counts remain unchanged. |
