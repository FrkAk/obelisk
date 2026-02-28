FROM oven/bun:1-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p .next && chown 1000:1000 .next
EXPOSE 3000
CMD ["bun", "run", "dev"]
