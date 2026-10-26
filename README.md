# Straten Lead Intelligence — Phase 14

## Advanced Qualification Intelligence

This release improves the qualification system with an explainable 100-point model:

- Ideal Client Fit — 25 points
- Marketing Need — 25 points
- Opportunity Value — 20 points
- Digital Presence — 15 points
- Evidence Strength — 15 points

Each prospect now receives:
- transparent factor scoring
- evidence statements behind each factor
- high / medium / low qualification confidence
- a “Why this lead?” summary
- strongest signal
- biggest unknown
- next best action
- evidence-based service recommendation support

## Database

No new Phase 14 database column is required. The existing `caseData` JSON field stores the expanded qualification details. Existing migration history is included so the project can recognize the Phase 12 foundation.

## Run

Copy your existing `.env` into this folder, then:

```powershell
npm install
npm run prisma:generate
npm run server
```

In a second terminal:

```powershell
npm run dev
```

When opening an older prospect, run research again to generate the new Phase 14 qualification breakdown.

## Kenya mode

The current backend behavior is intentional: `KENYA_ONLY=true` makes Kenya-only mode a server-side deployment setting. Change it to `false` and restart the backend if you later want to allow other countries. A future admin setting can make this configurable inside the application.

## Phase 15 — Deep Research & Evidence Intelligence
- Multi-page website discovery (homepage plus relevant About, Services, Projects, Properties, Blog/News and Contact pages when publicly accessible)
- Server-side research route: `GET /api/research/deep?url=...`
- Page-level metadata, headings, content snippets and research signals
- Evidence categories for coverage, video, conversion, trust, content and real-estate/project signals
- Every generated website evidence item includes source URL, snippet, collection time and confidence
- Graceful partial success: inaccessible subpages are skipped while successful pages remain available
- Qualification can use the deeper evidence already stored in the case file

Run with your existing `.env` and existing Prisma migrations. No new database migration is required for this phase.


## Phase 16 — Evidence-Weighted Qualification Accuracy

Phase 16 makes qualification accuracy depend on evidence quality rather than only the number of findings. The scoring engine now considers confidence, freshness (fresh/aging/stale), corroboration across evidence categories, and a freshness penalty for stale research. No new database migration is required; existing evidence timestamps and persisted case data are used.


## Phase 18 — Lead Discovery & Acquisition Engine

Phase 18 adds the acquisition workflow:

`DISCOVER → VERIFY → FILTER → DEDUPLICATE → RESEARCH → QUALIFY → PRIORITIZE → OUTREACH`

### What is included

- **Lead Discovery** page and dedicated **Discovery Inbox**
- Kenya-focused city searches for Nairobi, Mombasa, Kisumu and other target cities
- Target company categories:
  - Real Estate Developer
  - Real Estate Agency
  - Property Management
  - Luxury Property
  - Construction / Development
- Server-side live web discovery through the optional **Tavily Search API**
- Manual lead entry when a live discovery provider is not configured
- Kenya verification states: **Verified**, **Needs Review**, **Rejected**
- Duplicate prevention using:
  - normalized website domain
  - normalized company name
  - existing prospect records
  - existing Discovery Inbox records
- Public email/phone extraction when present in search result text
- Discovery source, source URL, snippet and discovery date
- Approve → automatically create a Prospect → automatically run website research when possible → research profile → evidence-weighted qualification → priority → service recommendation
- Rejected and duplicate leads remain traceable in the Discovery Inbox

### Configure live discovery

Add a Tavily API key to your server `.env`:

```env
TAVILY_API_KEY="your-key"
```

The key stays on the server. The browser never receives it.

### Database update

Phase 18 adds the `DiscoveryLead` table and discovery-related enums. Because this project may already have an existing local database from earlier phases, the safest local update is:

```powershell
npm run prisma:generate
npm run prisma:push
```

For a fresh production database, the included SQL migration is available at `prisma/migrations/20260823_phase18_discovery_engine/migration.sql`.

Then start the backend and frontend:

```powershell
npm run server
```

In a second terminal:

```powershell
npm run dev
```

Or run both together:

```powershell
npm run dev:all
```

If `TAVILY_API_KEY` is not configured, the Discovery Inbox and manual discovery still work. Live **Discover Companies** searches will display a clear configuration message rather than inventing leads.
