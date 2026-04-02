# Database Package

This package handles connecting your Go application to a PostgreSQL database. Think of it as the bridge between your application and your data storage.

## What is a Database Connection Pool?

Imagine you have a restaurant. Every time a customer orders food, you don't build a new kitchen - you use the existing kitchen. A **connection pool** works the same way:

- Instead of creating a new database connection for every request (slow!)
- We create a pool of connections once when the app starts
- Each request "borrows" a connection from the pool
- When done, the connection returns to the pool for reuse

This makes your application much faster!

## How This Code Works (Flow Overview)

### Step 1: Configuration
When your app starts, it calls `database.New()` with your config settings (host, port, username, password, database name).

### Step 2: Building the Connection String
The code creates a **DSN (Data Source Name)** - this is just a formatted string that tells pgx (the PostgreSQL driver) how to connect:

```
postgres://username:password@localhost:5432/mydb?sslmode=disable
```

The password is URL-encoded (special characters are escaped) to prevent connection errors.

### Step 3: Setting Up Monitoring (Tracers)

**What is a tracer?** It's like a security camera that watches database queries. It records:
- What query was run
- How long it took
- Any errors that occurred

This project supports two types:

1. **New Relic** (for production): Sends query data to New Relic's monitoring dashboard so you can see performance in real-time from anywhere.

2. **Local Logging** (for development): Prints queries to your console so you can see what's happening while developing.

In **local environment**, both are chained together - queries go to New Relic AND get printed locally. In **production**, only New Relic is used.

### Step 4: Creating the Pool

The connection pool is created with the configuration we built. This doesn't actually connect yet - it just prepares the pool.

### Step 5: Testing the Connection

Finally, we "ping" the database - this is like knocking on the door to make sure someone's home. If the ping fails, we return an error and the app won't start (which is good - better to fail fast than to crash later!).

## Key Components

### Database Struct
```go
type Database struct {
    Pool *pgxpool.Pool  // The connection pool
    log  *zerolog.Logger // For logging
}
```
This is the main "handle" you'll use throughout your app to run queries.

### multiTracer
A custom implementation that combines multiple tracers. It's like a TV remote that can control multiple TVs at once - one button press changes all of them.

## Using the Database in Your App

Here's the typical flow in your main.go:

```go
// 1. Create database connection
db, err := database.New(config, logger, loggerService)
if err != nil {
    logger.Fatal().Err(err).Msg("Can't connect to database")
}
defer db.Close() // Always clean up when app exits

// 2. Use it for queries
// db.Pool.Query(ctx, "SELECT * FROM users")
```

## Common Terms

| Term | Simple Meaning |
|------|----------------|
| pgx | A PostgreSQL driver for Go - handles all the low-level communication |
| pgxpool | Manages a pool of database connections |
| DSN | Connection string - tells the driver how to connect |
| SSLMode | Security setting for connection (disable for local, prefer/require for production) |
| Tracer | Something that watches and records queries |
| Ping | A quick check to verify the connection works |

## Learning Points

1. **Always close the pool**: Use `defer db.Close()` so connections are released when your app shuts down.

2. **Environment matters**: The code behaves differently in local vs production - that's intentional!

3. **Error handling**: If the database isn't available at startup, the whole app fails. This is correct behavior - your app can't function without its data layer.

4. **Connection strings need escaping**: Never put passwords directly in strings. Use `url.QueryEscape()` to handle special characters.

---

# Database Migrations (migrator.go)

This section explains how database migrations work in this project. Migrations are like a "version control for your database" - they track changes to your database structure over time.

## What is a Migration?

Imagine you're building a house. You don't just start with the final house - you build it step by step:
1. First, you lay the foundation
2. Then, you add walls
3. Then, you add the roof

Database migrations work the same way:
1. **First migration**: Create the initial tables (like users table)
2. **Second migration**: Add a new table (like orders table)
3. **Third migration**: Add a new column to an existing table

Each migration is a small, reversible change to your database schema.

## Why Use Migrations?

Without migrations:
- Every developer has a different database structure
- When new developers join, they don't know what tables to create
- It's hard to remember what changes were made to the database

With migrations:
- Everyone runs the same migrations to get the same database
- The migration files document exactly what changed
- You can roll back if something goes wrong

## How This Code Works (Flow Overview)

### Step 1: Embedding Migration Files

```go
//go:embed migrations/*.sql
var migrations embed.FS
```

This uses Go's special `embed` feature. It's like packing files into a ZIP:
- All `.sql` files from the `migrations/` folder are embedded directly into the binary
- When you deploy your app, you don't need to ship separate SQL files
- Everything is self-contained in one executable

