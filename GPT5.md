# GPT5.md — Development Ground Rules (Repo‑Aware)

> Binding rules for all future GPT‑5 coding sessions on the Match Control App. This file is **authoritative** and derived from the latest PRD (repo‑aware, 2025‑10‑14).

---

## 0) Prime Directives (MUST FOLLOW)
1. **Always read `PLANNING.md` at the start of every new conversation.**
2. **Check `TASKS.md` before starting any work.**
3. **Mark completed tasks immediately in `TASKS.md` with PR/commit links.**
4. **Add newly discovered tasks to `TASKS.md` as you work.**

If `PLANNING.md` or `TASKS.md` are missing or outdated, **create/update them as your first action** and record that in the session plan.

---

## 1) Scope & Architecture (Authoritative Summary)
- **Vision**: TD-first pickleball match control that runs brackets end-to-end on-site — create tournaments, register teams, build custom brackets, schedule/queue courts, capture scores, and export/print everything without spreadsheets.
- **In-scope (v1)**: Players, Teams, Divisions, Brackets (SE/DE/RR), Courts, Schedules, Queues, Score sheets, CSV/JSON import/export, kiosk-friendly public views, audit trail / undo.
- **Non-goals (v1)**: Auto seeding/ratings, pool-play seeding logic, payments, player mobile app, advanced RBAC (single TD admin + public read-only only).
- **API style**: Slug-first REST (`/api/v1/tournaments/:slug/...`) with consolidated import endpoint; Socket.IO for live queue/match updates; public read-only endpoints behind views.
- **Frontend focus**: Director desktop/tablet UI with keyboard shortcuts and resilient autosave, plus kiosk/TV modes for queue/standings/scoreboard.
- **Architecture**: Monorepo (Next.js app router + Express/Prisma API + shared packages) with Supabase Postgres, Tailwind/shadcn UI, Socket.IO, Zod contracts, Vitest/Supertest tests.

**Monorepo Layout**
```
apps/
  web/   # Next.js (director + public surfaces, kiosk modes)
  api/   # Express + Socket.IO (REST + realtime)
packages/
  ui/      # shared components
  types/   # shared TS types + Zod schemas
  config/  # runtime config + schema validation
```

---

## 2) Session Startup Checklist (Run EVERY session)
- [ ] Open and **read `PLANNING.md`**; summarize today’s objective(s).
- [ ] Open and **check `TASKS.md`**; list tasks you will work on; add missing tasks.
- [ ] Review `/Guide/*.md` for any newly published TD direction; call out drift if guidance changed.
- [ ] Verify env & schema: `.env.example` parity, `prisma migrate status`, shadow DB ready.
- [ ] Run `pnpm -w typecheck && pnpm -w lint` (and minimal API/SSR health checks).
- **Post a short plan** referencing tasks to add/modify/close before coding.

`TASKS.md` conventions:
```
- [ ] task: short description (owner?) (labels)  
      notes/links
- [x] task: done — PR #123 / commit abcdef
```

## 2a) Session Summary (2025-10-15)
- Added tournament-domain Prisma models (`Tournament`, `Category`, `BracketGroup`, `Bracket`, `Match`, `QueueItem`, `Notification`, `PublicSettings`) and applied migrations `20251014223058_create_tournament_models` and `20251014224426_add_core_indexes`.
- Enforced core indexes/constraints: `(tournamentId, categoryId)` on `Bracket`, `(groupId, position)` and unique `matchId` on `QueueItem`; wired `Bracket`→`Category` and optional group links.
- Created shared enum module (`packages/types`) exporting `Gender`, `AgeGroup`, `DivisionType`, `Level`, `BracketFormat`, `MatchStatus`, `NotificationType`; refactored `lib/types` and players UI to consume shared values.

