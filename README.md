# Agentic Academic Assistant (AAA)

Litestar backend + React UI (`aaa-ui/`) for a tutoring workspace with PDF upload, interactive document reading, and a multi-agent Gemini tutor grounded in MIIT knowledge files.

## Quick start

```bash
docker compose up -d db
cp .env.example .env
uv sync --extra dev
uv run alembic upgrade head
uv run main.py          # http://localhost:8000
cd aaa-ui && npm install && npm run dev   # http://localhost:5173
```

## Gemini

Set `GEMINI_API_KEYS` in `.env` as a comma-separated list. Each key is one worker in the pool (round-robin, with cooldown on 429). Chat, titles, terms, vision, and **RAG embeddings** all use this pool.

Knowledge search is Gemini `gemini-embedding-001` stored in PostgreSQL **pgvector** (cosine top-k, 768 dims). On 429, retrieval falls back to character n-gram overlap.

Tutor replies in Myanmar; source text and code stay in English. Text PDFs are read with PyMuPDF and do not call the vision model unless `VISION_MAX_PDF_PAGES` is greater than 0.

## Knowledge files

Add JSONL and handout PDFs under [`knowledge/`](knowledge/). Faculty first, then campus, then courses. See [`knowledge/README.md`](knowledge/README.md). Files named `_schema.example.jsonl` are templates and are not loaded. The backend embeds changed files on startup (and again if files change before a chat).

## Product flow

1. Create a session (left sidebar + tutor chat — **two columns** by default)
2. Upload a **PDF** from tutor chat (right column)
3. Layout switches to three columns: icon sidebar | PDF viewer | chat
4. Hover highlighted terms on the PDF for short definitions
5. Tutor auto-summarizes the document; ask follow-ups in chat (MIIT faculty/campus/courses too)

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
| `GEMINI_API_KEYS` | _(empty)_ | Comma-separated Gemini API keys. Set this only in `.env` |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Chat / agent model |
| `GEMINI_VISION_MODEL` | `gemini-2.0-flash` | Image vision model |
| `GEMINI_TIMEOUT_SECONDS` | `120` | Tutor chat request timeout |
| `GEMINI_VISION_TIMEOUT_SECONDS` | `360` | Vision request timeout |
| `GEMINI_MAX_TOKENS` | `2048` | Max tutor reply tokens |
| `GEMINI_VISION_MAX_TOKENS` | `512` | Max vision description tokens |
| `GEMINI_COOLING_SECONDS` | `60` | Seconds to skip a key after 429 |
| `GEMINI_TUTOR_TEMPERATURE` | `0.8` | Tutor reply variety (titles/terms/vision stay at 0) |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Gemini embedding model (`text-embedding-004` is retired) |
| `GEMINI_EMBEDDING_DIMS` | `768` | Must match the `knowledge_chunks.embedding` pgvector size |
| `RAG_TOP_K` | `5` | Chunks retrieved per specialist category |
| `VISION_MAX_PDF_PAGES` | `0` | PDF pages sent to the vision model. `0` keeps PDFs text-only |
| `VISION_MAX_IMAGE_EDGE` | `768` | Max pixel edge for vision images (avoids context overflow) |
| `KNOWLEDGE_DIR` | `knowledge/` | Optional override for the knowledge folder |
| `TTS_ENGLISH_RATE` | `-5%` | edge-tts rate for Latin/English runs only (Myanmar stays `+0%`) |

## API overview

- `POST /api/auth/register`, `POST /api/auth/login` — public
- `GET/POST /api/chat-sessions` — sessions (JWT)
- `POST /api/chat-sessions/{id}/documents` — PDF/image upload + processing (JWT + Gemini)
- `GET /api/chat-sessions/{id}/documents/latest` — latest document metadata
- `GET /api/chat-sessions/{id}/documents/{doc_id}/file` — PDF file stream
- `GET/POST /api/chat-sessions/{id}/messages` — tutor Q&A (JWT + Gemini on POST)
- `GET /api/chat-sessions/{id}/messages/{message_id}/speech` — cached tutor TTS (JWT + edge-tts; Gemini pronunciation map is TTS-only)

## Database reset

Postgres must have the **pgvector** extension. Docker uses `pgvector/pgvector:pg16`. Recreating the Docker volume is required once when switching from plain Postgres:

```bash
docker compose down -v && docker compose up -d db && uv run alembic upgrade head
```

This wipes local chat data. Postgres runs on port **5434** (Docker).

## UI

See [`aaa-ui/README.md`](aaa-ui/README.md).
