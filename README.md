# Agentic Academic Assistant (AAA)

Minimal Litestar skeleton for a **Socratic tutoring platform** — interactive explanations for programming/CS topics, with a three-column workspace (chat history, question reader, tutor chat).

Backend foundation only: JWT auth, chat sessions, submissions, and message stubs. No LLM or frontend yet.

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

Scalar API UI: http://localhost:8000/scalar (public, no token)

OpenAPI schema JSON: http://localhost:8000/ or http://localhost:8000/openapi.json (public; Scalar fetches `/openapi.json` automatically)

## Auth (Scalar testing)

1. Open Scalar at `/scalar` — no login required to view the docs UI
2. `POST /api/auth/register` — create an account (response has user fields only, no token)
3. `POST /api/auth/login` — copy `access_token` from the response
4. Click **Authorize** in Scalar and enter: `Bearer <your-token>`
5. Create a chat session, submit a question, list/post messages

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

## Product flow (from `.cursorrules`)

1. **Setup** — tutor tone + avatar on chat session create
2. **Submit** — question + optional reference text via submissions
3. **Keywords** — stub empty list (future: interactive reader tokens)
4. **Deep-dive chat** — messages with optional `keyword_context` (future: Socratic tutor replies in Myanmar)