### 2025-10-16
- Added migration `20251015090000_create_public_views_rls` to publish sanitized `public_*_v` views, enforce table-level RLS, and grant anon/auth SELECT only through those views.
- Linked teams to tournaments via migration `20251015094000_link_teams_to_tournaments`, refreshing `public_teams_v` with slug context.
- Introduced `/api/public/tournaments/:slug` (plus `/matches`, `/brackets`, `/standings`, `/teams`) backed by the new views and returned through consistent JSON mappers.
- Scaffolded public Next.js routes under `/t/[slug]` (layout + overview/brackets/standings/matches/teams) consuming the public API with graceful fallback states; sockets and richer UI left for follow-up.
- Updated `TASKS.md` to capture completed backend/public work and tracked remaining frontend/socket items.
- Implemented tournament-aware Socket.IO helpers, match CRUD broadcasting (`match.updated`/`score.updated`), auto-enqueueing queue items on match creation, and `/api/queue/reorder` with optimistic concurrency + event fan-out.
- Wired `/t/[slug]` overview/matches/teams pages to hydrate from the public APIs, subscribe to socket events, and reconcile queue/match/team updates live on the client.
- Replaced the director queue page with live queue/match wiring: `/queue` now hydrates via public APIs, listens for `queue.updated` socket events, and persists reorder operations back to `/api/queue/reorder` with OCC handling.

### 2025-10-18
- Added Vitest + Supertest smoke coverage for all public tournament GET endpoints with shared server helpers tolerant of sandbox socket limits; recorded completion in `TASKS.md`.
- Extended queue action unit coverage and introduced `/api/queue/reorder` optimistic concurrency tests asserting transactional updates and socket fan-out; backlog updated accordingly.
- Verified new specs via `npm test` inside `server/` (tests pass locally outside sandbox constraints).
- Introduced shared Zod schemas in `@matchpoint/types` for player/team contracts, refactored Express routes to validate against them, and aligned frontend fetchers with the standardized error envelope helper.
- Expanded shared contracts to cover queue actions/reorder payloads, wired the queue routes into those schemas, and noted remaining schema work for matches/auth/public APIs in `TASKS.md`.

### 2025-10-20
- Prototyped the director dashboard around a new `AppLayout`, shipping courts overview, queue preview, alerts, and tournament standings panels that mirror the latest design mocks and use shared mock data helpers for demo content.
- Delivered a full-screen court scoreboard experience (contrast toggle, QR overlay hooks, responsive typography) and wired it into `/scoreboard` alongside refreshed scoreboard/card primitives for reuse on director views.
- Expanded director player & team management flows with filtering/sorting, add/edit/delete dialogs, check-in toggles, and API error handling; reused shared fetchers/types, tightened navigation/role-guard behavior, and upgraded toast utilities to support the richer UX.

### 2025-10-21
- Reviewed `/Guide` updates from the TD and realigned scope: clarified v1 focus on TD + public roles, CSV import/export, entry-code sequencing, kiosk-friendly public pages, and slugged REST APIs.
- Captured data model shifts (AgeGroup enum with A50, Registration entry codes, standings quotient) plus slug-first REST patterns for the upcoming schema/prisma rework.
- Queued follow-up planning/TASKS updates to replace legacy roadmap items with TD-aligned milestones (import pipeline, bracket config, standings quotient, kiosk views).
- Began schema realignment: replaced `Category` with `Division`, introduced `Registration`, `Standing`, `Court`, upgraded Prisma schema/migration, and refactored shared types + queue/bracket/standings clients to consume the new AgeGroup/A50 and numeric court identifiers.

### 2025-10-22
- Extended the division-first schema work: team create/update now seeds `Division` + `Registration` entries and returns entry codes/registrations; public views/types/UI consume the richer division metadata and numeric court ids.
- Added mock-based coverage for the `/api/teams` flow (division + entry code sequencing); Vitest currently times out in the sandbox, so rerun locally to confirm.

---

## 3) Data & Database Rules (Prisma on Supabase Postgres)
**Core entities (align with TD v1 scope)**
- `Tournament(id, slug, name, startDate?, endDate?, venue?, plannedCourtCount?, isPublic, kioskToken?, createdAt, updatedAt)`
- `Division(id, tournamentId, name, ageGroup:AgeGroup, level, format?, createdAt, updatedAt)` — replaces legacy `Category`.
- `Court(id, tournamentId, label, isActive, createdAt, updatedAt)` — seeded off `plannedCourtCount`, editable later.
- `Player(id, firstName, lastName, gender?, dateOfBirth?, createdAt, updatedAt)` — no free-form `notes`.
- `Team(id, name?, type, createdAt, updatedAt, members[TeamPlayer])`
- `Registration(id, divisionId, teamId, entryCode, seedNote?, createdAt)` — `entryCode` unique per division (pattern `18MDInt_001`).
- `Bracket(id, divisionId, name, type, config, locked, createdAt, updatedAt)` — `config` stores rounds, groups, bestOf, winBy2, finalsReset, RR metadata.
- `Match(id, bracketId, round, matchNumber, status, scheduledAt?, courtId?, scoreJson, meta, createdAt, updatedAt)`
- `Standing(id, bracketId, teamId, wins, losses, pointsFor, pointsAgainst, quotient, rank?)`
- `QueueItem(id, tournamentId, matchId, courtId?, position, version, createdAt, updatedAt)`
- `Notification(id, tournamentId, type, title, body, read, createdAt)`

