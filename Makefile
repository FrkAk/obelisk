.PHONY: help setup finish-setup run run-local stop logs rebuild destroy download-pbf download-datasets build-taxonomy build-brands seed-regions seed-cuisines seed-tags seed-pois seed-all enrich-taxonomy sync-search generate-embeddings search-setup db-dump db-restore
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
export TYPESENSE_API_KEY ?= obelisk_typesense_dev
export SEED_RADIUS ?= 2000
export SEED_LOCATION ?= munich

help:
	@printf "\n"
	@printf "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App\n"
	@printf "\n"
	@printf "$(GREEN)Commands:$(RESET)\n"
	@printf "  $(CYAN)setup$(RESET)          First-time setup (deps, db, model, seed)\n"
	@printf "  $(CYAN)finish-setup$(RESET)   Continue setup after enrich (stories + search + embeddings)\n"
	@printf "  $(CYAN)run$(RESET)        Start on localhost:3000\n"
	@printf "  $(CYAN)run-local$(RESET)  Start exposed to local network (same WiFi)\n"
	@printf "  $(CYAN)stop$(RESET)       Stop services (keeps data)\n"
	@printf "  $(CYAN)logs$(RESET)       View database logs\n"
	@printf "  $(CYAN)rebuild$(RESET)    Clean rebuild (deps + next cache)\n"
	@printf "  $(CYAN)destroy$(RESET)    Stop and remove all data\n"
	@printf "\n"
	@printf "$(GREEN)Seeding (SEED_LOCATION=$(SEED_LOCATION)):$(RESET)\n"
	@printf "  $(CYAN)seed-all$(RESET)            Run all seed steps in order\n"
	@printf "  $(CYAN)seed-regions$(RESET)        Seed regions (country -> city)\n"
	@printf "  $(CYAN)seed-cuisines$(RESET)       Seed cuisine taxonomy\n"
	@printf "  $(CYAN)seed-tags$(RESET)           Seed tags across all groups\n"
	@printf "  $(CYAN)download-pbf$(RESET)        Download OSM PBF extract for location\n"
	@printf "  $(CYAN)seed-pois$(RESET)           Seed POIs from local OSM extract\n"
	@printf "\n"
	@printf "$(GREEN)Enrichment:$(RESET)\n"
	@printf "  $(CYAN)download-datasets$(RESET)   Download external datasets (taxonomy, NSI, taginfo, wikidata)\n"
	@printf "  $(CYAN)build-taxonomy$(RESET)      Build tag enrichment map from downloaded data\n"
	@printf "  $(CYAN)build-brands$(RESET)        Build brand enrichment map from NSI + Wikidata\n"
	@printf "  $(CYAN)enrich-taxonomy$(RESET)     Enrich POIs with taxonomy data + LLM summaries\n"
	@printf "\n"
	@printf "$(GREEN)Search Pipeline:$(RESET)\n"
	@printf "  $(CYAN)sync-search$(RESET)         Sync POIs to Typesense\n"
	@printf "  $(CYAN)generate-embeddings$(RESET)  Generate vector embeddings\n"
	@printf "  $(CYAN)search-setup$(RESET)        Run full search pipeline\n"
	@printf "\n"
	@printf "$(GREEN)Database:$(RESET)\n"
	@printf "  $(CYAN)db-dump$(RESET)     Export database to db/dump.sql\n"
	@printf "  $(CYAN)db-restore$(RESET)  Restore database from db/dump.sql\n"
	@printf "\n"

