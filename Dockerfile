# syntax=docker/dockerfile:1

# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./

# The --platform flag ensures we get the Linux binaries for Rollup/Vite
# even if your lockfile was made on Windows/Mac
RUN npm ci --include=optional --platform=linux --arch=x64


# --- Stage 2: Build ---
FROM node:20-slim AS build
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# This creates the /dist folder
RUN npm run build


# --- Stage 3: Runner ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Only copy what is strictly necessary to keep the image small
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# CRITICAL: Copy your AI logic files so the server can import them
COPY --from=build /app/gemini.js ./
COPY --from=build /app/groq.js ./

EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]
