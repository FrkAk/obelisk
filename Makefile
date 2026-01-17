.PHONY: dev start build lint typecheck test up down logs shell db-migrate db-seed db-reset ollama-pull clean run destroy

run:
	@echo "Starting Obelisk..."
	docker compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "Checking if database needs migration..."
	-docker compose exec -T app pnpm drizzle-kit push 2>/dev/null || true
	@echo ""
	@echo "==================================="
	@echo "  Obelisk is running!"
	@echo "  Open: http://localhost:3000"
	@echo "==================================="
	@echo ""
	@echo "Useful commands:"
	@echo "  make logs     - View logs"
	@echo "  make down     - Stop services"
	@echo "  make destroy  - Stop and remove all data"

destroy:
	@echo "Stopping and removing all Obelisk data..."
	docker compose down -v --remove-orphans
	@echo "Cleaning build artifacts..."
	rm -rf .next node_modules
	@echo ""
	@echo "Obelisk destroyed. Run 'make setup' to start fresh."

up:
	docker compose up -d

up-logs:
	docker compose up

down:
	docker compose down

logs:
	docker compose logs -f

logs-app:
	docker compose logs -f app

shell:
	docker compose exec app sh

dev:
	pnpm dev

start:
	pnpm start

build:
	pnpm build

lint:
	docker compose exec app pnpm lint

lint-local:
	pnpm lint

typecheck:
	docker compose exec app pnpm typecheck

typecheck-local:
	pnpm typecheck

test:
	docker compose exec app pnpm test

db-migrate:
	docker compose exec app pnpm drizzle-kit push

db-migrate-local:
	pnpm drizzle-kit push

db-seed:
	docker compose exec app pnpm tsx scripts/seed-pois.ts
	-docker compose exec app pnpm tsx scripts/generate-stories.ts || echo "Story generation completed (some may have failed)"

db-seed-local:
	pnpm tsx scripts/seed-pois.ts
	pnpm tsx scripts/generate-stories.ts

db-reset:
	docker compose down -v postgres
	docker compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@until docker compose exec -T postgres pg_isready -U obelisk -d obelisk 2>/dev/null; do sleep 1; done
	docker compose restart app
	@sleep 3
	make db-migrate
	make db-seed

db-studio:
	docker compose exec app pnpm drizzle-kit studio

ollama-pull:
	docker compose exec ollama ollama pull gemma3:4b-it-q4_K_M

ollama-shell:
	docker compose exec ollama sh

setup:
	docker compose build
	docker compose up -d
	@echo "Waiting for services to be ready..."
	sleep 10
	make db-migrate
	make ollama-pull
	make db-seed
	@echo "Setup complete! App running at http://localhost:3000"

rebuild:
	docker compose build app
	docker compose up -d app

prod-build:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

clean:
	docker compose down -v
	rm -rf .next node_modules

clean-all:
	docker compose down -v --rmi all
