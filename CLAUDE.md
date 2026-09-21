# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

웹툰메이커 (Webtoon Maker) — a planning/creative-assistant tool for webtoon writers: project setup, story structure, character management, scene/cut guides, schedule risk calculation, world-setting docs, and an AI chat assistant. All UI text, prompts, and error messages are in Korean — match that when editing user-facing strings or backend messages.

Two independent apps, no root package.json:
- `frontend/` — React 18 + TypeScript + Vite + Tailwind v4
- `backend/` — a minimal Node.js HTTP API (no framework) for auth and AI proxying

## Commands

Run everything from inside `frontend/` or `backend/` — there is no root-level script.

```bash
# Frontend + backend together (recommended for local dev)
cd frontend && npm install && npm run dev
# scripts/dev.mjs auto-starts the backend (127.0.0.1:4000) if it isn't already
# running, waits for /api/health, then launches Vite (127.0.0.1:5173)

# Frontend only (assumes backend is already running separately)
cd frontend && npm run dev:frontend

# Frontend production build
cd frontend && npm run build

# Backend only, with file watching
cd backend && npm run dev
# Backend only, no watch
cd backend && npm start
```

Backend needs `backend/.env` (copy from `backend/.env.example`) with `OPENAI_API_KEY` set — AI endpoints return 503 without it. There is currently no lint script, no test runner, and no `tsconfig.json` in either package — don't assume `npm test`/`npm run lint` exist.

## Architecture

### Frontend is mock-backed except auth and AI

Most domain data (projects, characters, scenes, schedule, story, timeline, todos, world settings, relationship boards) is **not** served by the backend yet. `frontend/src/api/*.ts` (e.g. `projects.ts`, `characters.ts`) are thin wrappers around `frontend/src/mocks/store.ts`, which persists everything to `localStorage` (keys prefixed `wt_`). When the real backend gains these endpoints, swap the mock-store calls in `src/api/*.ts` for `apiClient` calls — that's the intended seam, and comments in those files mark it.

Only two areas already hit the real backend via `apiClient` (`frontend/src/api/client.ts`, axios with a `wt_auth_token` bearer interceptor):
- `frontend/src/api/auth.ts` → `/api/auth/signup`, `/api/auth/login`, `/api/members/me`
- `frontend/src/api/ai.api.ts` → `/api/ai/*`

Vite dev server proxies `/api` to `http://127.0.0.1:4000` (`vite.config.ts`), so `VITE_API_URL` can normally stay unset in dev.

Domain types live in `frontend/src/types/index.ts` (Project, Episode, Foreshadow, Character, etc. — most enums are Korean string unions) and `frontend/src/types/ai.ts`. Per-entity limits (`MAX_PROJECTS`, `MAX_CHARACTERS_PER_PROJECT`, `MAX_EPISODES`) live in `frontend/src/config/limits.ts` and are enforced inside `mocks/store.ts`.

### Routing and auth gating

`frontend/src/app/App.tsx` defines all routes with `react-router` 7. Everything under `/projects/*` is wrapped in a `ProtectedRoute` gated by `AuthContext` (`frontend/src/contexts/AuthContext.tsx`), which loads the current user from `/api/members/me` using the stored token on mount. A project workspace (`/projects/:id`) has nested tab routes (`dashboard`, `info`, `story`, `characters`, `world`, `scenes`, `schedule`, `export`) rendered under `ProjectLayout`, each backed by a page in `frontend/src/pages/tabs/`.

### Backend is a single-file HTTP server

`backend/src/server.mjs` uses Node's built-in `http` and `node:sqlite` (`DatabaseSync`) directly — no Express/Fastify, no ORM. It owns two concerns:
1. **Auth**: signup/login with scrypt password hashing, session tokens (random bytes, stored as sha256 hashes in a `sessions` table, 7-day expiry), `/api/members/me` GET/PUT. DB file is `backend/data/webtoon-maker.db` (gitignored).
2. **AI proxy**: `/api/ai/{chat,story-structure,scene-guide,character-conflicts,foreshadow-review,world-setting,export-summary}`, all requiring auth and rate-limited to 20 requests/hour/user (in-memory `Map`, resets on restart).

CORS is a hardcoded allowlist of the two dev origins (`localhost:5173`, `127.0.0.1:5173`) — extend `allowedOrigins` in `server.mjs` before deploying anywhere else.

### AI prompt/schema layer

`backend/src/openai.mjs` wraps the OpenAI Responses API. Key conventions to preserve when touching this file:
- Every prompt is composed via `prompt(body)`, which appends a shared `COMMON_RESPONSE_RULES` block (Korean-only output, no `**bold**` markdown, ask one question at a time, don't invent facts not in the input) — new AI tasks should go through this helper rather than building raw instructions.
- Structured tasks (`story-structure`, `scene-guide`, `character-conflicts`, `world-setting`) use `text.format: json_schema` with `strict: true` against schemas defined in the local `schemas` object; free-form tasks (`chat`, `foreshadow-review`, `export-summary`) return plain text.
- `sanitizeOutput` strips stray `**` from all AI output before it reaches the client.
- Input payloads are capped at 16,000 JSON characters (`safeJson`) and output tokens at 1,000 (`MAX_OUTPUT_LIMIT`); both are enforced regardless of `.env` overrides.
- The model id defaults to `gpt-5.6-luna` and is overridable via `OPENAI_MODEL`.

### Figma Make origin

`frontend/vite.config.ts` includes a custom `figma-asset-resolver` plugin that resolves `figma:asset/...` imports into `src/assets`, and the React/Tailwind plugins are marked "required for Make, even if Tailwind is not being actively used – do not remove them." This codebase was bootstrapped from a Figma Make export — keep that plugin and the `assetsInclude` restriction (`.css`/`.tsx`/`.ts` must never be added there) intact.
