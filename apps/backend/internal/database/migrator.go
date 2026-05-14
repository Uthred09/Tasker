// Package database provides database connection and migration functionality.
package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"net"
	"net/url"
	"strconv"

	"github.com/jackc/pgx/v5"
	tern "github.com/jackc/tern/v2/migrate"
	"github.com/rs/zerolog"

	"github.com/uthred09/tasker/internal/config"
)

//go:embed migrations/*.sql
var migrations embed.FS

func Migrate(ctx context.Context, logger *zerolog.Logger, cfg *config.Config) error {
	//Build DSN fron config
	host := cfg.Database.DirectHost
    port := cfg.Database.DirectPort
    if host == "" || port == 0 {
        host = cfg.Database.Host
        port = cfg.Database.Port
    }
	hostPort := net.JoinHostPort(host, strconv.Itoa(port))
	encodedPassword := url.QueryEscape(cfg.Database.Password)
	dsn := fmt.Sprintf("postgres://%s:%s@%s/%s?sslmode=%s",
		cfg.Database.User,
		encodedPassword,
		hostPort,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	// Parse DSN into pgx config so we can customize it further
    connConfig, err := pgx.ParseConfig(dsn)
    if err != nil {
        return fmt.Errorf("parsing database config: %w", err)
    }

	//Connect to database with pgx
	conn, err := pgx.ConnectConfig(ctx, connConfig)
	if err != nil {
		return err
	}
	//Defer closing connection
	defer conn.Close(ctx)

	//create tern migrator - tracks schema_version table
	m, err := tern.NewMigrator(ctx, conn, "schema_version")
	if err != nil {
		return fmt.Errorf("constructing database migrator: %w", err)
	}

	//Load migrations files from embedded filesystem
	subtree, err := fs.Sub(migrations, "migrations")
	if err != nil {
		return fmt.Errorf("retrieving database migrations: %w", err)
	}

	//Load migrations
	if err := m.LoadMigrations(subtree); err != nil {
		return fmt.Errorf("loading database migrations: %w", err)
	}

	//Get current migration version from datbase
	from, err := m.GetCurrentVersion(ctx)
	if err != nil {
		return fmt.Errorf("retreving current database migration version: %w", err)
	}

	//Run migrations
	if err := m.Migrate(ctx); err != nil {
		return err
	}

	//Log results
	if from == int32(len(m.Migrations)) {
		logger.Info().Msgf("database schema up to date, version %d", len(m.Migrations))
	} else {
		logger.Info().Msgf("migrated database schema, from %d to %d", from, len(m.Migrations))
	}

	return nil
}
