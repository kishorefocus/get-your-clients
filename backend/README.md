# B2B Client Discovery & Outreach CRM — Backend

A multi-tenant FastAPI backend for a global B2B client-discovery and outreach
CRM: geospatial search over business/lead records, real-time chat, a
configurable pipeline/kanban, and an ingestion pipeline for populating the
client dataset. Built as a modular monolith (`app/modules/{auth,orgs,clients,
pipeline,chat,ingestion}`) so any module can be extracted into its own
service later without a rewrite — the calling/chat module is the most
likely first candidate, per the original spec.

## What's built and verified

Everything below was not just written but actually **run against a real
Postgres+PostGIS, Redis, and Celery worker** in the environment this was
built in — registering an org, creating clients with coordinates, running a
geospatial radius search, moving a client through a kanban board, opening
two WebSocket connections and confirming a chat message fans out between
them via Redis pub/sub, and uploading a CSV that gets deduped and geocoded
by a background worker. Three real bugs were caught and fixed this way (see
"Bugs found while testing" below) that a code read-through alone would very
likely have missed.

- **Auth + multi-tenant scaffolding** (build order step 1): JWT access +
  refresh tokens, `/register` (creates an org + its first admin user),
  `/login`, `/refresh`, `/me`. RBAC via `require_role("manager")`-style
  dependencies, rank-ordered rep < manager < admin.
- **Client + Industry data model + CRUD** (step 2): `Client` rows can belong
  to an org, or be part of a shared global dataset (`org_id IS NULL`, e.g.
  sourced from Google Places before any org has claimed it) — every query
  filters on this at the repository layer, not just in the router, so
  tenant isolation doesn't depend on every route remembering to check it.
- **Geospatial search** (step 3): `POST /api/v1/clients/search` does radius
  search (`ST_DWithin`/`ST_Distance`) or bounding-box search over the
  PostGIS `geography` column, with cursor-based pagination. If a `keyword`
  is present, it asks Elasticsearch for a relevance-ranked ID list and uses
  that to order the Postgres results; if ES is down, it falls back to a
  plain `ILIKE` filter instead of failing the request outright.
- **Ingestion pipeline** (step 4, partial): CSV upload → validate → Celery
  task does fuzzy dedupe (`rapidfuzz` token-sort-ratio on normalized
  name+address, scoped to the same city) → geocode via Google Geocoding API
  → insert → best-effort Elasticsearch reindex. Google Places batch
  enrichment (`app/modules/ingestion/google_places.py`) is written and
  keeps only the fields that are typically safe to cache long-term under
  Google's Places ToS (name, address, coordinates, phone, website, rating,
  place_id) — **you should confirm the current terms yourself before
  shipping**, since Claude can't verify live ToS at build time. There's no
  Celery Beat schedule pre-populated with real category/location grid
  cells; that's a product decision (which cities/industries to prioritize)
  more than an engineering one.
- **Pipeline/kanban** (step 5): configurable per-org stages, move-client
  endpoint, board view grouped by stage.
- **Chat (WebSocket)** (step 6): `/ws/chat/{thread_id}`, backed by Redis
  pub/sub so any pod can serve any thread — verified with two concurrent
  connections on the same thread.
- **Compliance fields baked into the schema now** (per the spec's
  recommendation): `consent_status` / `opt_out_at` on both `Client` and
  `Contact`, `source` / `source_ref` / `last_verified_at` for
  provenance/freshness, and an append-only `audit_logs` table with a
  `record()` helper called from the service layer (not the router) for
  every client view/create/update/delete/search.
- **Rate limiting**: a global per-token/per-IP middleware (loose, just to
  stop runaway scripts) plus a tighter per-org limit on the CSV import
  endpoint as an example of layering a stricter limit on a specific
  sensitive action. The same `enforce_rate_limit()` helper is what you'd
  call on the calling/SMS/email endpoints once they exist.

## What's genuinely stubbed, and why

- **Calling (Twilio) module — build order step 7.** The `Call` model and
  `Interaction` rows that would reference it exist, but there's no router,
  no Twilio webhook handler, and no outbound-call trigger. This is a real
  integration project on its own (TwiML, recording storage, status
  callbacks, TCPA-consent gating before every outbound call) and wiring it
  up incorrectly is worse than not wiring it up — better to build this as
  its own focused pass once you've picked a provider and reviewed their
  calling-consent requirements for the countries you operate in.
- **Analytics/reporting endpoints — step 8.** Deliberately not built. What
  "analytics" means here (pipeline conversion rates? rep leaderboards? cost
  per lead by source?) is a product decision, and building the wrong
  aggregation endpoints would be wasted work.
- **Outreach email sequences.** `send_outreach_email_step` in
  `app/workers/tasks.py` raises `NotImplementedError` on purpose — sending
  real outreach email needs sender-domain verification, unsubscribe-link
  injection, and bounce/open webhook wiring specific to whichever of
  SendGrid/Postmark you pick.
- **Member invites are not emailed.** `POST /organizations/members/invite`
  creates the user and returns a temporary password directly in the API
  response (fine for internal/admin use, not fine as a real invite flow) —
  wire it to your email provider once that's chosen.

## Bugs found and fixed while testing (worth knowing about)

1. **`passlib==1.7.4` + recent `bcrypt`**: passlib's backend-detection
   throws `ValueError: password cannot be longer than 72 bytes` on the
   *first* password hash, unrelated to password length — a real
   version-incompatibility bug, not a validation issue. Fixed by pinning
   `bcrypt==4.0.1` in `requirements.txt`.
2. **Async SQLAlchemy engine + Celery**: a module-level `create_async_engine()`
   pools asyncpg connections bound to whichever event loop created them.
   Celery tasks each get a fresh loop via `asyncio.run()`, so the second
   task to run would fail with `Future attached to a different loop`. Fixed
   by disposing the engine (and the cached async Elasticsearch client) at
   the end of every task in `app/workers/tasks.py::_run`.
3. **Missing REST endpoint to create a chat thread.** The WebSocket
   endpoint needs a `thread_id`, but nothing in the original module list
   exposed a way to get one for a given client — added
   `POST /api/v1/chat/threads/by-client/{client_id}`.

## Running it locally

```bash
cp .env.example .env    # fill in GOOGLE_MAPS_API_KEY etc. as you get them
docker compose up --build
```

This starts Postgres+PostGIS, Redis, Elasticsearch, the API (`:8000`), and a
Celery worker + beat. Then, in a separate shell:

```bash
docker compose exec api alembic upgrade head
```

API docs: `http://localhost:8000/docs`. Health check: `GET /health`.

### Quick smoke test

```bash
curl -X POST localhost:8000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"org_name":"Acme","email":"admin@acme.io","password":"testpass123"}'
# use the returned access_token as a Bearer token for everything else
```

## Suggested next steps, in order

1. Run the initial migration against a real environment and seed a starter
   `Industry` taxonomy (the model supports hierarchy; nothing seeds it yet).
2. Pick and integrate one email provider end-to-end (auth invite emails
   double as a good first test of that integration).
3. Twilio calling module — confirm calling-consent requirements per country
   you'll operate in before writing the outbound-call trigger.
4. Analytics endpoints, once you know which metrics the frontend team
   actually wants first.
5. Swap the CSV-import dedupe's "pull city candidates into Python" approach
   for a `pg_trgm` similarity query once any single city passes roughly
   50k client records — the migration already enables the `pg_trgm`
   extension in anticipation of this.
