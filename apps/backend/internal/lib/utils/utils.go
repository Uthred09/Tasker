package utils

import (
	"encoding/json"
	"fmt"
	"crypto/tls"
    "github.com/redis/go-redis/v9"
    "github.com/uthred09/tasker/internal/config"
)

func PrintJSON(v interface{}) {
	json, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		fmt.Println("Error marshalling to JSON:", err)
		return
	}
	fmt.Println("JSON:", string(json))
}

func BuildOptions(cfg *config.Config) *redis.Options {
    opts := &redis.Options{
        Addr:     cfg.Redis.Address,
        Password: cfg.Redis.Password,
        DB:       0,
    }

    if cfg.Redis.TLS {
        opts.TLSConfig = &tls.Config{
            InsecureSkipVerify: false,
        }
    }

    return opts
}