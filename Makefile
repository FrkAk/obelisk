.PHONY: help dev start build lint typecheck test up down logs shell db-migrate db-seed db-reset ollama-pull clean run destroy

# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help: ## Show this help
	@echo ""
	@echo "$(CYAN)Obelisk$(RESET) - Ambient Storytelling App"
	@echo ""
	@echo "$(GREEN)Quick Start:$(RESET)"
	@echo "  make run        Start everything (docker)"
	@echo "  make dev        Local development (pnpm)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# QUICK START
# =============================================================================

run: ## Start Obelisk (docker compose)
	@echo "$(GREEN)Starting Obelisk...$(RESET)"
	docker compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "Checking if database needs migration..."
	-docker compose exec -T app pnpm drizzle-kit push 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)===================================$(RESET)"
	@echo "  Obelisk is running!"
	@echo "  Open: http://localhost:3000"
	@echo "$(GREEN)===================================$(RESET)"
	@echo ""
	@echo "Useful commands:"
	@echo "  make logs     - View logs"
	@echo "  make down     - Stop services"
	@echo "  make destroy  - Stop and remove all data"

setup: ## First-time setup (build, migrate, seed)
	docker compose build
	docker compose up -d
	@echo "Waiting for services to be ready..."
	sleep 10
	make db-migrate
	make ollama-pull
	make db-seed
	@echo "$(GREEN)Setup complete!$(RESET) App running at http://localhost:3000"

destroy: ## Stop and remove all data
	@echo "$(YELLOW)Stopping and removing all Obelisk data...$(RESET)"
	docker compose down -v --remove-orphans
	@echo "Cleaning build artifacts..."
	rm -rf .next node_modules
	@echo ""
	@echo "Obelisk destroyed. Run 'make setup' to start fresh."

# =============================================================================
# DOCKER COMPOSE
# =============================================================================

up: ## Start docker services (detached)
	docker compose up -d

up-logs: ## Start docker services (with logs)
	docker compose up

down: ## Stop docker services
	docker compose down

logs: ## View all logs
	docker compose logs -f

logs-app: ## View app logs only
	docker compose logs -f app

logs-db: ## View database logs
	docker compose logs -f postgres

logs-ollama: ## View Ollama logs
	docker compose logs -f ollama

shell: ## Shell into app container
	docker compose exec app sh

rebuild: ## Rebuild and restart app container
	docker compose build app
	docker compose up -d app

# =============================================================================
# LOCAL DEVELOPMENT
# =============================================================================

dev: ## Start local dev server (pnpm)
	pnpm dev

start: ## Start production server locally
	pnpm start

build: ## Build for production
	pnpm build

lint: ## Run linter (docker)
	docker compose exec app pnpm lint

lint-local: ## Run linter (local)
	pnpm lint

typecheck: ## Run typecheck (docker)
	docker compose exec app pnpm typecheck

typecheck-local: ## Run typecheck (local)
	pnpm typecheck

test: ## Run tests (docker)
	docker compose exec app pnpm test

# =============================================================================
# DATABASE
# =============================================================================

db-migrate: ## Run database migrations (docker)
	docker compose exec app pnpm drizzle-kit push

db-migrate-local: ## Run database migrations (local)
	pnpm drizzle-kit push

db-seed: ## Seed POIs and generate stories (docker)
	docker compose exec app pnpm tsx scripts/seed-pois.ts
	-docker compose exec app pnpm tsx scripts/generate-stories.ts || echo "Story generation completed (some may have failed)"

db-seed-local: ## Seed POIs and generate stories (local)
	pnpm tsx scripts/seed-pois.ts
	pnpm tsx scripts/generate-stories.ts

db-reset: ## Reset database and reseed
	docker compose down -v postgres
	docker compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@until docker compose exec -T postgres pg_isready -U obelisk -d obelisk 2>/dev/null; do sleep 1; done
	docker compose restart app
	@sleep 3
	make db-migrate
	make db-seed

db-studio: ## Open Drizzle Studio
	docker compose exec app pnpm drizzle-kit studio

db-studio-local: ## Open Drizzle Studio (local)
	pnpm drizzle-kit studio

# =============================================================================
# OLLAMA / AI
# =============================================================================

ollama-pull: ## Pull the LLM model
	docker compose exec ollama ollama pull gemma3:4b-it-q4_K_M

ollama-shell: ## Shell into Ollama container
	docker compose exec ollama sh

ollama-models: ## List available Ollama models
	docker compose exec ollama ollama list

# =============================================================================
# SEARCH API TESTING
# =============================================================================

search-test: ## Test search API (requires curl + jq)
	@echo "$(CYAN)Testing search API...$(RESET)"
	@curl -s -X POST http://localhost:3000/api/search \
		-H "Content-Type: application/json" \
		-d '{"query": "coffee", "location": {"latitude": 48.137154, "longitude": 11.576124}, "radius": 1000}' \
		| jq '.results | length' | xargs -I {} echo "Found {} results"

search-discovery: ## Test discovery search
	@echo "$(CYAN)Testing discovery mode...$(RESET)"
	@curl -s -X POST http://localhost:3000/api/search \
		-H "Content-Type: application/json" \
		-d '{"query": "surprise me with history", "location": {"latitude": 48.137154, "longitude": 11.576124}, "radius": 2000}' \
		| jq '.'

# =============================================================================
# PRODUCTION
# =============================================================================

prod-build: ## Build for production (docker)
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up: ## Start production containers
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# =============================================================================
# CLEANUP
# =============================================================================

clean: ## Remove containers and volumes
	docker compose down -v
	rm -rf .next node_modules

clean-next: ## Remove .next directory only
	rm -rf .next

clean-all: ## Remove everything including images
	docker compose down -v --rmi all

# =============================================================================
# UTILITIES
# =============================================================================

status: ## Show status of all services
	@echo "$(CYAN)Docker Services:$(RESET)"
	@docker compose ps
	@echo ""
	@echo "$(CYAN)Disk Usage:$(RESET)"
	@docker compose images

check-env: ## Verify environment variables
	@echo "$(CYAN)Checking environment...$(RESET)"
	@test -f .env.local && echo "$(GREEN)✓$(RESET) .env.local exists" || echo "$(YELLOW)✗$(RESET) .env.local missing"
	@grep -q "NEXT_PUBLIC_MAPBOX_TOKEN" .env.local 2>/dev/null && echo "$(GREEN)✓$(RESET) Mapbox token set" || echo "$(YELLOW)✗$(RESET) Mapbox token missing"
	@docker compose ps --quiet postgres >/dev/null 2>&1 && echo "$(GREEN)✓$(RESET) PostgreSQL running" || echo "$(YELLOW)✗$(RESET) PostgreSQL not running"
	@docker compose ps --quiet ollama >/dev/null 2>&1 && echo "$(GREEN)✓$(RESET) Ollama running" || echo "$(YELLOW)✗$(RESET) Ollama not running"
