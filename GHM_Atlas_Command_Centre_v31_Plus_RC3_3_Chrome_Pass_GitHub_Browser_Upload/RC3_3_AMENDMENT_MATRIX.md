# RC3.3 amendment matrix — 29 July 2026 Chrome pass

| Area | Amendment | Implementation |
|---|---|---|
| Universal | Active delivery wording | Active wax/seal summaries now read **In progress**. Genuine risk records remain **At risk**. |
| Universal | Estimated percentages | Compact UI labels use `% est.`; explanatory copy and accessible labels use “estimated”. |
| Universal | Progress gauges | One shared multicolour gradient gauge is used for Overview, Structured, Command Index, Territory and detail contexts. |
| Universal | Full-colour indicators | Critical uses bright red, High/At risk uses bright orange, Review uses blue, In progress uses turquoise and Completed uses green. |
| Universal | Popup typography | Quick Chamber and item modal titles use Roboto Slab with smaller supporting sans-serif copy. |
| Universal | Loader | Loader uses the supplied corrected Command Centre Map icon and waits for image/page readiness before dismissal. |
| Overview | New composition | Rebuilt to follow `home-page-29-7-26-.jpg`: Territory-style hero, current state, Territory focus, Waffle, Bird’s-eye preview, action panels, eleven-Territory summary, audit block and selected-Territory register. |
| Overview | Clipped hero icon | Hero artwork has reserved dimensions and navigation now resets route scroll position immediately and after layout. |
| Overview | Condensed percentages | Removed duplicated percentage text; each Territory has one aligned gauge and value. |
| Bird’s-eye | Visibility | Map overlay is lighter so illustrations remain legible. |
| Bird’s-eye | Motion and nodes | Relationship paths remain animated; node dots are larger, borderless and have a stronger pulse. Reduced-motion preference is still respected. |
| Bird’s-eye | Icon circles | Removed backing circles from the centre and Territory illustrations. |
| Waffle | State strokes | Classic cards use equal 15px rounded state-colour borders. |
| Waffle | Wall | Waffle blocks remain contiguous as one multicoloured wall. |
| Structured | Percentage alignment | Gauge/value alignment is corrected and the value uses the shared positive green treatment. |
| Top navigation | 1440px collision | At 1440px and below, secondary text links move into the existing menu while the five primary visual views remain. |
| Top navigation | Button/info collision | Command Centre, visible-item count and Internal Audit controls use a compact two-row stack. |
| Command Index | Gauge spacing | Progress gauges receive consistent side inset. |
| Command Index | Icon spacing | Main card icons are moved inward by 10px and card-header padding is increased. |
| Milestones | Status marker | Corner text blocks are replaced with status wax seals. |
| Milestones | Live record action | Record link is larger, includes an arrow and has a clear hover/focus change. |
| Registers | Indicators | Register, Dependencies, Evidence and Decisions use full-strength status colours. |
| Evidence | Drawer typography | Evidence rows use a stable ID/content/status grid with Roboto Slab titles and readable supporting copy. |
| Dependencies / Evidence / Decisions | Row actions | Action controls use a stable full-width stack at desktop, tablet and phone widths. |
| Territories | Hero | Critical side panel remains removed; icon, copy and gradient progress are consistently composed at all widths. |
| Territories | Route return | Scroll restoration and reserved icon dimensions prevent cropped artwork after route changes. |
| Tablet | Slide-in navigation | Icon/text rows are left-aligned with consistent grid columns and Roboto Slab section hierarchy. |
| Tablet/mobile | Summary blocks | Milestone and command summaries use two columns to reduce unnecessary vertical length. |
| Mobile | Back links | Top/bottom spacing is balanced and reduced. |
| Mobile | Quick Chamber layers | Tooltips are suppressed on touch layouts and are cleared when chambers close. |
| Assets | New Command Centre icon | Both supplied source sizes are retained; the 750px version is used in the interface. |
| Assets | New Territory icons | Pending user-supplied replacements; existing icons remain temporarily. |

## Review status

The code and static package checks are complete. A fresh visual pass in Chrome is still required at 1920×1080, 1366×768, iPad portrait/landscape and 390×844.
