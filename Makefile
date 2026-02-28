.PHONY: help setup setup-quick finish-setup run run-local run-public stop logs rebuild destroy download-pbf download-datasets build-taxonomy build-brands seed-regions seed-cuisines seed-tags seed-pois seed-all enrich-taxonomy sync-search generate-embeddings search-setup db-dump db-restore
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
export SEED_RADIUS ?= -1
export SEED_LOCATION ?= munich

help:
	@printf "\n"
	@printf "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App\n"
	@printf "\n"
	@printf "$(GREEN)Commands:$(RESET)\n"
	@printf "  $(CYAN)setup$(RESET)          First-time setup (deps, db, model, seed)\n"
	@printf "  $(CYAN)setup-quick$(RESET)    Quick setup from db/dump.sql (skip seed + enrich)\n"
	@printf "  $(CYAN)finish-setup$(RESET)   Continue setup after enrich (stories + search + embeddings)\n"
	@printf "  $(CYAN)run$(RESET)            Start on localhost:3000\n"
	@printf "  $(CYAN)run-local$(RESET)      Start exposed to local network (same WiFi)\n"
	@printf "  $(CYAN)run-public$(RESET)     Start with Cloudflare Tunnel (obelisk.obeliskark.com)\n"
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
	@SETUP_START=$$(date +%s); \
	printf "$(GREEN)Setting up Obelisk ($(SEED_LOCATION))...$(RESET)\n"; \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 1]$(RESET) Building and starting services...\n"; \
	$(COMPOSE) up -d --build; \
	printf "Waiting for PostgreSQL...\n"; \
	until $(COMPOSE) exec -T postgres pg_isready -U obelisk -d obelisk >/dev/null 2>&1; do sleep 1; done; \
	printf "Waiting for Typesense...\n"; \
	until curl -sf http://localhost:8108/health >/dev/null 2>&1; do sleep 1; done; \
	printf "$(GREEN)Services healthy$(RESET)\n"; \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 2]$(RESET) Migrations + Ollama models + PBF download (parallel)...\n"; \
	( \
		$(COMPOSE) exec -T postgres psql -U obelisk -d obelisk -f /dev/stdin < drizzle/0001_enable_extensions.sql && \
		$(COMPOSE) exec -T app bun run drizzle-kit push \
	) & PID_MIGRATE=$$!; \
	( \
		ollama pull $(OLLAMA_MODEL) && \
		if [ "$(OLLAMA_SEARCH_MODEL)" != "$(OLLAMA_MODEL)" ]; then ollama pull $(OLLAMA_SEARCH_MODEL); fi && \
		ollama pull $(OLLAMA_EMBED_MODEL) \
	) & PID_OLLAMA=$$!; \
	$(MAKE) download-pbf & PID_PBF=$$!; \
	wait $$PID_MIGRATE || exit 1; \
	wait $$PID_OLLAMA || exit 1; \
	wait $$PID_PBF || exit 1; \
	printf "$(GREEN)Phase 2 complete$(RESET)\n"; \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 3]$(RESET) Downloading external datasets...\n"; \
	$(COMPOSE) exec app bun scripts/download-datasets.ts; \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 4]$(RESET) Building taxonomy + brands (parallel)...\n"; \
	$(COMPOSE) exec -T app bun scripts/build-taxonomy.ts & PID_TAX=$$!; \
	$(COMPOSE) exec -T app bun scripts/build-brands.ts & PID_BRAND=$$!; \
	wait $$PID_TAX || exit 1; \
	wait $$PID_BRAND || exit 1; \
	printf "$(GREEN)Phase 4 complete$(RESET)\n"; \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 5]$(RESET) Seeding (regions, cuisines, tags, POIs)...\n"; \
	STEP_START=$$(date +%s); \
	$(COMPOSE) exec app bun scripts/seed.ts; \
	STEP_END=$$(date +%s); \
	ELAPSED=$$((STEP_END - STEP_START)); \
	printf "$(GREEN)Seeding done in %dm%ds$(RESET)\n" $$((ELAPSED / 60)) $$((ELAPSED % 60)); \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 6]$(RESET) Enriching POIs with taxonomy data...\n"; \
	STEP_START=$$(date +%s); \
	$(COMPOSE) exec app bun scripts/enrich-taxonomy.ts; \
	STEP_END=$$(date +%s); \
	ELAPSED=$$((STEP_END - STEP_START)); \
	printf "$(GREEN)Enrichment done in %dm%ds$(RESET)\n" $$((ELAPSED / 60)) $$((ELAPSED % 60)); \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 7]$(RESET) Generating stories...\n"; \
	STEP_START=$$(date +%s); \
	$(COMPOSE) exec app bun scripts/generate-stories.ts || true; \
	STEP_END=$$(date +%s); \
	ELAPSED=$$((STEP_END - STEP_START)); \
	printf "$(GREEN)Stories done in %dm%ds$(RESET)\n" $$((ELAPSED / 60)) $$((ELAPSED % 60)); \
	printf "\n"; \
	\
	printf "$(CYAN)[Phase 8]$(RESET) Syncing search index + generating embeddings (parallel)...\n"; \
	STEP_START=$$(date +%s); \
	$(COMPOSE) exec -T app bun scripts/sync-typesense.ts & PID_SYNC=$$!; \
	$(COMPOSE) exec -T app bun scripts/generate-embeddings.ts & PID_EMBED=$$!; \
	wait $$PID_SYNC || exit 1; \
	wait $$PID_EMBED || exit 1; \
	STEP_END=$$(date +%s); \
	ELAPSED=$$((STEP_END - STEP_START)); \
	printf "$(GREEN)Search + embeddings done in %dm%ds$(RESET)\n" $$((ELAPSED / 60)) $$((ELAPSED % 60)); \
	printf "\n"; \
	\
	SETUP_END=$$(date +%s); \
	TOTAL=$$((SETUP_END - SETUP_START)); \
	printf "$(GREEN)Setup complete in %dm%ds!$(RESET) Run 'make run' to start\n" $$((TOTAL / 60)) $$((TOTAL % 60))

