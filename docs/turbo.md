

Package Manager 3 — Turbo (Build Orchestrator — NOT a Package Manager)
This is the most confusing one because the name sounds like a package manager but it's not.
What it actually does: Coordinates build order and caching across workspaces. It does NOT install packages.
The mental model: Turbo is like a traffic controller at an airport. It doesn't fly planes (that's the package managers). It tells each plane when to take off, based on which planes it depends on.
turbo run build
    ↓
Turbo reads turbo.json
    ↓
"Sees: build task depends on ^build"
    ↓
"^ means: build my dependencies FIRST"
    ↓
Asks: does packages/zod depend on anything? NO → build it first
Asks: does packages/openapi depend on packages/zod? YES → build zod, then openapi
Asks: does apps/backend depend on packages? NO direct bun dep → build in parallel with Go
Turbo's caching — the killer feature:
turbo run build
    ↓
First run: builds everything, caches results in .turbo/
    ↓
Second run with NO code changes:
  → Turbo says "I have cached output from last time"
  → Skips all builds, outputs appear instantly
  → [build] cache hit (99% faster)
    ↓
You change ONE file in packages/zod:
  → Turbo rebuilds only packages/zod and packages/openapi (depends on zod)
  → apps/backend is NOT rebuilt (Go doesn't depend on TypeScript at runtime)
  → Everything else uses cache