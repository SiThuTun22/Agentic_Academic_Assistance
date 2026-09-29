# Agentic Academic Assistant (AAA)

Litestar backend + React UI (`aaa-ui/`) for a tutoring workspace with PDF upload, interactive document reading, and English Q&A via Groq.

## Quick start

```bash
docker compose up -d db
cp .env.example .env
uv sync --extra dev
uv run alembic upgrade head
uv run main.py          # http://localhost:8000
cd aaa-ui && npm install && npm run dev   # http://localhost:5173
```

## Groq

Set `GROQ_API_KEY` in `.env`. Tutor chat uses `openai/gpt-oss-20b`. Image vision uses `qwen/qwen3.8-27b`. Text PDFs are read with PyMuPDF and do not call the vision model.

## Product flow

1. Create a session (left sidebar + tutor chat — **two columns** by default)
2. Upload a **PDF** from tutor chat (right column)
3. Layout switches to three columns: icon sidebar | PDF viewer | chat
4. Hover highlighted terms on the PDF for short definitions
5. Tutor auto-summarizes the document; ask follow-ups in chat

## URLs

| URL | Description |
|-----|-------------|
| http://localhost:8000/scalar | API docs |
| http://localhost:8000/health | Health check |
| http://localhost:5173 | React UI |

## Demo account

| Email | Password |
|-------|----------|
| `demo@example.com` | `demo1234` |

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | see `.env.example` | PostgreSQL async URL |
| `JWT_SECRET` | see `.env.example` | JWT signing secret. Must be at least 32 characters |
| `GROQ_API_KEY` | _(empty)_ | Groq API key. Set this only in `.env` |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible API |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Tutor chat model |
| `GROQ_VISION_MODEL` | `qwen/qwen3.8-27b` | Image vision model |
| `GROQ_TIMEOUT_SECONDS` | `120` | Tutor chat request timeout |
| `GROQ_VISION_TIMEOUT_SECONDS` | `360` | Vision request timeout |
| `GROQ_MAX_TOKENS` | `2048` | Max tutor reply tokens. Used when the variable is unset |
| `GROQ_VISION_MAX_TOKENS` | `512` | Max vision description tokens |
| `VISION_MAX_PDF_PAGES` | `0` | PDF pages sent to the vision model. `0` keeps PDFs text-only |
| `VISION_MAX_IMAGE_EDGE` | `768` | Max pixel edge for vision images (avoids context overflow) |

## API overview

- `POST /api/auth/register`, `POST /api/auth/login` — public
- `GET/POST /api/chat-sessions` — sessions (JWT)
- `POST /api/chat-sessions/{id}/documents` — PDF/image upload + processing (JWT + Groq)
- `GET /api/chat-sessions/{id}/documents/latest` — latest document metadata
- `GET /api/chat-sessions/{id}/documents/{doc_id}/file` — PDF file stream
- `GET/POST /api/chat-sessions/{id}/messages` — tutor Q&A (JWT + Groq on POST)

## Database reset

```bash
docker compose down -v && docker compose up -d db && uv run alembic upgrade head
```

Postgres runs on port **5434** (Docker).

## UI

See [`aaa-ui/README.md`](aaa-ui/README.md).
