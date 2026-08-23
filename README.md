# Agentic Academic Assistant (AAA)

Litestar backend + React UI (`aaa-ui/`) for a tutoring workspace with PDF upload, interactive document reading, and English Q&A via local Ollama.

## Quick start

```bash
docker compose up -d db
cp .env.example .env
uv sync --extra dev
uv run alembic upgrade head
uv run main.py          # http://localhost:8000
cd aaa-ui && npm install && npm run dev   # http://localhost:5173
```

## Ollama (host, GPU)

```bash
docker rm -f aaa-ollama 2>/dev/null || true
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen3:8b
ollama pull qwen2.5vl:3b
systemctl status ollama
./scripts/verify-gpu-ollama.sh
```

Default API: `http://localhost:11434` (set in `.env`). Tutor chat uses `qwen3:8b`; PDF/image vision uses `qwen2.5vl:3b`.

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
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API |
| `OLLAMA_MODEL` | `qwen3:8b` | Tutor chat model tag |
| `OLLAMA_VISION_MODEL` | `qwen2.5vl:3b` | Local vision model for PDF/image analysis |
| `OLLAMA_TIMEOUT_SECONDS` | `120` | Tutor chat request timeout |
| `OLLAMA_VISION_TIMEOUT_SECONDS` | `360` | Vision request timeout (first load can be slow) |
| `OLLAMA_MAX_TOKENS` | `384` | Max tutor reply tokens |
| `OLLAMA_VISION_MAX_TOKENS` | `512` | Max vision description tokens |
| `OLLAMA_VISION_NUM_CTX` | `8192` | Vision model context window for Ollama |
| `VISION_MAX_PDF_PAGES` | `2` | Max PDF pages sent to vision model |
| `VISION_MAX_IMAGE_EDGE` | `768` | Max pixel edge for vision images (avoids context overflow) |

## API overview

- `POST /api/auth/register`, `POST /api/auth/login` — public
- `GET/POST /api/chat-sessions` — sessions (JWT)
- `POST /api/chat-sessions/{id}/documents` — PDF/image upload + processing (JWT + Ollama vision + Ollama tutor)
- `GET /api/chat-sessions/{id}/documents/latest` — latest document metadata
- `GET /api/chat-sessions/{id}/documents/{doc_id}/file` — PDF file stream
- `GET/POST /api/chat-sessions/{id}/messages` — tutor Q&A (JWT + Ollama on POST)

## Database reset

```bash
docker compose down -v && docker compose up -d db && uv run alembic upgrade head
```

Postgres runs on port **5434** (Docker).

## UI

See [`aaa-ui/README.md`](aaa-ui/README.md).
