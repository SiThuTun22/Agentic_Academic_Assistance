# Agentic Academic Assistant — UI (aaa-ui)

Minimal React UI for the AAA Litestar backend: login, then a three-column tutoring workspace (sessions | question reader | tutor chat).

## Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8000` (see [`../README.md`](../README.md))

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Auth

Sign in or create an account on the auth page at http://localhost:5173. After registration, the app signs you in automatically (JWT).

| Action | Where |
|--------|-------|
| Sign in | Auth page → **Sign in** tab |
| Register | Auth page → **Create account** tab (auto sign-in after success) |
| Sign out | Workspace toolbar → **Sign out** |

JWT tokens are stored in `localStorage` under `aaa_access_token`.

The app also remembers:

- Last login email (`aaa_login_email`)
- Theme preference (`aaa_theme`)
- Active session id (`aaa_active_session_id`)
- Per-session submissions in `sessionStorage` until the backend adds `GET .../submissions`

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_SCALAR_URL` | `http://localhost:8000/scalar` | Optional Scalar API docs URL |
| `VITE_API_BASE_URL` | _(empty — same origin)_ | Optional production API base URL |

Copy `.env.example` to `.env` and adjust if needed.

## Demo account

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `demo1234` |

Or register a new account via **Create account** on the auth page.

## Dev proxy

Vite proxies `/api` and `/health` to `http://localhost:8000`, so no backend CORS setup is required for local development.

## Workspace columns

| Column | API |
|--------|-----|
| Sessions (left) | `GET/POST /api/chat-sessions` |
| Question (middle) | `POST /api/chat-sessions/{id}/submissions` |
| Tutor chat (right) | `GET/POST /api/chat-sessions/{id}/messages` |

**Current backend stubs:** submissions return empty `keywords`; message POST saves user messages only (no tutor replies yet).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Project layout

```
src/
  components/
    auth/          LoginPage
    workspace/     Three-column tutoring UI
    ui/            Shared UI primitives (shadcn-style)
  context/         AuthProvider
  lib/             api.ts, apiTypes.ts, auth.ts, workspaceStorage.ts
```
