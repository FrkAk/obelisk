.PHONY: help setup run run-local stop logs rebuild destroy download-pbf seed-regions seed-cuisines seed-tags seed-pois seed-all enrich-pois sync-search generate-embeddings search-setup db-dump db-restore
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

COMPOSE := docker compose

# Load .env.local if it exists
ifneq (,$(wildcard .env.local))
  include .env.local
  export
endif

export DATABASE_URL ?= postgresql://obelisk:obelisk_dev@localhost:5432/obelisk
export OLLAMA_URL ?= http://127.0.0.1:11434
export OLLAMA_MODEL ?= gemma3:4b-it-qat
export OLLAMA_SEARCH_MODEL ?= gemma3:4b-it-qat
export OLLAMA_EMBED_MODEL ?= embeddinggemma:300m
export OLLAMA_TRANSLATE_MODEL ?= translategemma:4b
export TYPESENSE_API_KEY ?= obelisk_typesense_dev
export SEED_RADIUS ?= 100

help:
	@printf "\n"
	@printf "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App\n"
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
	@printf "$(GREEN)Seeding:$(RESET)\n"
	@printf "  $(CYAN)seed-regions$(RESET)        Seed regions (Germany -> Munich)\n"
	@printf "  $(CYAN)seed-cuisines$(RESET)       Seed cuisine taxonomy\n"
	@printf "  $(CYAN)seed-tags$(RESET)           Seed tags across all groups\n"
	@printf "  $(CYAN)download-pbf$(RESET)        Download Munich OSM PBF extract\n"
	@printf "  $(CYAN)seed-pois$(RESET)           Seed POIs from local OSM extract\n"
	@printf "  $(CYAN)seed-all$(RESET)            Run all seed scripts in order\n"
	@printf "\n"
	@printf "$(GREEN)Search Pipeline:$(RESET)\n"
	@printf "  $(CYAN)enrich-pois$(RESET)         Enrich POIs with web data + LLM\n"
	@printf "  $(CYAN)sync-search$(RESET)         Sync POIs to Typesense\n"
	@printf "  $(CYAN)generate-embeddings$(RESET)  Generate vector embeddings\n"
	@printf "  $(CYAN)search-setup$(RESET)        Run full search pipeline\n"
	@printf "\n"
	@printf "$(GREEN)Database:$(RESET)\n"
	@printf "  $(CYAN)db-dump$(RESET)     Export database to db/dump.sql\n"
	@printf "  $(CYAN)db-restore$(RESET)  Restore database from db/dump.sql\n"
	@printf "\n"

setup:
	@printf "$(GREEN)Setting up Obelisk...$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)[1/12]$(RESET) Building and starting services...\n"
	$(COMPOSE) up -d --build
	@printf "Waiting for services...\n"
	@sleep 8
	@printf "\n"
	@printf "$(CYAN)[2/12]$(RESET) Enabling extensions and running migrations...\n"
	$(COMPOSE) exec -T postgres psql -U obelisk -d obelisk -f /dev/stdin < drizzle/0001_enable_extensions.sql
	$(COMPOSE) exec app bun run drizzle-kit push
	@printf "\n"
	@printf "$(CYAN)[3/12]$(RESET) Ensuring Ollama models...\n"
	ollama pull $(OLLAMA_MODEL)
	ollama pull $(OLLAMA_SEARCH_MODEL)
	ollama pull $(OLLAMA_EMBED_MODEL)
	ollama pull $(OLLAMA_TRANSLATE_MODEL)
	@printf "\n"
	@printf "$(CYAN)[4/12]$(RESET) Seeding regions...\n"
	$(COMPOSE) exec app bun scripts/seed-regions.ts
	@printf "\n"
	@printf "$(CYAN)[5/12]$(RESET) Seeding cuisines...\n"
	$(COMPOSE) exec app bun scripts/seed-cuisines.ts
	@printf "\n"
	@printf "$(CYAN)[6/12]$(RESET) Seeding tags...\n"
	$(COMPOSE) exec app bun scripts/seed-tags.ts
	@printf "\n"
	@printf "$(CYAN)[7/12]$(RESET) Downloading Munich OSM extract...\n"
	$(MAKE) download-pbf
	@printf "\n"
	@printf "$(CYAN)[8/12]$(RESET) Seeding POIs...\n"
	$(COMPOSE) exec app bun scripts/seed-pois.ts
	@printf "\n"
	@printf "$(CYAN)[9/12]$(RESET) Enrich POIs...\n"
	$(COMPOSE) exec app bun scripts/enrich-pois.ts
	@printf "\n"
	@printf "$(CYAN)[10/12]$(RESET) Generating stories...\n"
	$(COMPOSE) exec app bun scripts/generate-stories.ts || true
	@printf "\n"
	@printf "$(CYAN)[11/12]$(RESET) Syncing search index...\n"
	$(COMPOSE) exec app bun scripts/sync-typesense.ts
	@printf "\n"
	@printf "$(CYAN)[12/12]$(RESET) Generating vector embeddings...\n"
	$(COMPOSE) exec app bun scripts/generate-embeddings.ts
	@printf "\n"
	@printf "$(GREEN)Setup complete!$(RESET) Run 'make run' to start\n"

