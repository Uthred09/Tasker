What Is This Project?
Think of this project like building a restaurant from scratch. You've built:
- The kitchen (database)
- The reception desk (logger)
- The security guard (auth middleware)
- The ordering system (background jobs)
- The mail system (email service)
- The building structure (server, config)
But you haven't opened for business yet — there are no menu items (API routes), no chefs (handlers), and no recipes (business logic). The main.go still just says "Hello, World!"
---
Project Structure
go-backend-boilerplate/
├── backend/
│   ├── cmd/go-backend-boilerplate/
│   │   └── main.go                    ← ENTRY POINT (stub — prints "Hello, World!")
│   │
│   └── internal/
│       ├── config/
│       │   ├── config.go              ← Loads all settings from environment variables
│       │   └── observability.go       ← Logging + New Relic settings
│       │
│       ├── database/
│       │   ├── database.go            ← PostgreSQL connection pool
│       │   ├── migrator.go            ← Database schema migrations
│       │   └── migrations/            ← SQL migration files (empty)
│       │
│       ├── errs/
│       │   ├── http.go                ← Standard HTTP error structure
│       │   └── types.go               ← Error factories (400, 401, 403, 404, 500)
│       │
│       ├── sqlerr/
│       │   ├── error.go               ← PostgreSQL error codes
│       │   └── handler.go             ← Converts DB errors → HTTP errors
│       │
│       ├── logger/
│       │   └── logger.go              ← Zerolog + New Relic logging
│       │
│       ├── server/
│       │   └── server.go              ← Wires DB + Redis + Jobs + HTTP together
│       │
│       ├── middleware/
│       │   ├── middlewares.go          ← Aggregates all middleware
│       │   ├── global.go              ← CORS, logging, panic recovery, error handler
│       │   ├── auth.go                ← Clerk JWT authentication
│       │   ├── context.go             ← Enriches logger with request info
│       │   ├── tracing.go             ← New Relic distributed tracing
│       │   ├── rate_limit.go          ← Rate limiting (skeleton only)
│       │   └── request_id.go          ← X-Request-ID generation
│       │
│       └── lib/
│           ├── email/                 ← Email sending via Resend API
│           ├── jobs/                  ← Background job processing via Asynq
│           └── utils/                 ← PrintJSON helper
---
How Each Piece Works (The Restaurant Analogy)
1. Config (config/) — The Restaurant's Blueprint
> Before opening a restaurant, you need a blueprint: what's the address? How many tables? What's the WiFi password?
>
> config.go loads ALL settings from environment variables prefixed with BOILERPLATE_:
> > BOILERPLATE_SERVER_PORT=8080        → server.port = "8080"
> BOILERPLATE_DATABASE_HOST=localhost  → database.host = "localhost"
> >
> It validates everything — if something required is missing, the app refuses to start.
2. Logger (logger/) — The Security Camera System
> Every restaurant has cameras. Your logger records everything that happens:
> - Development: colorful, easy-to-read text (for you)
> - Production: JSON (for machines to search and analyze)
> - New Relic: sends logs to a monitoring dashboard (like a remote security office)
3. Database (database/) — The Kitchen Storage
> The database is where all your data lives. This code:
> - Creates a connection pool (multiple connections ready to use, like having multiple kitchen staff)
> - Runs migrations (schema changes, like renovating the kitchen)
> - Traces queries (logs what SQL runs and how long it takes)
4. Server (server/) — The Restaurant Building
> This is the building itself. It wires together:
> - Database (kitchen storage)
> - Redis (a fast cache, like a whiteboard for quick notes)
> - Background jobs (like a dishwasher running in the background)
> - HTTP server (the front door where requests come in)
5. Middleware (middleware/) — The Staff That Greets Every Customer
> Every HTTP request passes through middleware before reaching a handler. The chain:
>
> > Request arrives at the door
>     ↓
> [1] RequestID        → Stamp a unique ID on every request
> [2] New Relic        → Start tracking this request
> [3] Recover          → Catch panics (prevent crashes)
> [4] Secure           → Add security headers
> [5] CORS             → Check if this origin is allowed
> [6] ContextEnhancer  → Attach logger with request details
> [7] RequestLogger    → Log the request when it completes
> [8] EnhanceTracing   → Add custom data to New Relic
> [9] RequireAuth      → Check Clerk JWT token (per-route)
>     ↓
> [Handler]            → (NOT BUILT YET)
>     ↓
> [Error Handler]      → Convert any error to clean JSON response
> 
6. Error Handling (errs/ + sqlerr/) — The Complaint Department
> When something goes wrong:
> - errs/ defines standard error shapes: { code: "NOT_FOUND", message: "User not found", status: 404 }
> - sqlerr/ translates database errors into human-friendly messages:
>   - PostgreSQL "unique_violation" → 400 Bad Request: "User already exists"
>   - PostgreSQL "foreign_key_violation" → 400 Bad Request: "Referenced record not found"
>   - No rows found → 404 Not Found
7. Email (lib/email/) — The Mail Room
> Sends emails via Resend API. Currently has one template: welcome email.
8. Jobs (lib/jobs/) — The Background Workers
> Some tasks take too long for an HTTP request (sending emails, processing files).
> Background jobs handle this using Asynq (backed by Redis):
> - 3 priority queues: critical (6), default (3), low (1)
> - 10 concurrent workers
> - Currently: welcome email task with 3 retries
---
What's Built vs. What's Missing
===========================================================================|
Built (Infrastructure)	            |Missing (Application)
===========================================================================|
Config loading + validation         |main.go wiring (nothing runs)
Database connection pool	        |Route definitions (no API endpoints)
Migration framework	                |Handler/Controller layer
Redis client	                    |Service/Business logic layer
Background job processing	        |Repository/Data access layer
Email sending	                    |Actual migration SQL
Full middleware stack	            |Health check endpoints
Auth middleware (Clerk)	            |Graceful shutdown signal handling
Structured logging	                |Tests (zero test files)
Error handling + SQL translation	|Email HTML templates
New Relic APM integration	        |Rate limiting logic                    
============================================================================|