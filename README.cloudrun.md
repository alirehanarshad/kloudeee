# Cloud Run deployment

This repo builds a Vite frontend (`dist/`) and serves it from the same Node HTTP server that exposes the `/api/*` routes.

## Deploy to Cloud Run (from GitHub)

1) In Google Cloud Console: **Cloud Run → Create service → Continuously deploy from a repository**.
2) Select your GitHub repo/branch.
3) Build type: **Dockerfile** (uses the `Dockerfile` in the repo root).
4) Set environment variables (recommended via Secret Manager):
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`

## Local build/run (Docker)

```bash
docker build -t kloudeee .
docker run --rm -p 8080:8080 -e GROQ_API_KEY=... -e GEMINI_API_KEY=... kloudeee
```

Then open `http://localhost:8080` and test `http://localhost:8080/api/ping`.

