# QA Report — GHM Atlas Command Centre v31+ RC3.6 Icon Integration

**Edition:** GitHub Browser Upload  
**Release date:** 29 July 2026  
**Source build:** v31+ RC3.5 Home & Map Corrections  
**Data snapshot:** 21 July 2026

## Result

**Static validation: PASS**

A fresh Chrome visual review is still required. Automated local browser navigation could not be run because this execution environment blocks navigation to local web servers.

## Icon integration

- 11 supplied Territory icons mapped to WS001–WS011.
- 11 production assets present.
- Production dimensions: 512 × 512 each.
- Production format: lossless WebP with alpha transparency.
- Combined production icon size: 3.45 MiB.
- Static desktop/mobile navigation references: 22 references across 11 unique icons.
- Primary data mappings: 11/11.
- Navigation data mappings: 11/11.
- Legacy workstream PNG/navigation SVG references: 0.

Two supplied source files (Website and Pipeline / Technical) were 1254 × 1254 and were normalised without cropping; the remaining nine were 1024 × 1024.

## Code and references

- JavaScript syntax: PASS
- CSS brace balance: PASS
- Missing local file references: 0
- RC3.6 build class present: PASS

## Embedded data integrity

- Workstreams: 11
- Work items: 201
- Territory edges: 24

The approved dataset was not edited during this icon integration pass.

## Packaging

- Current package file count before archive metadata: 82
- GitHub browser-upload target remains below the 100-file browser-upload limit.
- Local launcher permissions are retained in the source folder; archive permission checks are performed after ZIP creation.

## Outstanding review

- Chrome visual check at 1920 × 1080, 1366 × 768, iPad portrait/landscape and 390 × 844.
- Confirm the detailed artwork remains visually balanced at the smallest navigation sizes.
