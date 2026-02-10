.PHONY: help setup run run-local stop logs rebuild destroy seed-pois enrich-pois sync-search generate-embeddings search-setup db-dump db-restore
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

ARCH := $(shell uname -m)

ifeq ($(ARCH),aarch64)
  COMPOSE := docker compose -f docker-compose.jetson.yml
  PLATFORM := Jetson
else
  COMPOSE := docker compose
  PLATFORM := PC
endif

export DATABASE_URL := postgresql://obelisk:obelisk_dev@localhost:5432/obelisk
export OLLAMA_URL := http://localhost:11434
export OLLAMA_MODEL ?= gemma3:4b-it-qat
export OLLAMA_SEARCH_MODEL ?= gemma3:4b-it-qat
export OLLAMA_EMBED_MODEL ?= mxbai-embed-large
export TYPESENSE_API_KEY ?= obelisk_typesense_dev
export SEED_RADIUS ?= 1000

help:
	@printf "\n"
	@printf "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App ($(PLATFORM) / $(ARCH))\n"
	@printf "\n"
	@printf "$(GREEN)Commands:$(RESET)\n"
	@printf "  $(CYAN)setup$(RESET)      First-time setup (deps, db, model, seed)\n"
	@printf "  $(CYAN)run$(RESET)        Start on localhost:3000\n"
	@printf "  $(CYAN)run-local$(RESET)  Start exposed to local network (same WiFi)\n"
	@printf "  $(CYAN)stop$(RESET)       Stop services (keeps data)\n"
	@printf "  $(CYAN)logs$(RESET)       View database logs\n"
	@printf "  $(CYAN)rebuild$(RESET)    Clean rebuild (deps + next cache)\n"
	@printf "  $(CYAN)destroy$(RESET)    Stop and remove all data\n"
	@printf "\n"
	@printf "$(GREEN)Search Pipeline:$(RESET)\n"
	@printf "  $(CYAN)seed-pois$(RESET)           Seed POIs from Overpass API\n"
	@printf "  $(CYAN)enrich-pois$(RESET)         Enrich POIs with web data + LLM\n"
	@printf "  $(CYAN)sync-search$(RESET)         Sync POIs to Typesense\n"
	@printf "  $(CYAN)generate-embeddings$(RESET)  Generate vector embeddings\n"
	@printf "  $(CYAN)search-setup$(RESET)        Run full search pipeline\n"
	@printf "\n"
	@printf "$(GREEN)Database:$(RESET)\n"
	@printf "  $(CYAN)db-dump$(RESET)     Export database to db/dump.sql\n"
	@printf "  $(CYAN)db-restore$(RESET)  Restore database from db/dump.sql\n"
	@printf "\n"

ifeq ($(ARCH),aarch64)

setup:
	@printf "$(GREEN)Setting up Obelisk on $(PLATFORM)...$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)[1/6]$(RESET) Installing dependencies...\n"
	bun install
	@printf "\n"
	@printf "$(CYAN)[2/6]$(RESET) Starting PostgreSQL...\n"
	$(COMPOSE) up -d
	@printf "Waiting for database...\n"
	@sleep 8
	@printf "\n"
	@printf "$(CYAN)[3/6]$(RESET) Running migrations...\n"
	bun run drizzle-kit push
	@printf "\n"
	@printf "$(CYAN)[4/6]$(RESET) Ensuring Ollama models...\n"
	ollama pull $(OLLAMA_MODEL)
	ollama pull $(OLLAMA_SEARCH_MODEL)
	@printf "\n"
	@printf "$(CYAN)[5/6]$(RESET) Seeding POIs...\n"
	bun scripts/seed-pois.ts
	@printf "\n"
	@printf "$(CYAN)[6/6]$(RESET) Generating stories...\n"
	-bun scripts/generate-stories.ts || true
	@printf "\n"
	@printf "$(GREEN)Setup complete!$(RESET) Run 'make run' to start\n"

run:
	@printf "$(GREEN)Starting Obelisk ($(PLATFORM))...$(RESET)\n"
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@printf "\n"
	@printf "$(GREEN)App starting at http://localhost:3000$(RESET)\n"
	@printf "Press Ctrl+C to stop the app\n"
	@printf "\n"
	bun run dev

run-local:
	@printf "$(GREEN)Starting Obelisk for local network ($(PLATFORM))...$(RESET)\n"
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@LOCAL_IP=$$(hostname -I | awk '{print $$1}'); \
	printf "\n"; \
	printf "$(GREEN)App starting:$(RESET)\n"; \
	printf "  Local:   http://localhost:3000\n"; \
	printf "  Network: http://$$LOCAL_IP:3000\n"; \
	printf "\n"; \
	printf "Press Ctrl+C to stop the app\n"
	bun run dev --hostname 0.0.0.0

rebuild:
	@printf "$(YELLOW)Rebuilding ($(PLATFORM))...$(RESET)\n"
	$(COMPOSE) down
	rm -rf .next node_modules
	bun install
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@printf "$(GREEN)Rebuild complete!$(RESET) Run 'make run' to start\n"

