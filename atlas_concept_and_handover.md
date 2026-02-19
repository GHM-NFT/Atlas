# GHM Atlas — Concept + Production Plan + Codex Handover (v1)

## 1) What Atlas is (one-paragraph intro)
**Atlas** is the logged‑in collector hub for *Gods • Heroes • Myths (GHM)*. It turns individual NFTs (stamps, teasers, editions) into **progress on story journeys** (3/4/6/12 beats). When a collector completes a recipe (e.g., 12/12), Atlas unlocks a **Chronicle Claim**: a minted “Chronicle” badge + a generated **Chronicle Poster** (digital, and optionally a physical print redemption for full journeys).

---

## 2) The core idea in bullets (for first‑time readers)

### Story-first collecting
- Collectors don’t buy “random items”; they **collect a narrative**.
- Every story is broken into numbered **beats** aligned with the **12-stage Hero’s Journey** (or shortened 3/4/6 recipes).
- Each beat has **visual UI** (block tile / stamp) and **meaning** (title + short description).

### Two NFT types (simple mental model)
- **Stamp** = the repeatable, edition-style collectible that fills a beat (often affordable).
- **Teaser (1/1)** = premium spotlight artwork tied to a beat (optional crown status). It can also count for the beat if configured.

### Recipes (3 / 4 / 6 / 12)
- Stories can be offered in different lengths without changing the logic:
  - **3-beat**: mini arc
  - **4-beat**: short quest
  - **6-beat**: chapter set
  - **12-beat**: full hero’s journey / epic
- UI layout adapts (grid / shrine / cascade) but the **beat numbers remain canonical**.

### Completion & rewards
- Completion does **not auto-ship** anything.
- Completion unlocks the **right to claim**:
  - Always: Chronicle NFT + generated digital Chronicle poster
  - Optional (policy): physical print redemption for 12-beat completion

---

## 3) “How it works” — the mechanics

### Beat ownership
A wallet “owns” a beat if any of the following is true (configurable):
- The wallet owns a **Stamp NFT** mapped to that story+stage
- The wallet owns a **Teaser 1/1** mapped to that story+stage
- (Optional) the wallet owns an approved **bundle / pack** token that grants the beat

### Progress calculation
For a story:
- `ownedStages = set(stages from owned NFTs)`
- `progress = ownedStages.size / totalStagesInRecipe`
- Recipe complete when `ownedStages.size >= requiredStagesCount`

### Chronicle claim
When complete:
1. User clicks **Claim Chronicle**
2. Atlas checks eligibility (on-chain ownership + not already claimed for that story/recipe)
3. Mints a **Chronicle** (or records claim off-chain if you prefer)
4. Generates:
   - Poster preview PNG for web
   - Print-ready PDF (template-driven)
5. Optionally issues a **Print Voucher** (redeem once)

---

## 4) The six logged‑in Atlas pages (user-facing admin hub)

### A) Atlas Hub (Library)
Purpose: browse stories and spotlights, and resume progress.
Key modules:
- Search + filters (culture, recipe size, status)
- “Your Journeys” summary (3/4/6/12 counts)
- Stories grid cards (progress bar + continue)
- Spotlights grid (single gods/creatures)

### B) Story Page (Journey)
Purpose: see the beat grid and pick a beat.
Key modules:
- 12-block (or recipe layout) grid with states: locked / hover / owned / teaserOwned
- Stage detail panel: title, description, owned items (stamp/teaser), marketplace links
- Filter: All / Owned / Locked

### C) Teaser Page (1/1)
Purpose: premium purchase page focused on artwork.
Key modules:
- Large artwork media
- Buy panel + license link
- Story linkage: completes Stage N
- Provenance traits + QR

### D) Stamp Detail
Purpose: edition collectible page.
Key modules:
- Stamp hero (scene/relic/type)
- Edition info (supply, price, status)
- “Completes Stage N” chip
- Related stamps for same beat (other styles)

### E) Chronicle Claim
Purpose: prove completion and claim rewards.
Key modules:
- Recipe preview filled with owned beats
- Eligibility status + missing list
- Claim button
- After claim: badge + downloads (PNG/PDF) + optional print redemption CTA

