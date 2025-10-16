# PLANNING.md — Vision, Architecture, Roadmap

_Last updated: 2025-10-21_

> Start every session here. Pair this document with `GPT5.md` (ground rules), `TASKS.md` (execution), and the `/Guide/*.md` briefs from the Tournament Director (TD). Keep it short, decision-oriented, and repo-aware.

---

## 1) Vision & Outcomes (v1)
- Deliver a **TD-first pickleball match control app** that handles the entire on-site workflow: register teams, build flexible brackets, schedule courts, queue matches, capture scores, and export/print artifacts without spreadsheets.
- Provide **kiosk-ready public views** (queue/standings/brackets/players) that auto-refresh and are safe for spectators to access without login.
- Make the UI resilient for volunteers under time pressure: keyboard shortcuts, undo/redo, autosave, printable score sheets, and quick data import/export.

**In scope**
- Entities: Tournaments, Divisions, Registrations (with `entryCode`), Players, Teams, Brackets (SE/DE/RR), Matches, Courts, Queues, Standings, Schedules, Audit Log.
- CSV/JSON import (single sheet with dedupe) and export/print for brackets, schedules, score sheets.
- Live scoring with automatic queue progression and public kiosk displays.

**Explicit non-goals (v1)**
- Automated seeding/ratings, pool seeding logic, payments, player self-service mobile apps.
- Advanced RBAC beyond a single TD admin plus public read-only access.

**Success criteria**
- Run a 64+ player / 32+ team event across ≥6 courts in one day without spreadsheet fallbacks.
- Create and queue a follow-up match within **< 2 minutes** of recording a result.
- No data loss on refresh; autosave all critical actions; exports/printouts are tournament-ready.

---

## 2) Users & Roles
- **Tournament Director (TD)**: single authenticated admin. Full CRUD over tournaments, divisions, brackets, matches, courts, queues, and exports. Needs undo/redo, audit trail, keyboard shortcuts.
- **Spectator/Public**: unauthenticated. Read-only kiosk/web views for brackets, standings (with quotient), court assignments, queue, players. Large-type display for TVs via `?kiosk=1`.

Implications: minimal auth (TD login only), aggressive caching for public endpoints, Socket.IO fan-out for live data.

---

## 3) Architecture & Data Flow
**Monorepo (pnpm workspaces)**
```
apps/
  web/   # Next.js app router — TD console + public/kiosk pages
  api/   # Express + Socket.IO — REST + realtime
packages/
  ui/      # shared shadcn components
  types/   # Zod schemas, enums, DTOs
  config/  # runtime config + env validation
```

**Key flows**
1. **TD Console** (`/app/*`) → authenticated REST (`/api/v1/tournaments/:slug/...`) → Prisma (Supabase Postgres) → emits Socket.IO events + audit log.
2. **Public/Kiosk pages** (`/public/[slug]/*`) → read-only views (`public_*_v`) → auto-refresh + sockets for `queue`, `match`, `standing` updates.
3. **Import pipeline**: consolidated CSV uploaded via `/api/v1/tournaments/:slug/import` → dedupe players, teams, registrations → generate `entryCode`.
4. **Queue**: match creation auto-enqueues; OCC reorder + per-item actions (send/pull/ready) update matches/courts.

**Data ownership & access**
- Use Prisma for all entity CRUD. Supabase client limited to auth paths; document any exception.
- Schema alignment: `Division` replaces legacy `Category`; `AgeGroup` enum (`JUNIOR`, `A18`, `A35`, `A50`); `Standing.quotient` persisted; `Registration.entryCode` unique per division.
- Public queries only via views; include `entryCode`, `quotient`, schedule, and kiosk hints.

---

## 4) Technology & Quality Guardrails
- **Frontend**: Next.js 14 (App Router), React 18, React Query/SWR, Tailwind + shadcn/ui, dnd-kit, Socket.IO client, Zod forms, printing layouts, kiosk toggles.
- **Backend**: Express, Prisma, Supabase Postgres, Socket.IO, Pino logging, Zod validation, CSV parsing (Papa.js or fast-csv).
- **Testing**: Vitest + Supertest (API), targeted Playwright for kiosk + queue flows, axe a11y checks, contract tests for import/reporters.
- **Ops**: Supabase project, Vercel/Render deployments, shadow DB check in CI, structured logs, backups (PITR or nightly dump).

---

## 5) Environment & Config
- `.env` parity across web/api; ensure `NEXT_PUBLIC_API_BASE`, `API_BASE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`, `SHADOW_DATABASE_URL` are documented.
- Centralize runtime config validation in `packages/config`; fail fast on missing slug/API base.
- CORS: allow TD domain, local dev, and kiosk endpoints; verify Socket.IO origins.

---

## 6) Milestones (TD-aligned Roadmap)
- **M0 — Schema Realignment**: introduce `Division`, `AgeGroup` enum update, `Registration.entryCode` sequencing, `Standing.quotient`, `plannedCourtCount`, migrations + data backfill plan.
- **M1 — Import & Registration Flow**: CSV dedupe pipeline, TD upload UI, entry-code generator, audit logging, API docs.
- **M2 — Brackets & Scheduling**: `Bracket.config` support for custom groups/rounds, undo/redo for placement, court scheduling tools, printable brackets & schedules.
- **M3 — Queue & Live Scoring**: OCC queue actions, match status automation, scoreboard integration, director dashboards wired to live data.
- **M4 — Public/Kiosk Experience**: `/public/[slug]/*` pages with kiosk mode, auto-refresh, structured data, export/print enhancements.
- **M5 — Hardening**: a11y/axe pass, load tests, monitoring/error tracking, backup drills, docs/runbooks.

Revisit milestones whenever `/Guide` updates land; update `TASKS.md` accordingly.

---

## 7) Session Ritual (link to GPT5.md)
1. Read this planning doc and `/Guide` for any new TD direction.
2. Review `TASKS.md`; select P0/P1 items or add missing tasks.
3. Publish a short execution plan before coding.
4. Mark tasks complete with commit/PR links and note new work discovered.

> If reality diverges from this plan, update it in the same PR as your implementation.
