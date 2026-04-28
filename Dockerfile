# syntax=docker/dockerfile:1

FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# Cloud Build runs on Linux; npm optional deps (like Rollup's platform packages) can differ by OS/CPU.
# `npm ci` is strict about the lockfile being perfectly in-sync for the target platform, so prefer
# `npm install` here to avoid cross-platform lock mismatches.
RUN npm install --include=dev --include=optional --no-audit --no-fund


FROM node:20-slim AS build
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Cloud Run sets PORT (usually 8080). The server already listens on process.env.PORT.
ENV PORT=8080

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
# Remove dev dependencies from the runtime image.
RUN npm prune --omit=dev --no-audit --no-fund

COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "server/index.js"]
