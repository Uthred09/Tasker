# Stage 1 — Builder
# Go compiler on Alpine — has everything needed to compile
FROM golang:1.25-alpine AS builder

# Install git — needed by some Go dependencies during download
RUN apk add --no-cache git

WORKDIR /app

# Copy dependency files first — cached layer
# Only re-runs when go.mod or go.sum changes
COPY go.mod go.sum ./
RUN go mod download

# Copy all source code
COPY . .

# Compile both binaries
# CGO_ENABLED=0 — pure Go binary, no C dependencies
# GOOS=linux — compile for Linux regardless of build machine OS (important on Windows)
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/tasker ./cmd/tasker/main.go
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/cron ./cmd/cron/main.go

# Stage 2 — Runner
# Minimal Alpine — no Go compiler, no source code
FROM alpine:latest

# ca-certificates — needed for HTTPS calls to Clerk, NR, Resend, S3
# tzdata — correct timezone handling for cron jobs
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy only what the running app needs
COPY --from=builder /bin/tasker ./tasker
COPY --from=builder /bin/cron ./cron
COPY --from=builder /app/static ./static
COPY --from=builder /app/templates ./templates

# Documentation only — actual port mapping in docker-compose
EXPOSE 8080

# Exec form — stop signal reaches app directly for graceful shutdown
CMD ["./tasker"]