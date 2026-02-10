.PHONY: help setup run run-local stop logs rebuild destroy seed-pois enrich-pois sync-search generate-embeddings search-setup
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
	@echo ""
	@echo "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App ($(PLATFORM) / $(ARCH))"
	@echo ""
	@echo "$(GREEN)Commands:$(RESET)"
	@echo "  $(CYAN)setup$(RESET)      First-time setup (deps, db, model, seed)"
	@echo "  $(CYAN)run$(RESET)        Start on localhost:3000"
	@echo "  $(CYAN)run-local$(RESET)  Start exposed to local network (same WiFi)"
	@echo "  $(CYAN)stop$(RESET)       Stop services (keeps data)"
	@echo "  $(CYAN)logs$(RESET)       View database logs"
	@echo "  $(CYAN)rebuild$(RESET)    Clean rebuild (deps + next cache)"
	@echo "  $(CYAN)destroy$(RESET)    Stop and remove all data"
	@echo ""
	@echo "$(GREEN)Search Pipeline:$(RESET)"
	@echo "  $(CYAN)seed-pois$(RESET)           Seed POIs from Overpass API"
	@echo "  $(CYAN)enrich-pois$(RESET)         Enrich POIs with web data + LLM"
	@echo "  $(CYAN)sync-search$(RESET)         Sync POIs to Typesense"
	@echo "  $(CYAN)generate-embeddings$(RESET)  Generate vector embeddings"
	@echo "  $(CYAN)search-setup$(RESET)        Run full search pipeline"
	@echo ""

ifeq ($(ARCH),aarch64)

setup:
	@echo "$(GREEN)Setting up Obelisk on $(PLATFORM)...$(RESET)"
	@echo ""
	@echo "$(CYAN)[1/6]$(RESET) Installing dependencies..."
	bun install
	@echo ""
	@echo "$(CYAN)[2/6]$(RESET) Starting PostgreSQL..."
	$(COMPOSE) up -d
	@echo "Waiting for database..."
	@sleep 8
	@echo ""
	@echo "$(CYAN)[3/6]$(RESET) Running migrations..."
	bun run drizzle-kit push
	@echo ""
	@echo "$(CYAN)[4/6]$(RESET) Ensuring Ollama models..."
	ollama pull $(OLLAMA_MODEL)
	ollama pull $(OLLAMA_SEARCH_MODEL)
	@echo ""
	@echo "$(CYAN)[5/6]$(RESET) Seeding POIs..."
	bun scripts/seed-pois.ts
	@echo ""
	@echo "$(CYAN)[6/6]$(RESET) Generating stories..."
	-bun scripts/generate-stories.ts || true
	@echo ""
	@echo "$(GREEN)Setup complete!$(RESET) Run 'make run' to start"

run:
	@echo "$(GREEN)Starting Obelisk ($(PLATFORM))...$(RESET)"
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)App starting at http://localhost:3000$(RESET)"
	@echo "Press Ctrl+C to stop the app"
	@echo ""
	bun run dev

run-local:
	@echo "$(GREEN)Starting Obelisk for local network ($(PLATFORM))...$(RESET)"
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@LOCAL_IP=$$(hostname -I | awk '{print $$1}'); \
	echo ""; \
	echo "$(GREEN)App starting:$(RESET)"; \
	echo "  Local:   http://localhost:3000"; \
	echo "  Network: http://$$LOCAL_IP:3000"; \
	echo ""; \
	echo "Press Ctrl+C to stop the app"
	bun run dev --hostname 0.0.0.0

rebuild:
	@echo "$(YELLOW)Rebuilding ($(PLATFORM))...$(RESET)"
	$(COMPOSE) down
	rm -rf .next node_modules
	bun install
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@echo "$(GREEN)Rebuild complete!$(RESET) Run 'make run' to start"

else

setup:
	@echo "$(GREEN)Setting up Obelisk on $(PLATFORM)...$(RESET)"
	@echo ""
	@echo "$(CYAN)[1/6]$(RESET) Building and starting services..."
	$(COMPOSE) up -d --build
	@echo "Waiting for services..."
	@sleep 8
	@echo ""
	@echo "$(CYAN)[2/6]$(RESET) Enabling extensions and running migrations..."
	$(COMPOSE) exec -T postgres psql -U obelisk -d obelisk -f /dev/stdin < drizzle/0001_enable_extensions.sql
	$(COMPOSE) exec app bun run drizzle-kit push
	@echo ""
	@echo "$(CYAN)[3/6]$(RESET) Ensuring Ollama models..."
	ollama pull $(OLLAMA_MODEL)
	ollama pull $(OLLAMA_SEARCH_MODEL)
	ollama pull $(OLLAMA_EMBED_MODEL)
	@echo ""
	@echo "$(CYAN)[4/6]$(RESET) Seeding POIs..."
	$(COMPOSE) exec app bun scripts/seed-pois.ts
	@echo ""
	@echo "$(CYAN)[5/6]$(RESET) Generating stories..."
	-$(COMPOSE) exec app bun scripts/generate-stories.ts || true
	@echo ""
	@echo "$(GREEN)Setup complete!$(RESET) Run 'make run' to start"

run:
	@echo "$(GREEN)Starting Obelisk ($(PLATFORM))...$(RESET)"
	@echo ""
	@echo "$(GREEN)App starting at http://localhost:3000$(RESET)"
	@echo "Press Ctrl+C to stop"
	@echo ""
	$(COMPOSE) up

run-local:
	@echo "$(GREEN)Starting Obelisk for local network ($(PLATFORM))...$(RESET)"
	@LOCAL_IP=$$(hostname -I | awk '{print $$1}'); \
	echo ""; \
	echo "$(GREEN)App starting:$(RESET)"; \
	echo "  Local:   http://localhost:3000"; \
	echo "  Network: http://$$LOCAL_IP:3000"; \
	echo ""; \
	echo "Press Ctrl+C to stop"
	docker compose -f docker-compose.yml -f docker-compose.local.yml up

rebuild:
	@echo "$(YELLOW)Rebuilding ($(PLATFORM))...$(RESET)"
	$(COMPOSE) down
	$(COMPOSE) up -d --build
	@sleep 3
	$(COMPOSE) exec app bun run drizzle-kit push
	@echo "$(GREEN)Rebuild complete!$(RESET) Run 'make run' to start"

endif

stop:
	@echo "Stopping services..."
	$(COMPOSE) down
	@echo "$(GREEN)Stopped.$(RESET) Data preserved."

logs:
	$(COMPOSE) logs -f

destroy:
	@echo "$(YELLOW)Destroying all Obelisk data...$(RESET)"
	$(COMPOSE) down -v --remove-orphans
	rm -rf .next node_modules
	@echo "Done. Run 'make setup' to start fresh."

ifeq ($(ARCH),aarch64)

seed-pois:
	bun scripts/seed-pois.ts

enrich-pois:
	bun scripts/enrich-pois.ts

sync-search:
	bun scripts/sync-typesense.ts

generate-embeddings:
	bun scripts/generate-embeddings.ts

else

seed-pois:
	$(COMPOSE) exec app bun scripts/seed-pois.ts

enrich-pois:
	$(COMPOSE) exec app bun scripts/enrich-pois.ts

sync-search:
	$(COMPOSE) exec app bun scripts/sync-typesense.ts

generate-embeddings:
	$(COMPOSE) exec app bun scripts/generate-embeddings.ts

endif

search-setup: seed-pois enrich-pois sync-search generate-embeddings
