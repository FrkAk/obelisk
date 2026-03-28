# Contributing to Obelisk

## Prerequisites

| Dependency | Purpose |
| ---------- | ------- |
| Docker and Compose | Runs PostgreSQL, Typesense, and the app |
| Ollama (on host with GPU) | Local LLM inference for enrichment and remarks |
| Mapbox access token | Map tiles and geocoding (free tier works) |
| Bun | JavaScript runtime and package manager |

## Getting started

1. Fork and clone the repository.
2. Copy the environment template and add your Mapbox token:

   ```sh
   cp .env.example .env
   ```

3. Run the full setup pipeline:

   ```sh
   make setup
   ```

4. Start the development server:

   ```sh
   make run
   ```

## Before submitting a PR

Run all checks locally:

```sh
bun run lint
bun run typecheck
bun test
```

All three must pass. CI will run them automatically on your PR.

## PR process

- Create a feature branch from `main`.
- Keep changes focused. One concern per PR.
- Use the PR template and fill in all sections.
- All PRs require a review and must pass CI before merging.
- Squash merge is the only merge strategy.

## Commit messages

Format: `<type>: <short description>`

Examples: `fix: resolve search ranking for non-latin queries`, `feat: add POI clustering at low zoom`

## Licensing

By submitting a pull request, you agree that your contribution may be distributed under both the AGPL 3.0 and the commercial license. See [LICENSING.md](LICENSING.md) for details.