setup-quick:
	@if [ ! -f db/dump.sql ]; then printf "$(RED)No db/dump.sql found. Run 'make setup' for full setup or 'make db-dump' first.$(RESET)\n"; exit 1; fi
	@printf "$(GREEN)Quick setup from snapshot...$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)[1/4]$(RESET) Building and starting services...\n"
	$(COMPOSE) up -d --build
	@printf "Waiting for PostgreSQL...\n"
	@until $(COMPOSE) exec -T postgres pg_isready -U obelisk -d obelisk >/dev/null 2>&1; do sleep 1; done
	@printf "Waiting for Typesense...\n"
	@until curl -sf http://localhost:8108/health >/dev/null 2>&1; do sleep 1; done
	@printf "$(GREEN)Services healthy$(RESET)\n"
	@printf "\n"
	@printf "$(CYAN)[2/4]$(RESET) Restoring database from snapshot...\n"
	$(COMPOSE) exec -T postgres psql -U obelisk obelisk < db/dump.sql
	@printf "\n"
	@printf "$(CYAN)[3/4]$(RESET) Ensuring Ollama models...\n"
	ollama pull $(OLLAMA_MODEL)
	@if [ "$(OLLAMA_SEARCH_MODEL)" != "$(OLLAMA_MODEL)" ]; then ollama pull $(OLLAMA_SEARCH_MODEL); fi
	ollama pull $(OLLAMA_EMBED_MODEL)
	@printf "\n"
	@printf "$(CYAN)[4/4]$(RESET) Syncing search index...\n"
	$(COMPOSE) exec app bun scripts/sync-typesense.ts
	@printf "\n"
	@printf "$(GREEN)Quick setup complete!$(RESET) Run 'make run' to start\n"

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

run-public:
	@printf "$(GREEN)Starting Obelisk (production, public via Cloudflare Tunnel)...$(RESET)\n"
	@printf "\n"
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d
	@sleep 5
	@setsid cloudflared tunnel --pidfile /tmp/cloudflared.pid run obelisk > /tmp/cloudflared.log 2>&1 &
	@sleep 3
	@printf "$(GREEN)App running:$(RESET)\n"
	@printf "  Local:   http://localhost:3000\n"
	@printf "  Public:  https://obelisk.obeliskark.com\n"
	@printf "  Tunnel:  PID $$(cat /tmp/cloudflared.pid 2>/dev/null || echo 'starting...')\n"
	@printf "  Logs:    /tmp/cloudflared.log\n"
	@printf "\n"
	@printf "Run '$(CYAN)make stop$(RESET)' to stop everything\n"

stop:
	@printf "Stopping services...\n"
	@if [ -f /tmp/cloudflared.pid ]; then kill $$(cat /tmp/cloudflared.pid) 2>/dev/null; rm -f /tmp/cloudflared.pid; printf "Tunnel stopped\n"; fi
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
	@PBF_URL=$$(bun -e "const{getLocation}=require('./src/lib/geo/locations');console.log(getLocation().pbfUrl)"); \
	PBF_FILE=$$(bun -e "const{getLocation}=require('./src/lib/geo/locations');console.log(getLocation().pbfFilename)"); \
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
	@printf "$(CYAN)[1/2]$(RESET) Generating stories...\n"
	$(COMPOSE) exec app bun scripts/generate-stories.ts || true
	@printf "\n"
	@printf "$(CYAN)[2/2]$(RESET) Syncing search index + generating embeddings (parallel)...\n"
	@$(COMPOSE) exec -T app bun scripts/sync-typesense.ts & PID_SYNC=$$!; \
	$(COMPOSE) exec -T app bun scripts/generate-embeddings.ts & PID_EMBED=$$!; \
	wait $$PID_SYNC || exit 1; \
	wait $$PID_EMBED || exit 1
	@printf "\n"
	@printf "$(GREEN)Setup complete!$(RESET) Run 'make run' to start\n"

search-setup: seed-pois enrich-taxonomy sync-search generate-embeddings
