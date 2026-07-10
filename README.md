# Plate — bmv-restaurant-menu

Separate frontend for the BMV Core **restaurant menu platform**.

- **Admin kitchen:** `/admin` — menu CRUD, AI photo draft, ingredient confirm, photo + `.glb` upload, 3D preview
- **Guest tasting room:** `/m/:slug` — public menu, 3D dish viewer, concierge chatbot (no API key in the browser)

Talks to [bmv-core](https://github.com/Roy-r2004/bmv-core) over `VITE_API_BASE_URL`.

## Local run

```bash
# Terminal 1 — Core API (from bmv-core)
alembic upgrade head
uvicorn app.main:app --reload --port 8010

# Terminal 2 — this app
cp .env.example .env
npm install
npm run dev
```

Open http://127.0.0.1:5173/admin

## Env

| Variable | Example |
|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8010/api` |

Core should allow this origin via `CORS_ORIGINS` (or leave blank in Core for open local CORS).

## Deploy

Build static assets (`npm run build`) and host on Vercel/Netlify/Cloudflare Pages. Set `VITE_API_BASE_URL` to your production Core URL. Deploy Core separately — this repo never embeds admin secrets for guests.
