# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/e2e/package.json apps/e2e/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter web build && pnpm --filter api build

FROM node:22-bookworm-slim AS runtime
RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production \
    SERVE_WEB=true \
    API_PREFIX=api \
    PORT=8080 \
    HOST=0.0.0.0 \
    CALENDAR_TIMEZONE=Europe/Moscow

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/generated ./apps/api/generated
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/api
EXPOSE 8080
CMD ["node", "dist/index.js"]
