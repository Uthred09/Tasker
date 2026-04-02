# Understanding logger.go — Complete Beginner's Guide

This guide explains every line of the logger.go file, from the ground up. At 6-7 minutes reading time, it covers everything you need to understand this logging system.

---

## Why This Exists

Before we touch code, let's answer: **Why do we need a logger?**

Imagine your app is running in production at 3 AM. Something breaks. You wake up, open your computer, and need to answer: **What happened? When? In which request?**

Without a logger, you have no idea. With a logger, you get a trail like:

```
2024-01-15 02:34:21 ERROR payment-service: charge failed for user_42, reason: insufficient funds
2024-01-15 02:34:21 INFO payment-service: retrying user_42 (attempt 2/3)
```

This is **structured logging** — not just text, but key-value pairs that machines can read, search, and analyze.

This particular logger does three special things:

1. **Structured logging** using a library called zerolog (fast, JSON output)
2. **New Relic integration** — sends logs to a monitoring service for analysis
3. **Trace context** — tracks requests across multiple services

---

## Line-by-Line Explanation

### Line 1: `package logger`

```go
package logger
```

**`package`** is a Go keyword meaning "this file belongs to a named group."

**`logger`** is the name of that group.

Think of it like a folder labeled "logger" in a file cabinet. Every file with `package logger` inside the same folder belongs together. When another file wants to use something from this file, it imports the `logger` package.

---

### Lines 3-15: The Imports

```go
import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/Uthred09/tasker/internal/config"
	"github.com/newrelic/go-agent/v3/integrations/logcontext-v2/zerologWriter"
	"github.com/newrelic/go-agent/v3/newrelic"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/pkgerrors"
)
```

**Imports** are packages someone else wrote that this file needs. Think of them like dependencies or tools you "borrow" from other people.

Here's what each one provides:

| Package          | Why It Exists                      | Key Functions                |
| ---------------- | ---------------------------------- | ---------------------------- |
| `encoding/json`  | Turn data ↔ JSON text              | `Marshal()`, `Unmarshal()`   |
| `fmt`            | Format strings nicely              | `Sprintf()`, `Println()`     |
| `io`             | Work with input/output             | `io.Writer` interface        |
| `os`             | Interact with operating system     | `Stdout`, `Getenv()`         |
| `time`           | Handle dates and durations         | `Now()`, `Second * 10`       |
| `config` (yours) | Your app's configuration           | `ObservabilityConfig` struct |
| `zerolog`        | Structured logging library         | Fast JSON logging            |
| `newrelic`       | Application performance monitoring | Track errors, traces, logs   |

> **Key insight:** Go requires you to explicitly import every package you use. Nothing comes automatically.

---

### Lines 17-20: Struct Definition

```go
type LoggerService struct {
	nrApp *newrelic.Application
}
```

This creates a new **type** called `LoggerService`. A struct is like a form with named fields:

```
┌─────────────────────────────┐
│ LoggerService              │
│  - nrApp: NewRelicApp      │
└─────────────────────────────┘
```

Breaking it down:

- **`type`** — declares a new type in Go
- **`LoggerService`** — the name (capital L = exported, other files can use it)
- **`struct`** — a group of named fields, like an object in other languages
- **`nrApp *newrelic.Application`** — one field:
  - `nrApp` = field name (short for "New Relic App")
  - `*newrelic.Application` = type (a pointer to a New Relic application)
  - `*` = pointer (we store where the app lives in memory, not copying the whole app)

---

### Lines 22-28: Function with Conditional Return

```go
func NewLoggerService(cfg *config.ObservabilityConfig) *LoggerService {
	service := &LoggerService{}

	if cfg.NewRelic.LicenseKey == "" {
		return service
	}
```

This is a **constructor function** — it creates and returns a new LoggerService.

Parts:

- **`func`** — declares a function
- **`NewLoggerService`** — function name (capital N = exported)
- **`(cfg *config.ObservabilityConfig)`** — input parameter:
  - `cfg` = parameter name
  - `*config.ObservabilityConfig` = type (pointer to config)
  - In plain English: "Give me a config, I'll create a logger service"
- **`*LoggerService`** — return type (pointer to LoggerService)
- **`service := &LoggerService{}`** — create a new LoggerService:
  - `:=` = short variable declaration (create + assign in one step)
  - `&LoggerService{}` = create in memory and give me its address
- **`if cfg.NewRelic.LicenseKey == ""`** — check if license key is empty:
  - `== ""` = equals empty string
  - If missing, skip New Relic setup entirely

---

### Lines 30-36: Building Configuration Options

```go
var configOptions []newrelic.ConfigOption
configOptions = append(configOptions,
	newrelic.ConfigAppName(cfg.ServiceName),
	newrelic.ConfigLicense(cfg.NewRelic.LicenseKey),
	newrelic.ConfigAppLogForwardingEnabled(cfg.NewRelic.AppLogForwardingEnabled),
	newrelic.ConfigDistributedTracerEnabled(cfg.NewRelic.DistributedTracingEnabled),
)
```

