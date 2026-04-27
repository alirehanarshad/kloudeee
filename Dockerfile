# syntax=docker/dockerfile:1

FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

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
