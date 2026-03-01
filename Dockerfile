FROM oven/bun:1.3.10-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN mkdir -p .next data

EXPOSE 3000
