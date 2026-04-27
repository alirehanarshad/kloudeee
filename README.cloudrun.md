# Cloud Run (GCP) deployment

This repo builds a Vite frontend (`dist/`) and serves it from the same Node HTTP server that exposes the `/api/*` routes.

## Local (Docker)

```bash
docker build -t voltee-arc .
docker run --rm -p 8080:8080 -e GROQ_API_KEY=... -e GEMINI_API_KEY=... voltee-arc
```

Open `http://localhost:8080` and test `http://localhost:8080/api/ping`.

## Deploy to Cloud Run

1) Authenticate + select project:

```bash
gcloud auth login
gcloud config set project PROJECT_ID
```

2) Deploy from source (uses the `Dockerfile`):

```bash
gcloud run deploy voltee-arc \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY=YOUR_GROQ_KEY,GEMINI_API_KEY=YOUR_GEMINI_KEY
```

Notes:
- Cloud Run sets `PORT` (typically `8080`); the server already listens on `process.env.PORT`.
- Prefer setting secrets via Secret Manager instead of plain env vars if this is a real service.

