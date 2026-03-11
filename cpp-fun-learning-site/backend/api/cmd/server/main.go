package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"cpp-fun-learning-site/api/internal/config"
	"cpp-fun-learning-site/api/internal/httpapi"
	"cpp-fun-learning-site/api/internal/store"
)

func main() {
	cfg := config.Load()
	dataStore := store.New()
	defer dataStore.Close()

	if cfg.PostgresDSN != "" {
		connectWithRetry(dataStore, cfg.PostgresDSN)
	}
	if cfg.RedisAddr != "" {
		connectRedisWithRetry(dataStore, cfg.RedisAddr)
	}
	if err := dataStore.EnsureAdminUser(cfg.AdminName, cfg.AdminEmail, cfg.AdminPassword); err != nil {
		log.Printf("admin bootstrap skipped: %v", err)
	}

	server := httpapi.New(cfg, dataStore)

	log.Printf("cpp learning api listening on :%s (%s)", cfg.Port, cfg.AppEnv)
	if err := http.ListenAndServe(":"+cfg.Port, server.Router()); err != nil {
		log.Fatal(err)
	}
}

func connectWithRetry(dataStore *store.Store, dsn string) {
	var lastErr error

	for attempt := 1; attempt <= 5; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
		err := dataStore.ConnectPostgres(ctx, dsn)
		cancel()

		if err == nil {
			log.Printf("postgres content repository enabled on attempt %d", attempt)
			return
		}

		lastErr = err
		log.Printf("postgres unavailable on attempt %d, retrying: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}

	log.Printf("postgres repository fallback to memory store: %v", lastErr)
}

func connectRedisWithRetry(dataStore *store.Store, addr string) {
	var lastErr error

	for attempt := 1; attempt <= 5; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err := dataStore.ConnectRedis(ctx, addr)
		cancel()

		if err == nil {
			log.Printf("redis cache and queue enabled on attempt %d", attempt)
			return
		}

		lastErr = err
		log.Printf("redis unavailable on attempt %d, retrying: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}

	log.Printf("redis fallback to in-process cache: %v", lastErr)
}
