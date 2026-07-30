# Implementation notes — RC3.8

- Base: RC3.6 Icon Integration.
- Final amendment source: 30 July 2026 Chrome review and supplied reference archive.
- Data mode: embedded, read-only approved snapshot; no network data connection.
- CSS is layered. `css/v31-rc3-8-final-corrections.css` is the final override layer, after the preserved RC3.7 layer.
- JavaScript changes are integrated in `js/app.js`; no runtime patch script is used.
- The loader uses an optimised 112 × 112 WebP derived from the supplied Command Centre icon.
- The footer uses an optimised WebP derived from the supplied Ethos artwork.
- Desktop/tablet/mobile navigation is controlled at 1440px and 1180px breakpoints.
- Full and mini Bird’s-eye artwork and nodes use explicit SVG hit targets and keyboard activation.
- Transient tooltips are hidden whenever a drawer or modal is active.
- All 11 official Territory images remain lossless 512 × 512 WebP assets with transparency.
- Final responsive close-control correction uses the existing `.mobile-menu`, `.burger-lines` and `[aria-expanded="true"]` selectors; no image asset or JavaScript replacement was introduced.

