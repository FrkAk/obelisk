# Obelisk - Claude Memory

## Claude Instructions

- **Always use available `make` commands** instead of raw `pnpm` or `docker` commands, if not exist in make commands you can use normal raw commands.
- Run `make run` to start the project, `make destroy` to stop everything
- Run `make check` before committing to verify lint and types pass
- All services are localhost-only; never expose to network

## Project Overview

Obelisk is a next-generation map application that transforms navigation into a human experience through AI-powered contextual discovery.

### Core Feature: Remarks

Remarks is the **core differentiator** - an LLM-powered discovery system that automatically surfaces contextual stories as users explore:

- **Automatic Discovery**: Proximity-triggered pop-ups when near interesting places (no user action needed)
- **LLM Storytelling**: Contextual narratives generated from POI data (OpenStreetMap, Wikipedia)
- **Personalization**: Learns user preferences (historical, cultural, food, etc.) over time
- **User-Created Remarks**: Secondary feature for human-curated tours and local knowledge

**Example**: Walking from Karlsplatz toward Viktualienmarkt, a subtle notification appears: "The Fountain's Secret" - you're passing a historic fountain with a hidden story. Tap to hear a 30-second narration, or keep walking and another story finds you.

### Other Features

- **Capsules**: Location-locked digital time capsules
- **Moments**: Synchronized real-time experiences with friends

## Tech Stack

- **Frontend:** Next.js 15+ (App Router), Tailwind CSS 4, shadcn/ui
- **State:** TanStack Query + Zustand
- **Backend:** Hono + tRPC
- **Database:** PostgreSQL 16 + PostGIS + Drizzle ORM
- **Auth:** Lucia Auth
- **Maps:** MapLibre GL JS + react-map-gl
- **Storage:** Local filesystem (public/uploads/)
- **LLM:** Ollama / vLLM (self-hosted)
- **TTS:** Piper / Coqui TTS (self-hosted)
- **Deployment:** Docker + Docker Compose

## Code Standards

### Documentation Style

Use **Google-style docstrings** for all functions, classes, and modules:

```typescript
/**
 * Brief description of what the function does.
 *
 * Args:
 *     paramName: Description of the parameter.
 *     anotherParam: Description of another parameter.
 *
 * Returns:
 *     Description of the return value.
 *
 * Raises:
 *     ErrorType: When this error occurs.
 *
 * Example:
 *     const result = myFunction(arg1, arg2);
 */
```

### Comments Policy

- **NO inline comments** unless explaining a genuinely complex algorithm
- Code must be self-documenting through clear naming
- If you need a comment to explain what code does, refactor the code instead

### Design Principles

- **SOLID** - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple, Stupid
- **Composition over Inheritance**
- **Dependency Injection** where it improves testability
- **Early Returns** to reduce nesting

### Clean Code Rules

- Meaningful, descriptive names for variables, functions, and files
- Small, focused functions (prefer < 20 lines)
- Strict TypeScript - no `any` types
- Custom error types for error handling
- Consistent naming: kebab-case for files/folders, PascalCase for components/types, camelCase for functions/variables

### File Structure

- One component per file
- Co-locate related files (component + hook + types)
- Keep imports organized: external, internal, relative

## Commands

**Always use `make` commands for common operations:**

| Command | Description |
|---------|-------------|
| `make run` | Start everything (Docker + migrations + dev server) |
| `make dev` | Start dev server only (services must be running) |
| `make start` | Start Docker services only |
| `make stop` | Stop Docker services |
| `make destroy` | Stop everything and remove all data |
| `make migrate` | Run database migrations |
| `make build` | Build for production |
| `make check` | Run lint and typecheck |
| `make logs` | Show Docker service logs |
| `make db-studio` | Open Drizzle Studio |
| `make help` | Show all available commands |

**Note:** All services bind to `127.0.0.1` only (not exposed to network).

## Key Directories

- `src/app/` - Next.js pages and API routes
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities, clients, and configurations
- `src/server/` - tRPC routers and backend services
- `src/stores/` - Zustand stores
- `drizzle/` - Database migrations

## Important Patterns

### tRPC Router Pattern

```typescript
export const exampleRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return await exampleService.getById(input.id);
    }),
});
```

### Zustand Store Pattern

```typescript
interface ExampleState {
  value: string;
  setValue: (value: string) => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

### Service Pattern

Business logic lives in `src/server/services/`, keeping routers thin.

## Do NOT Create

- README.md or other documentation files (keep repo clean)
- Unnecessary configuration files
- Test files for trivial code

## References

- Plan: `Plan.md` in repo root
- Docker: `docker/docker-compose.yml`
