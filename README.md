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
systemctl status ollama
./scripts/verify-gpu-ollama.sh
```

Default API: `http://localhost:11434` (set in `.env`).

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
| `OLLAMA_MODEL` | `qwen3:8b` | Model tag |
| `OLLAMA_TIMEOUT_SECONDS` | `120` | Request timeout |
| `OLLAMA_MAX_TOKENS` | `384` | Max reply tokens |

## API overview

- `POST /api/auth/register`, `POST /api/auth/login` — public
- `GET/POST /api/chat-sessions` — sessions (JWT)
- `POST /api/chat-sessions/{id}/documents` — PDF upload + processing (JWT + Ollama)
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
