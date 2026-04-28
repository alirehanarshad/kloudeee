# syntax=docker/dockerfile:1

# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps
WORKDIR /app

# We only copy package.json to avoid lockfile conflicts during this phase
COPY package.json ./

# 1. Use 'npm install' instead of 'ci' to bypass the lockfile sync check.
# 2. Specifically install the missing Linux rollup binary.
# 3. Use --legacy-peer-deps to handle the React 19 / Radix UI conflicts.
RUN npm install --legacy-peer-deps && \
    npm install @rollup/rollup-linux-x64-gnu@4.60.1


# --- Stage 2: Build ---
FROM node:20-slim AS build
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Vite frontend
RUN npm run build


# --- Stage 3: Runner ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Keep the production image lean
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# Ensure your AI logic files are available for the Node.js server
COPY --from=build /app/gemini.js ./
COPY --from=build /app/groq.js ./

EXPOSE 8080

# Run the server
CMD ["node", "server/index.js"]
