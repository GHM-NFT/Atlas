# GHM Atlas Command Centre v31+ RC3.3 Chrome Pass

Private, read-only local website build.

## Start on a Mac

1. Extract this folder into Downloads.
2. Control-click **Start Atlas.app**.
3. Choose **Open**, then confirm **Open** if macOS asks.
4. Keep the Terminal window open while Atlas is running.
5. Press **Control+C** when finished.

Alternative:

```bash
cd "$HOME/Downloads/GHM_Atlas_Command_Centre_Map_v31_Plus_RC3_3_Chrome_Pass_Internal_Local_Mac"
chmod +x "Start Atlas.command"
chmod +x "Start Atlas.app/Contents/MacOS/start-atlas"
xattr -dr com.apple.quarantine .
bash "Start Atlas.command"
```

Atlas opens at:

`http://127.0.0.1:8000/index.html#overview`

## Data

- Approved snapshot: 21 July 2026
- Physical source rows: 877
- Unique node IDs: 873
- Work items: 201
- Dependencies: 56
- Evidence records: 111
- Decisions: 95
- Risks/blockers: 47
- Validation findings: 210

The build does not connect to Google Sheets. Temporary percentages are visual estimates and are marked `est.`.

## Review sizes

- 1920 × 1080
- 1366 × 768
- iPad portrait and landscape
- 390 × 844

See `RC3_3_AMENDMENT_MATRIX.md`, `QA_REPORT_V31_PLUS_RC3_3.md` and `KNOWN_LIMITATIONS.md`.
