# TASKS.md — TD-Aligned Backlog & Milestones

_Last updated: 2025-10-21_

> Usage:
> - Read `PLANNING.md` first, then review this backlog.
> - Keep tasks atomic with checkboxes. Include owner (if known) and labels such as `(schema)`, `(frontend)`, `(api)`.
> - Mark items complete with commit/PR links. Add notes for follow-ups discovered during work.
> - Add new tasks immediately when scope changes or `/Guide` updates arrive.

Convention:
```
- [ ] (P0) Task title — @owner (labels)
      Notes / acceptance / links
- [x] (P0) Done task — @owner — PR #123
      Completion note
```

---

## M0 — Schema Realignment (In Progress)
- [x] (P0) Replace `Category` with `Division` + adopt `AgeGroup` enum (`JUNIOR`, `A18`, `A35`, `A50`) — @backend (schema)
      Done — local migration `20251021123000_schema_realignment_v1` + shared/front-end refactor.
- [x] (P0) Introduce `Registration` model with `entryCode` sequencing per division — @backend (schema, api)
      Done — team create/update now ensure division + registration; import/backfill tracked separately.
- [ ] (P0) Persist `Standing.quotient` (Decimal 10,4) and recalc pipeline — @backend (schema)
      Update standings calculator + tests; ensure quotient surfaces on public/TD APIs.
- [x] (P0) Add `plannedCourtCount` to `Tournament` and seed `Court` rows 1..N on create — @backend (schema)
      Done — field added in schema/migration; seeding logic pending follow-up task.
- [x] (P0) Refresh public views (`public_*_v`) to expose `entryCode`, `quotient`, schedule data, kiosk hints — @db (views)
      Done — migration `20251021124500_update_public_views_v1` updates views + RLS grants.
- [x] (P0) Sync shared enums/types (`@matchpoint/types`) with new schema (AgeGroup, Division, Registration DTOs, slugged routes) — @shared (types)
      Done — enums, public/team/match/queue schemas updated; front-end consuming new fields.
- [ ] (P0) Update REST routes to `/api/v1/...` slug-first pattern (maintain temporary shims) — @backend (api)

---

## M1 — Import & Registration Flow
- [ ] (P0) Build consolidated CSV import API (`/api/v1/tournaments/:slug/import`) with player/team/registration dedupe — @backend (api)
      Parse columns per `/Guide`; log warnings for partial dedupe; transactional upsert.
- [ ] (P0) TD console upload UI with validation, preview diff, and undo on failure — @frontend (app)
- [ ] (P0) Export endpoints/files for players, teams, brackets, schedules, score sheets — @backend (api)
- [ ] (P1) Audit logging for import operations (before/after snapshots) — @backend (ops)

---

## M2 — Brackets & Scheduling
- [ ] (P0) Enhance `Bracket.config` to capture rounds/groups/bestOf/winBy2/finalsReset + editor UI — @frontend @backend (app)
- [ ] (P0) Multi-bracket generator with custom group counts and preview diff — @shared (algorithms)
- [ ] (P0) Scheduling workspace: assign matches to courts/times, detect conflicts, support bulk reschedule — @frontend (app)
- [ ] (P1) Undo/redo + audit log integration for bracket/schedule operations — @shared (dx)
- [ ] (P1) Printable bracket & schedule layouts (PDF/print CSS) — @frontend (print)

---

## M3 — Queue & Live Scoring
- [ ] (P0) Wire queue reorder/actions to new `/api/v1/queue` endpoints with OCC + error surfacing — @frontend (app)
- [ ] (P0) Integrate scoreboard and live match pages with real match/team data (no mocks) — @frontend (app)
- [ ] (P0) Automate match status transitions (queued → ready → in progress → completed) with socket fan-out — @backend (api)
- [ ] (P1) Director dashboard data hydration (courts, alerts, queue snapshot, standings) — @frontend (app)
- [ ] (P1) Printable score sheet generation tied to bracket config (best-of, win-by-2) — @frontend (print)

---

## M4 — Public & Kiosk Experience
- [ ] (P0) Build `/public/[slug]/{overview,brackets,standings,queue,players,table}` with kiosk toggle + auto-refresh — @frontend (public)
- [ ] (P0) Update public APIs to include kiosk metadata (entryCode, court labels, filters) — @backend (api)
- [ ] (P0) SEO + structured data (Event schema) + sitemap/robots for public surfaces — @frontend (seo)
- [ ] (P1) TV rotation mode (cycle queue/standings) + offline-safe fallback messaging — @frontend (public)

---

## M5 — Hardening & Ops
- [ ] (P0) CI shadow DB + `prisma migrate diff` gate — @devops
- [ ] (P0) Observability: Pino structured logs, error tracking (Sentry), uptime checks — @devops
- [ ] (P0) Backup/restore drill (Supabase PITR or dumps) documented — @devops
- [ ] (P1) Load testing for public APIs + queue actions; tune indexes/views — @devops @db
- [ ] (P1) Accessibility audit (axe) across TD console and kiosk modes — @frontend (a11y)
- [ ] (P1) Runbooks for TD operations, import troubleshooting, kiosk setup — @docs

---

## Cross-Cutting / Continuous
- [ ] (P0) Standardize undo/redo + audit log utilities for TD operations — @shared (dx)
- [ ] (P0) Document environment setup (env vars, seeding, running API + web) — @docs
- [ ] (P0) Replace remaining Supabase client usages with Prisma (track exceptions) — @backend
- [ ] (P1) Ensure Socket.IO events documented and typed (`standing.updated`, `queue.updated`, etc.) — @shared

---

## Completed Pre-Realignment (2025-10-15 → 2025-10-20)
- [x] (P0) Initial Prisma tournament models, queue OCC, public GET endpoints, and Vitest coverage.
- [x] (P1) TD UI prototypes: director dashboard, live scoreboard, queue DnD client, players/teams management enhancements.

> Maintain this section for context only; future completions should include commit/PR references.
