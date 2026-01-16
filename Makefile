.PHONY: run dev start stop restart clean destroy install migrate db-push db-studio db-seed db-seed-pois logs help wait-db

# Default target
.DEFAULT_GOAL := help

# Variables
DOCKER_COMPOSE := docker compose -f docker/docker-compose.yml

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

run: start wait-db migrate db-seed db-seed-pois ## Start everything (services + dev server)
	pnpm dev

dev: ## Start dev server only (assumes services are running)
	pnpm dev

start: ## Start Docker services
	$(DOCKER_COMPOSE) up -d

stop: ## Stop Docker services
	$(DOCKER_COMPOSE) down

restart: ## Restart Docker services
	$(DOCKER_COMPOSE) restart

clean: ## Stop services and remove volumes
	$(DOCKER_COMPOSE) down -v

destroy: ## Stop everything and remove all data
	@echo "Stopping all services..."
	-@pkill -f "next dev" 2>/dev/null || true
	$(DOCKER_COMPOSE) down -v --remove-orphans
	@echo "All services stopped and data removed"

wait-db: ## Wait for database to be ready
	@echo "Waiting for database..."
	@until docker exec obelisk-postgres pg_isready -U obelisk -d obelisk > /dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "Database is ready"

migrate: ## Run database migrations
	@echo "Running migrations..."
	@for f in drizzle/*.sql; do \
		echo "Applying $$f..."; \
		docker exec -i obelisk-postgres psql -U obelisk -d obelisk < "$$f" 2>/dev/null || true; \
	done
	@echo "Migrations complete"

db-push: ## Push schema changes to database
	pnpm db:push

db-studio: ## Open Drizzle Studio
	pnpm db:studio

db-seed: ## Seed database with dev user
	pnpm db:seed

db-seed-pois: ## Seed database with POIs
	pnpm db:seed-pois

logs: ## Show Docker service logs
	$(DOCKER_COMPOSE) logs -f

build: ## Build for production
	pnpm build

lint: ## Run linter
	pnpm lint

typecheck: ## Run TypeScript type check
	pnpm typecheck

check: lint typecheck ## Run lint and typecheck