### F) Profile
Purpose: collector dashboard.
Key modules:
- Wallet header (ENS/address, network)
- Tabs: Journeys / NFTs / Chronicles
- Journeys: story cards + progress
- NFTs: filterable grid (story, stage, style)
- Chronicles: claimed list + downloads

---

## 5) Production plan (practical, step-by-step)

### Phase 0 — Decisions (1–2 hours)
- Confirm the “beat ownership rules” (stamps, teasers, bundles?)
- Confirm claim policy for prints (12-beat only? shipping charged?)
- Confirm canonical recipes: 3/4/6/12 only (recommended)

### Phase 1 — Data model & mapping (1 day)
Create a single source of truth (Google Sheet → JSON export) with:
- `story_id`, `story_title`, `culture`, `recipe_default`
- beats: `stage_number`, `stage_label`, `beat_title`, `short_desc`, `icon_key`
- NFT mappings:
  - `token_contract`, `token_id` OR `collection_slug`
  - `type` = stamp|teaser
  - `maps_to_story_id`, `maps_to_stage_number`

### Phase 2 — UI build (2–4 days)
- Build the six pages as a responsive app (iframe-ready)
- Implement states and transitions:
  - locked vs owned vs teaserOwned
- Implement filters and tabs

### Phase 3 — Wallet & security (2–4 days)
- Wallet connect (WalletConnect + ethers/viem)
- Read ownership via RPC (Alchemy/Infura) + contract ABI (primary)
- Session: Sign-in with Ethereum (SIWE) recommended

### Phase 4 — Chronicle generation (2–5 days)
- Template-based poster generation (PNG/PDF)
- Store in S3/R2 or IPFS, return download links
- Claim tracking (DB table or contract mint)

### Phase 5 — QA + launch readiness (1–2 days)
- Test recipe completion edge cases
- Mobile tap targets, performance, caching
- Verify license_url + disclosure sections

---

## 6) Codex handover — what to build, clearly

### Deliverables (definition of done)
1. Iframe-ready Atlas app with six routes:
   - `/atlas` (hub)
   - `/atlas/story/:storyId`
   - `/atlas/teaser/:slug`
   - `/atlas/stamp/:slug`
   - `/atlas/claim/:storyId`
   - `/atlas/profile`
2. Wallet auth (SIWE) + session
3. Ownership resolver:
   - Input: wallet address
   - Output: list of owned mapped beats
4. Recipe completion logic + claim gating
5. Poster generation endpoint:
   - Input: storyId + recipe + owned beat assets
   - Output: preview PNG + PDF URLs

### Suggested stack (works well for Codex)
- Next.js (App Router) + TypeScript
- Tailwind CSS (match black/gold theme)
- Ethers.js or viem for on-chain reads
- SIWE for login
- Storage: S3/R2 + signed URLs
- DB: Postgres/SQLite (claims, users, downloads)

### Repo structure (simple)
- `apps/atlas` — Next.js app (iframe embed)
- `packages/ui` — shared components
- `packages/data` — story config loader + types
- `packages/chain` — ABIs + ownership resolver
- `services/poster` — poster renderer (server-side)

### API endpoints (minimal)
- `GET /api/config/stories` → story list + metadata
- `GET /api/config/story/:storyId` → beats + mappings
- `POST /api/auth/siwe` → session
- `GET /api/owned?wallet=0x…` → owned beats list
- `POST /api/claim` → claim chronicle (idempotent)
- `POST /api/poster` → generate poster (returns URLs)

### Key edge cases
- User owns multiple items for the same beat (show both in detail panel)
- Teaser counts for beat only if mapping says so
- Claim can be done once per story+recipe (enforce server-side)
- Network mismatches (ETH vs Base) — clear UI

---

## 7) Conclusions (the “why this works” summary)
- Atlas turns your art into **collectible narrative progress**.
- Stamps keep it scalable; Teasers keep it premium.
- Recipes let you launch fast with 3/4/6 while still supporting epics (12).
- Chronicle claims create a powerful “completion moment” and a tangible artifact (poster/print).

---

## 8) What you (M) need to provide to start dev
- Final UI designs in Elementor OR screenshots per page section
- Asset bundle: story covers, beat stamps (owned/locked/minis), 12 universal icons
- Story config sheet export (CSV/JSON) for the first 3 stories
