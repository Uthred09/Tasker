# tasker — Project Instructions

## Tech Stack

- **Backend:** Go (Echo v4 router, zerolog logging, pgx/v5 Postgres driver)
- **Frontend:** React + Vite + TypeScript
- **Auth:** Clerk (JWT validation via `clerk-sdk-go`)
- **Database:** PostgreSQL (migrations in `internal/database/migrations/`)
- **Cache/Queue:** Redis (Asynq for background jobs)
- **Observability:** New Relic (APM, distributed tracing, nrredis, nrpkgerrors)
- **Config:** Koanf (env vars prefixed `tasker_`, struct validation at startup)
- **Contracts:** Zod + ts-rest → OpenAPI (shared `packages/zod`, `packages/openapi`)
- **Monorepo:** Turborepo + Bun

## Architecture

Layered: `cmd → server → repository → service → handler → router`

- **Server** struct is the dependency container (DB, Redis, Logger, Jobs)
- **Handlers** use generic `Handle[Req, Res]()` wrapper from `handler/base.go`
- **Errors** use two-layer system: `internal/errs/` (HTTP errors) + `internal/sqlerr/` (DB error translation)
- **Middleware** pipeline order: RateLimit → CORS → Secure → RequestID → Tracing → ContextEnhancer → Logger → Recover
- **Auth** middleware (`RequireAuth`) goes on route groups, not globally
- **Background jobs** use Asynq with priority queues (critical:6, default:3, low:1)

## Commands

```bash
# Backend (from apps/backend/)
task run          # Start server (uses Taskfile.yml)
task migrate      # Run migrations

# Frontend (from apps/frontend/)
bun dev           # Start dev server
bun build         # Production build

# Monorepo (from root)
bun run build     # Build all packages
```

## Conventions

- Domain models live in `internal/model/<domain>/` with separate `dto.go`
- Environment variables use `tasker_` prefix
- All config fields have `validate:"required"` — app crashes at startup if missing
- Request-scoped loggers via `middleware.GetLogger(c)` — never create ad-hoc loggers in handlers
- DB errors are NEVER exposed to clients — `sqlerr.HandleError()` translates them

---

## Development Workflow

0. **Research & Reuse** — GitHub search first, then library docs (Context7), then Exa
1. **Plan First** — use **planner** agent for complex features; generate PRD/architecture/task_list docs
2. **TDD** — write tests first (RED → GREEN → IMPROVE); 80%+ coverage required
3. **Code Review** — use **code-reviewer** agent after writing code; address CRITICAL/HIGH before merging
4. **Commit** — conventional commits (`feat:`, `fix:`, `refactor:`, etc.)

## Testing Requirements

- Minimum 80% coverage
- All three types required: Unit, Integration (DB/API), E2E (Playwright)
- Go: table-driven tests, always run with `-race` flag (`go test -race ./...`)
- TypeScript/React: use **e2e-runner** agent for Playwright flows
- Use **tdd-guide** agent proactively for new features

## Security

Before ANY commit:

- No hardcoded secrets — use env vars; validate at startup (`validate:"required"`)
- SQL injection: parameterized queries only (pgx `$1, $2` params)
- XSS: sanitize all HTML output
- Auth/authz verified on all protected routes
- Rate limiting on all endpoints
- Error messages must not leak DB or internal details

Go: always use `context.Context` with timeouts (`context.WithTimeout`); run `gosec ./...`
TypeScript: use Zod for all input validation at boundaries

If security issue found: STOP → use **security-reviewer** agent → fix CRITICAL before continuing

## Coding Style

**Immutability (CRITICAL):** never mutate — return new objects/structs
**File size:** 200–400 lines typical, 800 max; organize by feature/domain
**Functions:** < 50 lines; no deep nesting (> 4 levels); explicit error handling at every level

### Go

- `gofmt` + `goimports` mandatory
- Accept interfaces, return structs; keep interfaces small (1–3 methods)
- Always wrap errors: `return fmt.Errorf("failed to create user: %w", err)`
- Constructor injection: `func NewUserService(repo UserRepository, logger Logger) *UserService`

### TypeScript

- Explicit types on all exported functions and component props
- Prefer `interface` for object shapes, `type` for unions/intersections
- No `any` — use `unknown` and narrow safely
- No `console.log` in production code
- Zod schemas are single source of truth; infer types with `z.infer<>`

## Agent Orchestration

| Agent                    | When to use                               |
| ------------------------ | ----------------------------------------- |
| **planner**              | Complex features, refactoring             |
| **architect**            | Architectural decisions                   |
| **tdd-guide**            | New features, bug fixes                   |
| **code-reviewer**        | After writing/modifying code              |
| **security-reviewer**    | Auth, payments, user data, before commits |
| **build-error-resolver** | Build fails                               |
| **go-reviewer**          | All Go code changes                       |
| **typescript-reviewer**  | All TS/JS code changes                    |
| **e2e-runner**           | Critical user flows                       |

Run independent agents in parallel whenever possible.

## Code Review Standards

MANDATORY triggers: after writing/modifying code, before commits, security-sensitive changes, PRs

Severity: **CRITICAL** (block) → **HIGH** (should fix) → **MEDIUM** (consider) → **LOW** (optional)

Approve only when no CRITICAL/HIGH issues remain.

## Context7 (Library Docs)

Use `resolve-library-id` + `query-docs` whenever asking about a library, framework, SDK, or API —
even well-known ones (Echo, pgx, zerolog, Zod, ts-rest, Clerk, Asynq). Training data may be stale.
