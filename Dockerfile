FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN mkdir -p .next && chown 1000:1000 .next

EXPOSE 3000
