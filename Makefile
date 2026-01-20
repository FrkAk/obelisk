.PHONY: help setup run run-local stop logs rebuild destroy

CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help:
	@echo ""
	@echo "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App"
	@echo ""
	@echo "$(GREEN)Commands:$(RESET)"
	@echo "  $(CYAN)setup$(RESET)      First-time setup (build, migrate, pull model, seed)"
	@echo "  $(CYAN)run$(RESET)        Start on localhost:3000"
	@echo "  $(CYAN)run-local$(RESET)  Start exposed to local network (same WiFi)"
	@echo "  $(CYAN)stop$(RESET)       Stop services (keeps data)"
	@echo "  $(CYAN)logs$(RESET)       View all logs"
	@echo "  $(CYAN)rebuild$(RESET)    Rebuild without cache"
	@echo "  $(CYAN)destroy$(RESET)    Stop and remove all data"
	@echo ""

setup:
	@echo "$(GREEN)Setting up Obelisk...$(RESET)"
	docker compose build
	docker compose up -d
	@echo "Waiting for services..."
	@sleep 10
	docker compose exec app bun run drizzle-kit push
	docker compose exec ollama ollama pull gemma3:4b-it-q4_K_M
	docker compose exec app bun scripts/seed-pois.ts
	-docker compose exec app bun scripts/generate-stories.ts || true
	@echo ""
	@echo "$(GREEN)Setup complete!$(RESET) Run 'make run' to start"

run:
	@echo "$(GREEN)Starting Obelisk...$(RESET)"
	docker compose up -d
	@sleep 3
	-docker compose exec -T app bun run drizzle-kit push 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)Obelisk running at http://localhost:3000$(RESET)"

run-local:
	@echo "$(GREEN)Starting Obelisk for local network...$(RESET)"
	docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
	@sleep 3
	-docker compose -f docker-compose.yml -f docker-compose.local.yml exec -T app bun run drizzle-kit push 2>/dev/null || true
	@LOCAL_IP=$$(hostname -I | awk '{print $$1}'); \
	echo ""; \
	echo "$(GREEN)Obelisk running:$(RESET)"; \
	echo "  Local:   http://localhost:3000"; \
	echo "  Network: http://$$LOCAL_IP:3000"

stop:
	docker compose down

logs:
	docker compose logs -f

rebuild:
	@echo "$(YELLOW)Rebuilding without cache...$(RESET)"
	docker compose down
	rm -rf .next
	docker compose build --no-cache
	docker compose up -d
	@sleep 3
	-docker compose exec -T app bun run drizzle-kit push 2>/dev/null || true
	@echo "$(GREEN)Rebuild complete!$(RESET)"

destroy:
	@echo "$(YELLOW)Destroying all Obelisk data...$(RESET)"
	docker compose down -v --remove-orphans
	rm -rf .next node_modules
	@echo "Done. Run 'make setup' to start fresh."
