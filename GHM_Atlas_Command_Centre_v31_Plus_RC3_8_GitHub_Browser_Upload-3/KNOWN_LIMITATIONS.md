# Known limitations — RC3.8

- Progress percentages are visual estimates because the approved snapshot has no authoritative completion-percentage field. They are labelled `est.` and must be replaced when a canonical field is supplied.
- The build is snapshot-based and does not update live from Google Sheets.
- Google-hosted Roboto Slab and Inter require an internet connection; local serif/sans-serif fallbacks are used when unavailable.
- The detailed supplied Territory artwork is intentionally scaled down in compact navigation positions; text within the artwork is not expected to remain readable at the smallest icon sizes.
- The conditional “hide progress gauge when no percentage exists” is implemented for future snapshots. The current visual-review snapshot supplies provisional estimates for otherwise missing values.
- Final visual acceptance requires a fresh Chrome pass at the agreed viewport sizes.
