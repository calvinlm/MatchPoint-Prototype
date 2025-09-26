
# Match Control Backend (Express + Supabase + Socket.IO + Cloudinary)

A minimal, production-ready backend scaffold to pair with your React (Vercel) frontend.

- **Auth**: Supabase Auth (verify JWTs via `GET /api/me` and middleware)
- **DB**: Supabase Postgres (via `@supabase/supabase-js`)
- **Realtime**: Socket.IO hosted with the same Express server
- **Storage**: Cloudinary (client uploads directly using a server-generated signature)
- **CORS**: Lock to your Vercel domain(s)

## 1) Prereqs

- Node 18+
- A Supabase project (grab URL + **anon** + **service role** keys)
- A Cloudinary account (cloud name + API key + secret)

## 2) Setup

```bash
cp .env.example .env
# fill in values
npm install
npm run dev
# open http://localhost:8080/health
```

Set `ALLOWED_ORIGINS` to your local React dev URL and your Vercel domain, e.g.:  
`ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app`

## 3) Supabase Tables & Policies

Create table **matches** (SQL example):
```sql
create extension if not exists "uuid-ossp";

create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null default auth.uid(),
  title text not null default 'Untitled',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "Individuals can view their matches"
  on public.matches for select
  using (owner_id = auth.uid());

create policy "Individuals can insert their matches"
  on public.matches for insert
  with check (owner_id = auth.uid());

create policy "Individuals can update their matches"
  on public.matches for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Individuals can delete their matches"
  on public.matches for delete
  using (owner_id = auth.uid());
```

> The backend queries pass the user's JWT to Supabase, so RLS applies automatically.

## 4) Auth Flow (Frontend Summary)

- Frontend signs in/up via Supabase Auth JS SDK.
- For **protected API routes**, include `Authorization: Bearer <access_token>` from Supabase session.
- Backend middleware (`requireAuth`) verifies the token with `supabase.auth.getUser(token)` and attaches `req.user`.

Test:
```bash
curl http://localhost:8080/api/me -H "Authorization: Bearer <token>"
```

## 5) REST API

- `GET /health` — liveness check
- `GET /api/me` — returns the current Supabase user (requires `Authorization` header)
- `/api/matches` (protected; RLS-enforced)
  - `GET /api/matches` — list your matches
  - `POST /api/matches` — create match `{ title, status }`
  - `GET /api/matches/:id` — read one
  - `PUT /api/matches/:id` — update
  - `DELETE /api/matches/:id` — remove

## 6) Cloudinary Direct Upload

The client calls:
```
GET /api/upload/signature  (with bearer token)
```
The response returns `signature`, `timestamp`, `cloudName`, `apiKey`, and `folder`.

Then the client uploads **directly to Cloudinary**:
```
POST https://api.cloudinary.com/v1_1/<cloudName>/auto/upload
form fields: file, api_key, timestamp, folder, signature
```

The upload result includes `secure_url` which you can store in Supabase.

## 7) Socket.IO Usage

On the client:
```js
import { io } from 'socket.io-client'
const socket = io(API_BASE, { withCredentials: true })

// join a match room
socket.emit('join_match', matchId)

// listen for score updates
socket.on('score_update', (payload) => {
  console.log('score:', payload)
})
```

On the server, we emit to room `match:<id>`:
```js
io.to(`match:${matchId}`).emit('score_update', payload)
```

## 8) Deploy Notes (Render/Fly/Heroku/VPS)

- Set environment variables from `.env.example`
- Expose port and ensure sticky origins are in `ALLOWED_ORIGINS`
- Vercel frontend should call the deployed API base URL

## 9) Next Steps

- Add more tables (teams, players, fixtures)
- Add role-based app metadata in Supabase (e.g., admin)
- Add rate limits and request validation (zod/celebrate)
- Add refresh of `updated_at` with a DB trigger
- Add webhooks (Supabase) to emit Socket.IO events on DB changes

---

Generated: 2025-09-23T15:54:17.036512Z