**Enums & shared constants**
- `AgeGroup`: `JUNIOR`, `A18`, `A35`, `A50` (map to TD wording: Junior, 18+, 35+, 50+).
- `DivisionType`: `MS`, `MD`, `WS`, `WD`, `XD`.
- `Level`: `NOV`, `INT`, `ADV`, `OPN` (surface labels `Nov|Int|Adv|Opn`).
- `MatchStatus`: `PENDING`, `READY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- Keep enums in `@matchpoint/types/enums` and align Prisma + UI imports.

**Indexes & constraints**
- `Registration`: `@@unique([divisionId, entryCode])`; keep FK to `Team` + `Division`.
- `QueueItem`: unique `(matchId)`; maintain OCC `version` counter.
- `Standing`: unique `(bracketId, teamId)`; ensure `quotient` persists as `Decimal(10,4)`.
- Use `(divisionId, name)` indexes for brackets; `(tournamentId, isActive)` on courts.

**RLS & public views**
- Public read-only queries flow through `public_*_v` views; extend to surface `entryCode`, standings `quotient`, schedule tables, and kiosk toggles.
- No anonymous access to base tables; TD/admin API remains authenticated.

**Migrations**
- All schema evolution via Prisma migrations with shadow DB checks.
- Schema rename/repoint (`Category`→`Division`, `AgeBracket`→`AgeGroup`) must include data backfill scripts and documentation.
- When adopting new entry-code logic, add transactional helper or DB function to keep sequences collision free.

**Data access rule**
- Prefer Prisma for all reads/writes. If Supabase client remains for auth-protected tables, document rationale in `PLANNING.md` and track consolidation work in `TASKS.md`.

---

## 4) API Rules (Express)
**Slug-first routes**
- Public: `/api/v1/public/:slug/{overview|brackets|standings|matches|players|queue}` (JSON mirrors kiosk pages, includes `entryCode` + `quotient`).
- Admin: `/api/v1/tournaments/:slug` (GET/PATCH), `/api/v1/tournaments/:slug/import` (CSV), `/api/v1/tournaments/:slug/courts`, `/api/v1/tournaments/:slug/divisions`, `/api/v1/tournaments/:slug/queue`.
- Legacy `/api/public/tournaments/:slug/**` stays temporarily but must be migrated to `/api/v1/public/:slug/**`.

**TD mutations**
- Match lifecycle: `POST /api/v1/tournaments/:slug/matches` (create with auto queue), `PATCH /api/v1/matches/:id` (score/status updates).
- Queue: `POST /api/v1/queue/reorder` (bulk OCC), `POST /api/v1/queue/:id/action` (send/pull/ready).
- Registration: `POST /api/v1/tournaments/:slug/registrations` (generates `entryCode`), `PATCH /api/v1/registrations/:id`.
- Courts/Schedule: `PATCH /api/v1/courts/:id`, `POST /api/v1/schedule/bulk`.

**Contracts**
- Validate with **Zod** (shared in `packages/types`).
- Mutations accept `Idempotency-Key`.
- Standard error envelope: `{ error: { code, message, details? } }`.
- Pagination: cursor where appropriate; stable ordering.
- Rate limiting on public GETs.

**Sockets**
- Rooms: `public:tournament:{id}` and `private:tournament:{id}`.
- Events: `score.updated`, `queue.updated`, `match.updated`, `standing.updated`, `notification.created`.

---

## 5) Frontend Rules (Next.js / React)
- Director surfaces under `/app/*`; public/kiosk under `/public/[slug]/{overview,brackets,standings,queue,players,table}` with `?kiosk=1` for large-type TV mode.
- Data layer: React Query/Server Actions backed by slugged REST; optimistic queue reorder; autosave for TD forms; reuse Zod schemas for validation.
- DnD with **dnd-kit** (bracket placement, queue ordering) and keyboard access.
- Accessibility: dialogs and kiosk modes must pass WCAG 2.1 AA; ensure readable print layouts.
- Performance budgets: SSR TTFB p95 < 1s; LCP < 2.5s; kiosk auto-refresh ≤30s without layout shift.
- SEO: sitemap + `robots.txt`; public pages never leak private data; embed structured data for events when trivial.

---

## 6) Queue 2.0 (Authoritative Behavior)
- On **match create** → create `QueueItem(position = max+1)` scoped to tournament.
- Reorder via single PATCH with new order and `version` for OCC.
- Server emits `queue.updated`; clients reconcile or refetch on version conflict.
- Global queue + per‑court sub‑queues; bulk actions: send to court, pull, mark ready.

---

## 7) Standings (Division → Bracket)
- Persist standings rows with `wins/losses`, `pointsFor/Against`, and `quotient = pointsFor / max(1, pointsAgainst)`.
- Default tiebreakers: **Head-to-head → Quotient → Point Differential → Points For**; make configurable per tournament.
- Recompute standings within 1s of match finalization and broadcast `standing.updated` to sockets + revalidate public caches.

---

## 8) Multi‑Bracket Generator
- Input: registered teams (with `entryCode`, division metadata) and TD intent (group counts or target size, avoid duplicate clubs, optional late add).
- Output: one or more `Bracket` records with `config.groups` populated (e.g., 3 groups × 3 teams) plus seeded matches; support SE/DE/RR.
- Provide preview diff (before/after) with undo; validate minimum per bracket and highlight byes.

---

## 9) Testing & CI (Non‑Negotiable)
- Unit: bracket generation, standings tiebreakers, queue reorder/OCC.
- Route smoke tests; Zod contract tests for all endpoints.
- E2E: public pages render + live update; DnD queue flows.
- A11y: axe checks for critical pages.
- CI gates: `typecheck`, `lint`, `test`, `prisma migrate diff`, **shadow DB check**. **Failing CI cannot merge.**

---

## 10) Observability & Ops
- Structured logs (pino) with request IDs; surface codes in UI toasts.
- Error tracking for API and Web; uptime checks for public endpoints.
- Backups: Supabase PITR or nightly dumps; document restore.

---

## 11) Security & Privacy
- Enforce least privilege via RLS; anonymous users read **views only**.
- Consider initials for minors on public pages if required.
- CSV import: strict validation, **dry‑run mandatory**, line‑level errors.

---

## 12) Git & Issue Workflow (Ties to PLANNING/TASKS)
- Branch: `feat/<area>-<short>`, `fix/<area>-<short>`, `chore/<area>-<short>`.
- PR template: summary, screenshots, migrations, tests, risks, checklist.
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:` …).

**Tasks Discipline (Prime Directives applied)**
- Before coding: **read `PLANNING.md`**, then **check `TASKS.md`**.
- While coding: **add newly discovered tasks** to `TASKS.md`.
- On completion: **mark tasks done immediately** with notes and PR links.

---

## 13) Definitions of Done
- [ ] PRD acceptance criteria satisfied.
- [ ] Types + Zod schemas updated and exported.
- [ ] Prisma migration added; applied locally; CI shadow check passes.
- [ ] RLS reviewed and updated when access changes.
- [ ] Unit/route/e2e tests added/updated; CI green.
- [ ] Docs updated: `PLANNING.md` (scope), `TASKS.md` (status), `README`/`MIGRATIONS.md` (schema notes).

---

## 14) Prohibited / Anti‑Goals
- Reintroducing legacy seeding/pools UIs or KPI tiles dashboard.
- Anonymous access to base tables or private events.
- Unvalidated inputs or non‑standard error payloads.

---

## 15) Quick‑Reference Flows
**Public Update Path**
1) Score posted → validate → persist → emit `score.updated`.
2) Recompute standings → invalidate cache/materialized view → broadcast.
3) Public pages (SSR+SWR) show update within ≤2s.

**Queue Reorder Path**
1) Client computes order → PATCH with `version`.
2) Server OCC apply → emit `queue.updated`.
3) Clients reconcile; refetch on conflict.

---

## 16) Enforcement
This file is the guardrail. If PRD changes, **update `GPT5.md` in the same PR** and adjust `PLANNING.md`/`TASKS.md`. Sessions that do not follow the **Prime Directives** must first correct `PLANNING.md` and `TASKS.md` before proceeding.
