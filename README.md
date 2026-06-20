# Agentic Academic Assistant (AAA)

Litestar backend + React UI (`aaa-ui/`) for a **Socratic tutoring platform** — interactive explanations for programming/CS topics, with a three-column workspace (chat history, question reader, tutor chat).

JWT auth, chat sessions, submissions, and message stubs are implemented. Keyword generation and Socratic tutor replies are not yet implemented.

## Setup

1. Copy env file and set your Postgres URL:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   uv sync --extra dev
   ```

3. Run migrations:

   ```bash
   uv run alembic upgrade head
   ```

   **Migration squash / reset:** If you see `Can't locate revision identified by '001_initial'`, your DB still points at the old paper schema. Reset the dev database, then migrate again:

   ```bash
   # Option A: drop and recreate (adjust user/db to match your .env)
   dropdb -h localhost -U postgres AAA
   createdb -h localhost -U postgres AAA
   uv run alembic upgrade head
   ```

   ```bash
   # Option B: wipe schema only (keeps the database)
   psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   uv run alembic upgrade head
   ```

   For Option B, use a `psql`-compatible URL (replace `postgresql+asyncpg://` with `postgresql://`).

4. Start the server:

   ```bash
   uv run main.py
   ```

5. Start the UI (separate terminal):

   ```bash
   cd aaa-ui
   npm install
   npm run dev
   ```

   Open http://localhost:5173.

## URLs

| URL | Description |
|-----|-------------|
| http://localhost:8000/scalar | Scalar API UI (public) |
| http://localhost:8000/openapi.json | OpenAPI schema |
| http://localhost:8000/health | Health check |
| http://localhost:5173 | React UI (aaa-ui) |

## Demo account (local dev)

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `demo1234` |

Create the demo user after a fresh database:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","display_name":"Demo User","password":"demo1234"}'
```

PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"demo@example.com","display_name":"Demo User","password":"demo1234"}'
```

Then sign in via the UI (http://localhost:5173) or `POST /api/auth/login` in Scalar.

## Auth

| Action | Where |
|--------|-------|
| Sign in / Register | UI at http://localhost:5173 |
| API testing | Scalar at http://localhost:8000/scalar |
| Sign out | UI workspace toolbar |

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | see `.env.example` | PostgreSQL async URL |
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |

## Endpoints

- `GET /health` — public
- `GET /` — public (OpenAPI schema JSON)
- `GET /openapi.json` — public (OpenAPI schema; used by Scalar)
- `GET /scalar` — public (Scalar API UI)
- `POST /api/auth/register`, `POST /api/auth/login` — public
- `GET /api/auth/me` — requires JWT
- `GET/POST /api/chat-sessions`, `GET /api/chat-sessions/{id}` — requires JWT (left sidebar sessions)
- `POST /api/chat-sessions/{id}/submissions` — requires JWT (middle column input; returns stub `keywords: []`)
- `GET/POST /api/chat-sessions/{id}/messages` — requires JWT (right column chat thread; user messages only for now)

## Product flow

1. **Setup** — tutor tone + avatar on chat session create
2. **Submit** — question + optional reference text via submissions
3. **Keywords** — stub empty list (future: interactive reader tokens)
4. **Deep-dive chat** — messages with optional `keyword_context` (future: Socratic tutor replies in Myanmar)

## UI documentation

See [`aaa-ui/README.md`](aaa-ui/README.md) for frontend setup, auth flow, and workspace columns.