run:
	@printf "$(GREEN)Starting Obelisk...$(RESET)\n"
	@printf "\n"
	@printf "$(GREEN)App starting at http://localhost:3000$(RESET)\n"
	@printf "Press Ctrl+C to stop\n"
	@printf "\n"
	$(COMPOSE) up

run-local:
	@printf "$(GREEN)Starting Obelisk for local network...$(RESET)\n"
	@LOCAL_IP=$$(hostname -I | awk '{print $$1}'); \
	printf "\n"; \
	printf "$(GREEN)App starting:$(RESET)\n"; \
	printf "  Local:   http://localhost:3000\n"; \
	printf "  Network: http://$$LOCAL_IP:3000\n"; \
	printf "\n"; \
	printf "Press Ctrl+C to stop\n"
	$(COMPOSE) -f docker-compose.yml -f docker-compose.local.yml up

stop:
	@printf "Stopping services...\n"
	$(COMPOSE) down
	@printf "$(GREEN)Stopped.$(RESET) Data preserved.\n"

logs:
	$(COMPOSE) logs -f

rebuild:
	@printf "$(YELLOW)Rebuilding...$(RESET)\n"
	$(COMPOSE) down
	$(COMPOSE) up -d --build
	@sleep 3
	$(COMPOSE) exec app bun run drizzle-kit push
	@printf "$(GREEN)Rebuild complete!$(RESET) Run 'make run' to start\n"

destroy:
	@printf "$(YELLOW)Destroying all Obelisk data...$(RESET)\n"
	$(COMPOSE) down -v --remove-orphans
	rm -rf .next node_modules
	@printf "Done. Run 'make setup' to start fresh.\n"

download-pbf:
	@if [ -f data/Muenchen.osm.pbf ]; then \
		printf "$(GREEN)PBF extract already exists, skipping download$(RESET)\n"; \
	else \
		mkdir -p data; \
		printf "$(CYAN)Downloading Munich OSM PBF extract...$(RESET)\n"; \
		curl -L -o data/Muenchen.osm.pbf https://download.bbbike.org/osm/bbbike/Muenchen/Muenchen.osm.pbf; \
		printf "$(GREEN)Download complete: data/Muenchen.osm.pbf$(RESET)\n"; \
	fi

seed-regions:
	$(COMPOSE) exec app bun scripts/seed-regions.ts

seed-cuisines:
	$(COMPOSE) exec app bun scripts/seed-cuisines.ts

seed-tags:
	$(COMPOSE) exec app bun scripts/seed-tags.ts

seed-pois:
	$(COMPOSE) exec app bun scripts/seed-pois.ts

seed-all: seed-regions seed-cuisines seed-tags seed-pois

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

search-setup: seed-pois enrich-pois sync-search generate-embeddings
