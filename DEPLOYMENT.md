# Deploying Straten Lead Intelligence

## Read this first: Vercel alone cannot run the whole app

This app has two parts, and they deploy to two different places:

| Part | What it is | Where it goes |
|---|---|---|
| **Frontend** | React + Vite static site (`src/`) | **Vercel** |
| **API** | Express + Prisma server (`server/`) — a long-running Node process | **Render** (or another Node host — Railway, Fly.io, etc.) |
| **Database** | PostgreSQL | **Neon** (or any managed Postgres) |

Vercel's standard hosting builds and serves static files — it does not keep an `app.listen()` Express server running the way `server/index.js` is written. So the API needs a separate host. `render.yaml` in this repo is a ready-made blueprint for that. If you'd rather keep everything on Vercel, the API would need to be rewritten as Vercel serverless functions — say the word and I can do that conversion, but as currently built, it's a two-host deploy.

---

## Bug fixed in this pass

`package.json` had `"build": "vite"`, which starts the **dev server** (a process that never exits) instead of producing a production bundle. On Vercel this would hang or fail the build outright. It's now `"build": "vite build"`, which correctly outputs static files to `dist/` — matching `outputDirectory: "dist"` in `vercel.json`.

---

## 1. Database — Neon PostgreSQL

1. Create a Neon project and a production database.
2. Copy the connection string. **Use the direct (non-pooled) connection string for `DATABASE_URL`**, not the pgbouncer/pooled one — `prisma migrate deploy` can fail against a pooled connection because it needs a session-level connection to run migrations reliably. If Neon only gives you a pooled string by default, look for the "Direct connection" toggle on the connection details page.

## 2. Push to GitHub

Don't commit `.env` — `.gitignore` now excludes it (and `node_modules/`, `dist/`, which weren't excluded before).

## 3. Deploy the API on Render

Use the included `render.yaml` blueprint (Render → New → Blueprint → point at this repo), or create a Node Web Service manually with:
- Build command: `npm install && npx prisma generate`
- Start command: `npx prisma migrate deploy && npm run start`
- Health check path: `/health`

### Render environment variables

| Variable | Required | Value |
|---|---|---|
| `DATABASE_URL` | **Yes** | Neon direct connection string |
| `JWT_SECRET` | **Yes** | `render.yaml` auto-generates this — leave it |
| `CORS_ORIGIN` | **Yes** | Your Vercel URL once you have it, e.g. `https://your-app.vercel.app` (comma-separate multiple origins) |
| `NODE_ENV` | Yes | `production` (already set in `render.yaml`) |
| `KENYA_ONLY` | No | `true` (default) restricts the app to Kenya-based prospects; set `false` to lift that |
| `AI_ENDPOINT` | No | See AI section below |
| `AI_API_KEY` | No | See AI section below |
| `AI_MODEL` | No | See AI section below |
| `TAVILY_API_KEY` | No | See Discovery section below |

Deploy, then verify: `https://YOUR-RENDER-SERVICE.onrender.com/health` should return `{"ok":true,...}`.

**Important:** the included migration (`prisma/migrations/20260823_init`) is a single baseline for a brand-new database. Don't run `prisma migrate deploy` from this package against a Postgres database that already has a different Prisma migration history — point it at a fresh Neon database.

## 4. Deploy the frontend on Vercel

Import the same repo into Vercel. It should auto-detect Vite (there's also `vercel.json` pinning `framework: "vite"`).

Set one environment variable, in the Vercel project's **Production** environment:

```
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

This is baked in at build time (`import.meta.env.VITE_API_URL` in `src/App.jsx`), so if you add or change it, you need to redeploy — not just restart.

Deploy, then copy the resulting Vercel URL.

## 5. Close the loop on CORS

Back in Render, set `CORS_ORIGIN` to the real Vercel URL from step 4 (add a custom domain too, comma-separated, if you use one), then redeploy the API. Until this is set correctly, browser requests from your Vercel site to the Render API will be blocked.

## 6. End-to-end smoke test

1. Open the Vercel URL.
2. Register a new account, then log in.
3. Add a prospect → confirm it opens the case file (this was the bug you hit before — now fixed).
4. Run research on it.
5. Try Discovery (works in manual-entry mode even without `TAVILY_API_KEY`).
6. Approve a discovered lead into Prospects.
7. Generate outreach.
8. Refresh the browser — confirm everything persisted (this proves Neon + Render are wired up correctly, not just working in-memory).

---

## Optional: server-side AI analysis (`AI_ENDPOINT` / `AI_API_KEY` / `AI_MODEL`)

This powers the "Advanced AI Analysis" card on each prospect. If unset, that feature shows a clear "not configured" message rather than failing — nothing else in the app depends on it.

**Important:** `server/routes/ai.js` calls the endpoint using the **OpenAI Chat Completions request/response shape** (`POST {endpoint}` with a `messages` array, expecting `choices[0].message.content` back). This means:

- ✅ Works directly with OpenAI (`AI_ENDPOINT=https://api.openai.com/v1/chat/completions`, `AI_MODEL=gpt-4o-mini` or similar).
- ✅ Works with any OpenAI-compatible gateway — OpenRouter, Groq, Together AI, Azure OpenAI. This is also how you'd route to **Claude** models here, e.g. via OpenRouter (`AI_ENDPOINT=https://openrouter.ai/api/v1/chat/completions`, `AI_MODEL=anthropic/claude-...`).
- ❌ Will **not** work if you point it straight at Anthropic's native API (`api.anthropic.com/v1/messages`) — that endpoint uses a different request and response shape (`content` blocks, not `choices`). If you want native Claude API support instead of going through a gateway, that's a small code change to `server/routes/ai.js` — let me know and I'll add it.

The API key never reaches the browser — it's read server-side only, which is the right way to handle this.

## Optional: live lead discovery (`TAVILY_API_KEY`)

Powers the "Discover Companies" web search in the Discovery Inbox. Get a key at [tavily.com](https://tavily.com). Without it, Discovery still works fully in manual-entry mode — live search just shows a configuration message instead of silently failing or inventing results.

---

## Full environment variable reference

**Render (API):**
```
DATABASE_URL=postgresql://...        # required — Neon direct connection string
JWT_SECRET=<auto-generated>          # required — render.yaml handles this
CORS_ORIGIN=https://your-app.vercel.app   # required — set after step 4
NODE_ENV=production                  # required — already in render.yaml
KENYA_ONLY=true                      # optional
AI_ENDPOINT=                         # optional — OpenAI-compatible chat completions URL
AI_API_KEY=                          # optional
AI_MODEL=                            # optional
TAVILY_API_KEY=                      # optional
```

**Vercel (frontend):**
```
VITE_API_URL=https://your-api.onrender.com   # required
```

Local development still works exactly as before via `.env` + `npm run dev:all` — none of this affects local setup, only production deploys.
