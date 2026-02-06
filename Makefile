.PHONY: help setup run run-local stop logs rebuild destroy db-up db-down

CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

COMPOSE := docker compose -f docker-compose.jetson.yml

export DATABASE_URL := postgresql://obelisk:obelisk_dev@localhost:5432/obelisk
export OLLAMA_URL := http://localhost:11434
export OLLAMA_MODEL ?= gemma3:27b

help:
	@echo ""
	@echo "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App (Jetson Thor)"
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

setup:
	@echo "$(GREEN)Setting up Obelisk on Jetson Thor...$(RESET)"
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
	@echo "$(CYAN)[4/6]$(RESET) Ensuring Ollama model..."
	ollama pull $(OLLAMA_MODEL)
	@echo ""
	@echo "$(CYAN)[5/6]$(RESET) Seeding POIs..."
	bun scripts/seed-pois.ts
	@echo ""
	@echo "$(CYAN)[6/6]$(RESET) Generating stories..."
	-bun scripts/generate-stories.ts || true
	@echo ""
	@echo "$(GREEN)Setup complete!$(RESET) Run 'make run' to start"

run:
	@echo "$(GREEN)Starting Obelisk...$(RESET)"
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)App starting at http://localhost:3000$(RESET)"
	@echo "Press Ctrl+C to stop the app"
	@echo ""
	bun run dev

run-local:
	@echo "$(GREEN)Starting Obelisk for local network...$(RESET)"
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

stop:
	@echo "Stopping services..."
	$(COMPOSE) down
	@echo "$(GREEN)Stopped.$(RESET) Data preserved."

logs:
	$(COMPOSE) logs -f

rebuild:
	@echo "$(YELLOW)Rebuilding...$(RESET)"
	$(COMPOSE) down
	rm -rf .next node_modules
	bun install
	$(COMPOSE) up -d
	@sleep 3
	-bun run drizzle-kit push 2>/dev/null || true
	@echo "$(GREEN)Rebuild complete!$(RESET) Run 'make run' to start"

destroy:
	@echo "$(YELLOW)Destroying all Obelisk data...$(RESET)"
	$(COMPOSE) down -v --remove-orphans
	rm -rf .next node_modules
	@echo "Done. Run 'make setup' to start fresh."