else

setup:
	@printf "$(GREEN)Setting up Obelisk on $(PLATFORM)...$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)[1/6]$(RESET) Building and starting services...\n"
	$(COMPOSE) up -d --build
	@printf "Waiting for services...\n"
	@sleep 8
	@printf "\n"
	@printf "$(CYAN)[2/6]$(RESET) Enabling extensions and running migrations...\n"
	$(COMPOSE) exec -T postgres psql -U obelisk -d obelisk -f /dev/stdin < drizzle/0001_enable_extensions.sql
	$(COMPOSE) exec app bun run drizzle-kit push
	@printf "\n"
	@printf "$(CYAN)[3/6]$(RESET) Ensuring Ollama models...\n"
	ollama pull $(OLLAMA_MODEL)
	ollama pull $(OLLAMA_SEARCH_MODEL)
	ollama pull $(OLLAMA_EMBED_MODEL)
	@printf "\n"
	@printf "$(CYAN)[4/6]$(RESET) Seeding POIs...\n"
	$(COMPOSE) exec app bun scripts/seed-pois.ts
	@printf "\n"
	@printf "$(CYAN)[5/6]$(RESET) Generating stories...\n"
	-$(COMPOSE) exec app bun scripts/generate-stories.ts || true
	@printf "\n"
	@printf "$(GREEN)Setup complete!$(RESET) Run 'make run' to start\n"

run:
	@printf "$(GREEN)Starting Obelisk ($(PLATFORM))...$(RESET)\n"
	@printf "\n"
	@printf "$(GREEN)App starting at http://localhost:3000$(RESET)\n"
	@printf "Press Ctrl+C to stop\n"
	@printf "\n"
	$(COMPOSE) up

run-local:
	@printf "$(GREEN)Starting Obelisk for local network ($(PLATFORM))...$(RESET)\n"
	@LOCAL_IP=$$(hostname -I | awk '{print $$1}'); \
	printf "\n"; \
	printf "$(GREEN)App starting:$(RESET)\n"; \
	printf "  Local:   http://localhost:3000\n"; \
	printf "  Network: http://$$LOCAL_IP:3000\n"; \
	printf "\n"; \
	printf "Press Ctrl+C to stop\n"
	docker compose -f docker-compose.yml -f docker-compose.local.yml up

rebuild:
	@printf "$(YELLOW)Rebuilding ($(PLATFORM))...$(RESET)\n"
	$(COMPOSE) down
	$(COMPOSE) up -d --build
	@sleep 3
	$(COMPOSE) exec app bun run drizzle-kit push
	@printf "$(GREEN)Rebuild complete!$(RESET) Run 'make run' to start\n"

endif

stop:
	@printf "Stopping services...\n"
	$(COMPOSE) down
	@printf "$(GREEN)Stopped.$(RESET) Data preserved.\n"

logs:
	$(COMPOSE) logs -f

destroy:
	@printf "$(YELLOW)Destroying all Obelisk data...$(RESET)\n"
	$(COMPOSE) down -v --remove-orphans
	rm -rf .next node_modules
	@printf "Done. Run 'make setup' to start fresh.\n"

ifeq ($(ARCH),aarch64)

seed-pois:
	bun scripts/seed-pois.ts

enrich-pois:
	bun scripts/enrich-pois.ts

sync-search:
	bun scripts/sync-typesense.ts

generate-embeddings:
	bun scripts/generate-embeddings.ts

db-dump:
	@mkdir -p db
	pg_dump -U obelisk -h localhost obelisk > db/dump.sql
	@printf "$(GREEN)Dumped to db/dump.sql$(RESET)\n"

db-restore:
	psql -U obelisk -h localhost obelisk < db/dump.sql
	@printf "$(GREEN)Restored from db/dump.sql$(RESET)\n"
	@printf "$(CYAN)Syncing search index...$(RESET)\n"
	bun scripts/sync-typesense.ts
	@printf "$(GREEN)Search index synced$(RESET)\n"

else

seed-pois:
	$(COMPOSE) exec app bun scripts/seed-pois.ts

enrich-pois:
	$(COMPOSE) exec app bun scripts/enrich-pois.ts

sync-search:
	$(COMPOSE) exec app bun scripts/sync-typesense.ts

generate-embeddings:
	$(COMPOSE) exec app bun scripts/generate-embeddings.ts

db-dump:
	@mkdir -p db
	$(COMPOSE) exec -T postgres pg_dump -U obelisk obelisk > db/dump.sql
	@printf "$(GREEN)Dumped to db/dump.sql$(RESET)\n"

db-restore:
	$(COMPOSE) exec -T postgres psql -U obelisk obelisk < db/dump.sql
	@printf "$(GREEN)Restored from db/dump.sql$(RESET)\n"
	@printf "$(CYAN)Syncing search index...$(RESET)\n"
	$(COMPOSE) exec app bun scripts/sync-typesense.ts
	@printf "$(GREEN)Search index synced$(RESET)\n"

endif

search-setup: seed-pois enrich-pois sync-search generate-embeddings
