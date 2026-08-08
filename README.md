# GlobalReach — B2B Client Discovery & Outreach CRM

Frontend scaffold: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn-style primitives.

## What's built (Phase 1–3)

- **Design system** — tokens in `app/globals.css` / `tailwind.config.ts`: Route Blue primary,
  Compass Amber accent, Fraunces/Inter/IBM Plex Mono type system, light + dark mode.
  Signature element: the "manifest chip" — a mono-set lat/long + country-code tag
  (`components/ui` pattern, see `.manifest-chip` in globals.css) used on cards, pins, and headers.
- **Shared app shell** — `app/(dashboard)/layout.tsx`: collapsible sidebar nav, topbar with
  theme toggle + Cmd+K command palette (`components/features/layout`).
- **Landing page** — `app/page.tsx`.
- **Auth screens** — `app/login`, `app/signup` (UI only, wire to NextAuth/Clerk next).
- **Dashboard overview** — `app/(dashboard)/dashboard/page.tsx` — KPI cards + activity feed.
- **Discovery / Search** — `app/(dashboard)/dashboard/discovery/page.tsx`, the core feature:
  filter sidebar, list/split/map view toggle, virtualizable lead cards, and a map view
  (`components/features/search/map-view.tsx`) plotted by real lat/lng projection.
  **This is a placeholder for `@react-google-maps/api`** — see the comment block at the top
  of `map-view.tsx` for the exact swap-in code once you have a Maps API key.
- **Client Profile** — `app/(dashboard)/dashboard/discovery/[leadId]/page.tsx`: header with
  outreach-status selector, location mini-map, organization info, contact persons, files,
  and a tabbed activity log / notes timeline (notes are addable and persist in the store).
- **Outreach Pipeline (Kanban)** — `app/(dashboard)/dashboard/pipeline/page.tsx` +
  `components/features/pipeline/`: full drag-and-drop board (dnd-kit) across
  New → Contacted → Responded → Negotiating → Won → Lost, with a drag overlay, per-column
  pipeline value, priority badges, and toast confirmation on drop. Dragging a card updates
  the same Zustand store the Discovery and Profile pages read from, so stage changes are
  reflected everywhere immediately.
- Remaining routes (Inbox, Calls, Analytics, Team, Settings) are wired and navigable but
  currently show a phase placeholder — see roadmap below.

## Getting started

```bash
npm install
npm run dev
```

Requires network access to Google Fonts at build time (`fonts.googleapis.com`) — this
sandbox's egress allowlist doesn't include it, so `next build` here needs the two lines in
`app/layout.tsx`'s font imports commented out to test locally; on a normal machine/CI it
works unmodified. Confirmed clean `tsc --noEmit` and a full `next build` (14/14 routes)
in this environment with fonts stubbed out.

## Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_API_BASE_URL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## Roadmap (build order, per brief)

1. ✅ Design system + shared layout
2. ✅ Discovery / Search + Map (mock data; swap in `@react-google-maps/api` + real API client)
3. ✅ Dashboard overview, landing, auth screens
4. ✅ Client Profile page (`app/(dashboard)/dashboard/discovery/[leadId]/page.tsx`)
5. ✅ Outreach Pipeline — Kanban board (dnd-kit), shared lead/stage state via Zustand
6. ⏭ Chat / Inbox — Socket.io client, message status, canned responses
7. ⏭ Call Center — Twilio Voice SDK, call logs, recordings, notes
8. ⏭ Analytics — Recharts funnel + rep/country/industry breakdowns
9. ⏭ Team management + Settings (billing, integrations, notifications)
10. ⏭ Real API client layer (`lib/api`) generated from an OpenAPI schema, auth middleware,
    infinite-scroll/virtualized lists for large result sets

## Structure

```
app/                      routes (App Router)
  (dashboard)/dashboard/   protected app shell + pages
components/ui/            design-system primitives (Button, Card, Badge, Input, Avatar)
components/features/      feature modules (layout, search, …)
lib/api/, lib/hooks/, lib/stores/   data layer, hooks, Zustand stores (stubs to fill in)
lib/mock/                 mock datasets used until the backend is wired up
types/                    shared domain types
```