This builds a list of configuration options for New Relic:

- **`var configOptions []newrelic.ConfigOption`** — declare a **slice** (like a dynamic array/list)
- **`append(configOptions, ...)`** — add items to the slice
- Each `newrelic.ConfigXXX()` is a function that returns a ConfigOption, configuring:
  - **App name** — e.g., "payment-service" (shows up in New Relic dashboard)
  - **License key** — secret key that connects to your New Relic account
  - **Log forwarding** — send logs to New Relic automatically
  - **Distributed tracing** — track requests across multiple services

---

### Lines 38-41: Conditional Debug Logging

```go
if cfg.NewRelic.DebugLogging {
	configOptions = append(configOptions, newrelic.ConfigDebugLogger(os.Stdout))
}
```

Only add debug logging if explicitly enabled:

- **`if cfg.NewRelic.DebugLogging`** — check a boolean (true/false)
- **`os.Stdout`** — standard output (the terminal)

This prevents flooding the logs with debug messages in production.

---

### Lines 43-46: Creating the Application

```go
app, err := newrelic.NewApplication(configOptions...)
if err != nil {
	return service
}
```

This actually creates the New Relic application:

- **`app, err := newrelic.NewApplication(...)`** — call a function that returns TWO things:
  - `app` = the New Relic application (if successful)
  - `err` = an error (if something went wrong)
- This is Go's **error handling pattern** — always check `err`
- **`configOptions...`** — the `...` unpacks the slice into individual arguments
- **`if err != nil`** — if error is not empty, something failed → return with empty service

---

### Lines 48-49: Finishing the Constructor

```go
service.nrApp = app
return service
```

These two simple lines do two critical things:

**Line 1: `service.nrApp = app`**

Think of `service` as an empty box (the LoggerService struct) with one slot inside it called `nrApp`:

```
┌─────────────────────────────────────┐
│  service (LoggerService)           │
│  ┌─────────────────────────────┐   │
│  │  nrApp: [empty slot]       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

When we created `service := &LoggerService{}` earlier, the box existed but the `nrApp` slot was empty (nil).

Now we're filling that slot with the New Relic app we just created:

```
┌─────────────────────────────────────┐
│  service (LoggerService)           │
│  ┌─────────────────────────────┐   │
│  │  nrApp: [NewRelicApp]     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

This is called **accessing a struct field**. The dot (`.`) means "go inside this struct and use this field."

**Real example:**

```go
// Like filling in a form field
person.name = "John"      // Put "John" into the "name" field
person.age = 25            // Put 25 into the "age" field

// Same idea here
service.nrApp = app       // Put the New Relic app into the "nrApp" field
```

**Line 2: `return service`**

Now we give this fully-configured `service` back to whoever called `NewLoggerService()`.

Think of it like a restaurant:

1. You walk in → `NewLoggerService()` is called
2. They create an empty table → `service := &LoggerService{}`
3. They bring food and fill your plate → `service.nrApp = app`
4. They give you the plate → `return service`

The caller now receives a LoggerService that's ready to use, with the New Relic app inside it.

**What happens next?**

The caller can now use:

- `loggerService.GetApplication()` to get the New Relic app
- `loggerService.Shutdown()` to cleanly close New Relic when the app stops

---

### Lines 52-57: The Shutdown Method

```go
func (ls *LoggerService) Shutdown() {
	if ls.nrApp != nil {
		ls.nrApp.Shutdown(10 * time.Second)
	}
}
```

This is a **method** — a function attached to a type. It belongs to LoggerService.

**Breaking it down piece by piece:**

**`func`**

> This is a Go keyword meaning "I am about to define a function."

**`(ls *LoggerService)`**

> This is the **receiver** — it tells Go this function belongs to LoggerService.
> Think of it like `this` in other languages (JavaScript, Java, Python).
> `ls` is the name we give to refer to the LoggerService instance.
> `*` means we're passing a pointer (the actual object in memory, not a copy).

**`Shutdown()`**

> This is the **method name** — what you call to use this method.
> In plain English: "When you call Shutdown() on a LoggerService, run these instructions."

**`{`**

> The opening brace marks the start of the function's body — the actual instructions that run when you call this method.

**`if ls.nrApp != nil`**

> Check if `nrApp` exists:
>
> - `ls.nrApp` = access the `nrApp` field inside `ls` (the LoggerService)
> - `!= nil` = is NOT empty/null
> - If there's no New Relic app, we skip the shutdown (nothing to shut down)

**`ls.nrApp.Shutdown(10 * time.Second)`**