### Step 2: Building the Connection String

Just like in database.go, we build a DSN (Data Source Name) to connect to PostgreSQL. The password is URL-encoded to handle special characters safely.

### Step 3: Creating the Migrator

```go
m, err := tern.NewMigrator(ctx, conn, "schema_version")
```

We create a "Tern migrator" - this is a tool that manages our migrations. It creates a special table called `schema_version` that tracks:
- Which migrations have been applied
- What version the database is currently at

Think of it like a changelog or a bookmark that remembers where you left off.

### Step 4: Loading Migration Files

```go
subtree, err := fs.Sub(migrations, "migrations")
m.LoadMigrations(subtree)
```

We "open" our embedded migration files and load them into memory. Tern reads all `.sql` files from the migrations folder and prepares them.

**Important**: Migration files should be named with a version prefix:
- `001_initial.sql`
- `002_add_users_table.sql`
- `003_add_orders_table.sql`

Tern reads them in order (1, 2, 3...) and applies them in that order.

### Step 5: Checking Current Version

```go
from, err := m.GetCurrentVersion(ctx)
```

Before running migrations, we check what version the database is currently at. This tells us:
- Where we started
- How many migrations need to be applied

### Step 6: Running Migrations

```go
m.Migrate(ctx)
```

This is the main event! The migrator compares:
- The current version in the database (from the schema_version table)
- The number of migration files available

If there are new migrations not yet applied, it runs them in order. If the database is already up to date, it does nothing.

### Step 7: Logging the Results

Finally, we log what happened:
- If no migrations were needed: "database schema up to date, version X"
- If migrations ran: "migrated database schema, from X to Y"

## Two Ways to Run Migrations

This project supports **two ways** to run migrations:

### 1. Automatic (Embedded) - Used in Production

The `Migrate()` function in this file runs automatically when your application starts:
- It's called from main.go during app initialization
- Migrations run automatically on every app start
- The SQL files are embedded in the binary (no separate files needed)

This is great for production - your database is always up to date!

### 2. Manual (CLI) - Used for Development

You can also run migrations manually using the tern CLI via Taskfile:

```bash
# Create a new migration
task migrations:new name=add_users_table

# Apply all pending migrations
task migrations:up
```

The Taskfile.yml shows how this works:
- `tern new` - Creates a new blank migration file
- `tern migrate` - Applies all pending migrations

This is useful when:
- You want to create migrations manually
- You need to test migrations separately from the app

## Creating a New Migration

### Option 1: Using Task (Recommended)

```bash
task migrations:new name=create_products_table
```

This creates a new file like `migrations/001_create_products_table.sql` in the migrations folder.

### Option 2: Manual

Create a new `.sql` file in `backend/internal/database/migrations/` with a version prefix:
- `001_my_migration.sql`
- `002_another_migration.sql`

Each migration file should contain:
- Comments describing what it does
- The SQL commands to apply the change

Example migration file:
```sql
-- Create users table
-- This is our initial table for storing user data

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
```

## The schema_version Table

When migrations run, Tern automatically creates a table called `schema_version`. It looks like this:

| version | applied |               description                |
|---------|----------|-------------------------------------------|
|       1 | ...      | initial                                   |
|       2 | ...      | add_users_table                           |
|       3 | ...      | add_orders_table                          |

This table tells Tern which migrations have already been applied, so it doesn't run them twice.

## Common Terms

| Term             | Simple Meaning                                                                 |
|------------------|--------------------------------------------------------------------------------|
| Migration        | A single change to the database schema (like adding a table)                 |
| Schema           | The structure of your database - tables, columns, relationships              |
| Tern             | A migration tool (library) that manages running SQL migrations               |
| schema_version  | A special table that tracks which migrations have been applied              |
| embed            | Go feature that bundles files directly into the binary                      |
| up migration    | Running new migrations to update the database                                |
| down migration  | Rolling back migrations (less common, but possible)                        |

## Key Takeaways

1. **Migrations keep everyone in sync**: Every developer runs the same migrations to get the same database structure.

2. **Order matters**: Migration files run in numerical order (1, 2, 3...). Never skip numbers or rename old files.

3. **Two systems work together**:
   - Tern CLI (via Taskfile) for manual control during development
   - Embedded migrations (via Go) for automatic updates in production

4. **The schema_version table is your friend**: It tracks what's been done - don't delete it!

5. **Always test migrations locally**: Before pushing a new migration, run it locally to make sure it works.
