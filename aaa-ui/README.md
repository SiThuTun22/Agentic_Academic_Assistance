# Agentic Academic Assistant — UI (aaa-ui)

React UI for the AAA Litestar backend: login, then a workspace that starts as **sessions + tutor chat** and expands to three columns after a PDF upload.

## Prerequisites

- Node.js 18+
- Backend at `http://localhost:8000` (see [`../README.md`](../README.md))
- Host Ollama with `qwen3:8b` pulled

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Workspace layout

| Mode | Columns |
|------|---------|
| Default | Sessions (left) + Tutor chat (right) |
| After PDF upload | Icon sidebar + PDF viewer + Tutor chat |

Upload a PDF from **Upload PDF** in tutor chat. Hover highlighted terms in the PDF for definitions. The tutor summarizes the document automatically.

## API (via dev proxy)

| Column | Endpoint |
|--------|----------|
| Sessions | `GET/POST /api/chat-sessions` |
| PDF upload | `POST /api/chat-sessions/{id}/documents` |
| Tutor chat | `GET/POST /api/chat-sessions/{id}/messages` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Production build |