> Call the Shutdown method on the New Relic app:
>
> - `10 * time.Second` = 10 seconds (Go's time package lets you multiply)
> - This gives New Relic 10 seconds to finish sending any pending logs before closing

**`}`**

> The closing brace marks the end of the function.

**Why does this matter?**

This is called **graceful shutdown** — when your app stops, you don't just crash immediately. You give services time to finish their work:

```
App receives "stop" signal
    ↓
Shutdown() called
    ↓
New Relic has 10 seconds to send remaining logs
    ↓
App finally exits
```

Without this, you might lose important logs that hadn't been sent yet.

**Real-world analogy:**

> Think of a restaurant closing time:
>
> - The chef doesn't instantly leave when the door closes
> - They finish cooking the current orders first
> - Then they clean up
> - THEN they go home
>
> That's graceful shutdown — finishing important work before stopping.

---

### Lines 59-62: Getter Method

```go
func (ls *LoggerService) GetApplication() *newrelic.Application {
	return ls.nrApp
}
```

A simple getter to expose the New Relic app to other parts of the code.

---

### Lines 64-80: The Main Logger Factory — Part 1

```go
func NewLoggerWithService(cfg *config.ObservabilityConfig, loggerService *LoggerService) zerolog.Logger {
	var logLevel zerolog.Level
	level := cfg.GetLogLevel()

	switch level {
	case "debug":
		logLevel = zerolog.DebugLevel
	case "info":
		logLevel = zerolog.InfoLevel
	case "warn":
		logLevel = zerolog.WarnLevel
	case "error":
		logLevel = zerolog.ErrorLevel
	default:
		logLevel = zerolog.InfoLevel
	}
```

This is the main function that creates your logger:

- **`zerolog.Logger`** — return type (the actual logger)
- **`switch level`** — Go's switch statement
- Maps strings to zerolog constants:
  - **debug** = most verbose, shows everything
  - **info** = normal operation
  - **warn** = something might be wrong
  - **error** = something failed
  - **default** = if unknown, fall back to info

---

### Lines 82-84: Global Zerolog Configuration

```go
zerolog.TimeFieldFormat = "2006-01-02 15:04:05"
zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
```

Global settings for all zerolog loggers:

- **Time format** = "2006-01-02 15:04:05" (Go's reference date: 2006-01-02 15:04:05)
- **Error stack** = capture full stack traces for errors (helps debugging)

---

### Lines 86-105: Choosing Output Writer

```go
var writer io.Writer

var baseWriter io.Writer
if cfg.IsProduction() && cfg.Logging.Format == "json" {
	baseWriter = os.Stdout

	if loggerService != nil && loggerService.nrApp != nil {
		nrWriter := zerologWriter.New(baseWriter, loggerService.nrApp)
		writer = nrWriter
	} else {
		writer = baseWriter
	}
} else {
	consoleWriter := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: "2006-01-02 15:04:05"}
	writer = consoleWriter
}
```

This decides **where logs go** based on environment:

- **`io.Writer`** — an interface (a contract). Any type with a `Write()` method satisfies this.
- **`if cfg.IsProduction() && cfg.Logging.Format == "json"`** — TWO conditions (AND):
  - Is this production mode?
  - Is format set to "json"?

**Production + JSON:**

- Write to stdout (machine readable)
- Wrap with New Relic writer for log forwarding

**Development (anything else):**

- Use ConsoleWriter (colored, human-readable output)

---

### Lines 109-115: Building the Logger

```go
logger := zerolog.New(writer).
	Level(logLevel).
	With().
	Timestamp().
	Str("service", cfg.ServiceName).
	Str("environment", cfg.Environment).
	Logger()
```

This chains methods to build the logger:

1. **`zerolog.New(writer)`** — create logger with our output destination
2. **`.Level(logLevel)`** — set minimum log level
3. **`.With()`** — start adding default fields to every log
4. **`.Timestamp()`** — add current time to every log entry
5. **`.Str("service", cfg.ServiceName)`** — add service name
6. **`.Str("environment", cfg.Environment)`** — add environment name
7. **`.Logger()`** — build the final logger

Every log will now automatically include timestamp, service name, and environment.

---

### Lines 117-120: Development-Only Stack Traces

```go
if !cfg.IsProduction() {
	logger = logger.With().Stack().Logger()
}
```

In development (not production), add stack traces to every error:

- **`!cfg.IsProduction()`** — NOT in production (i.e., development)
- Adds stack traces to errors (helps find where bugs are)

---

### Lines 122-123: Return the Logger

```go
return logger
```

Give back the fully built logger.

---

### Lines 125-138: Adding Trace Context

```go
func WithTraceContext(logger zerolog.Logger, txn *newrelic.Transaction) zerolog.Logger {
	if txn == nil {
		return logger
	}

	metadata := txn.GetTraceMetadata()

	return logger.With().
		Str("trace.id", metadata.TraceID).
		Str("span.id", metadata.SpanID).
		Logger()
}
```

This is the **distributed tracing** feature:

**The problem:** User makes request → hits API gateway → calls payment service → calls database. How do you track this ONE request across ALL services?

**Solution:** Every request gets a unique `trace.id`. Every service logs with that ID. Then you search New Relic: "show me all logs with trace.id = abc123".

- **`txn *newrelic.Transaction`** — a New Relic transaction (unit of work being tracked)
- **`txn.GetTraceMetadata()`** — get trace.id and span.id
- **`Str("trace.id", metadata.TraceID)`** — add these IDs to every log line automatically

---

### Lines 140-173: Database Logger (pgx)

```go
func NewPgxLogger(level zerolog.Level) zerolog.Logger {
	writer := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
		FormatFieldValue: func(i any) string {
			switch v := i.(type) {
			case string:
				if len(v) > 200 {
					return v[:200] + "..."
				}
				return v
			case []byte:
				var obj interface{}
				if err := json.Unmarshal(v, &obj); err == nil {
					pretty, _ := json.MarshalIndent(obj, "", "    ")
					return "\n" + string(pretty)
				}
				return string(v)
			default:
				return fmt.Sprintf("%v", i)
			}
		},
	}

	return zerolog.New(writer).
		Level(level).
		With().
		Timestamp().
		Str("component", "database").
		Logger()
}
```

This creates a **special logger for PostgreSQL queries** (using pgx driver):

- **`FormatFieldValue: func(i any) string`** — custom function that transforms log values
- **For SQL strings > 200 chars** — truncate with "..." (prevents massive logs)
- **For JSON bytes** — pretty-print with indentation
- **component = "database"** — marks these logs as database-related

---

### Lines 175-189: Level Conversion

```go
func GetPgxTraceLogLevel(level zerolog.Level) int {
	switch level {
	case zerolog.DebugLevel:
		return 6
	case zerolog.InfoLevel:
		return 4
	case zerolog.WarnLevel:
		return 3
	case zerolog.ErrorLevel:
		return 2
	default:
		return 0
	}
}
```

**Problem:** zerolog uses levels (DebugLevel, InfoLevel). pgx (PostgreSQL driver) uses different numbers (0-6).

**Solution:** Convert between them:

- debug → 6
- info → 4
- warn → 3
- error → 2
- none → 0

---

## Data Story: How It All Flows

```
BEFORE this logger runs:
  - Config loaded: { LogLevel: "info", Environment: "production", NewRelic: { LicenseKey: "abc123" } }

DURING NewLoggerWithService():
  1. Parse "info" → zerolog.InfoLevel
  2. Detect production + JSON format → use stdout + New Relic writer
  3. Build logger with fields: { service: "my-service", environment: "production" }

AFTER (when you log in production):
  logger.Info().Msg("user created")

  Output:
    {"level":"info","time":"2024-01-15T10:30:00Z","service":"my-service","environment":"production","message":"user created"}

AFTER (when you log in development):
  2024-01-15 10:30:00  INFO  → user created
  (colored, human-readable)
```

---

## Real-World Analogy

Think of this logging system like a **hospital reception desk:**

- **LoggerService** = the desk staff (handles New Relic = the monitoring service)
- **NewLoggerWithService** = the check-in process (determines how to log based on situation)
- **Writer** = where the pen outputs (terminal = stdout, or fancy system = New Relic)
- **WithTraceContext** = patient wristband with ID (tracks everything related to one visit)
- **NewPgxLogger** = special notes for prescriptions (formatted specifically for that use case)

---

## Universal Pattern

This structured logging exists in every language:

| Language | Libraries          |
| -------- | ------------------ |
| Go       | zerolog, zap, slog |
| Python   | structlog, loguru  |
| Node.js  | winston, pino      |
| Java     | SLF4J + Logback    |

---

## What Could Go Wrong

1. **No license key** → New Relic is skipped silently (lines 26-28)
2. **Wrong log level** → you might miss important logs in production
3. **Large SQL in logs** → database logger truncates at 200 chars (line 149-151)
4. **New Relic fails to start** → app continues without it (lines 44-46)
5. **Not calling Shutdown()** → logs may not flush to New Relic before exit

---

## Summary

This file provides:

- **LoggerService** — manages New Relic integration
- **NewLoggerWithService** — creates the main app logger (production vs development)
- **WithTraceContext** — adds distributed tracing IDs to logs
- **NewPgxLogger** — special logger for database queries
- **GetPgxTraceLogLevel** — converts between log level systems

The key insight: **different environments need different logging**. Production needs JSON (machine-readable) + New Relic forwarding. Development needs pretty console output. This file handles both elegantly.

---

_Want to go deeper? Check out how this logger is used in HTTP handlers, or how New Relic trace context flows through a request._