setup:
	@printf "$(GREEN)Setting up Obelisk ($(SEED_LOCATION))...$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)[1/14]$(RESET) Building and starting services...\n"
	$(COMPOSE) up -d --build
	@printf "Waiting for services...\n"
	@sleep 8
	@printf "\n"
	@printf "$(CYAN)[2/14]$(RESET) Enabling extensions and running migrations...\n"
	$(COMPOSE) exec -T postgres psql -U obelisk -d obelisk -f /dev/stdin < drizzle/0001_enable_extensions.sql
	$(COMPOSE) exec app bun run drizzle-kit push
	@printf "\n"
	@printf "$(CYAN)[3/14]$(RESET) Ensuring Ollama models...\n"
	ollama pull $(OLLAMA_MODEL)
	ollama pull $(OLLAMA_SEARCH_MODEL)
	ollama pull $(OLLAMA_EMBED_MODEL)
	@printf "\n"
	@printf "$(CYAN)[4/14]$(RESET) Downloading external datasets...\n"
	$(COMPOSE) exec app bun scripts/download-datasets.ts
	@printf "\n"
	@printf "$(CYAN)[5/14]$(RESET) Building tag enrichment map...\n"
	$(COMPOSE) exec app bun scripts/build-taxonomy.ts
	@printf "\n"
	@printf "$(CYAN)[6/14]$(RESET) Building brand enrichment map...\n"
	$(COMPOSE) exec app bun scripts/build-brands.ts
	@printf "\n"
	@printf "$(CYAN)[7/14]$(RESET) Downloading OSM PBF extract...\n"
	$(MAKE) download-pbf
	@printf "\n"
	@printf "$(CYAN)[8/14]$(RESET) Seeding (regions, cuisines, tags, POIs)...\n"
	$(COMPOSE) exec app bun scripts/seed.ts
	@printf "\n"
	@printf "$(CYAN)[9/14]$(RESET) Enriching POIs with taxonomy data...\n"
	$(COMPOSE) exec app bun scripts/enrich-taxonomy.ts
	@printf "\n"
	@printf "$(CYAN)[10/14]$(RESET) Generating stories...\n"
	$(COMPOSE) exec app bun scripts/generate-stories.ts || true
	@printf "\n"
	@printf "$(CYAN)[11/14]$(RESET) Syncing search index + generating embeddings...\n"
	$(COMPOSE) exec app bun scripts/sync-typesense.ts
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
	@PBF_URL=$$(bun -e "const{getLocation}=require('./scripts/lib/locations');console.log(getLocation().pbfUrl)"); \
	PBF_FILE=$$(bun -e "const{getLocation}=require('./scripts/lib/locations');console.log(getLocation().pbfFilename)"); \
	if [ -f "data/$$PBF_FILE" ]; then \
		printf "$(GREEN)PBF extract already exists (data/$$PBF_FILE), skipping download$(RESET)\n"; \
	else \
		mkdir -p data; \
		printf "$(CYAN)Downloading $$PBF_FILE...$(RESET)\n"; \
		curl -L -o "data/$$PBF_FILE" "$$PBF_URL"; \
		printf "$(GREEN)Download complete: data/$$PBF_FILE$(RESET)\n"; \
	fi

download-datasets:
	$(COMPOSE) exec app bun scripts/download-datasets.ts

build-taxonomy:
	$(COMPOSE) exec app bun scripts/build-taxonomy.ts

build-brands:
	$(COMPOSE) exec app bun scripts/build-brands.ts

seed-regions:
	$(COMPOSE) exec app bun scripts/seed.ts --step regions

seed-cuisines:
	$(COMPOSE) exec app bun scripts/seed.ts --step cuisines

seed-tags:
	$(COMPOSE) exec app bun scripts/seed.ts --step tags

seed-pois:
	$(COMPOSE) exec app bun scripts/seed.ts --step pois

seed-all:
	$(COMPOSE) exec app bun scripts/seed.ts

enrich-taxonomy:
	$(COMPOSE) exec app bun scripts/enrich-taxonomy.ts

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

finish-setup:
	@printf "$(GREEN)Finishing setup (stories + search + embeddings)...$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)[10/14]$(RESET) Generating stories...\n"
	$(COMPOSE) exec app bun scripts/generate-stories.ts || true
	@printf "\n"
	@printf "$(CYAN)[11/14]$(RESET) Syncing search index + generating embeddings...\n"
	$(COMPOSE) exec app bun scripts/sync-typesense.ts
	$(COMPOSE) exec app bun scripts/generate-embeddings.ts
	@printf "\n"
	@printf "$(GREEN)Setup complete!$(RESET) Run 'make run' to start\n"

search-setup: seed-pois enrich-taxonomy sync-search generate-embeddings
