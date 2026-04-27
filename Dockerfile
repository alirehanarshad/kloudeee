# syntax=docker/dockerfile:1

FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
# Cloud Build runs on Linux; if your lockfile was generated on Windows/macOS,
# strict `npm ci` can miss platform-specific optional deps (e.g. Rollup native binary).
# Using `npm install --include=optional` allows npm to resolve the correct Linux optional deps.
RUN npm install --include=optional

COPY . .
RUN npm run build


FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["npm", "start"]
