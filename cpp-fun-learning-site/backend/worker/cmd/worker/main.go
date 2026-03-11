package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"cpp-fun-learning-site/worker/internal/config"
	"cpp-fun-learning-site/worker/internal/runtime"
)

func main() {
	cfg := config.Load()
	service := runtime.New(cfg)
	defer service.Close()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := service.Run(ctx); err != nil {
		log.Fatal(err)
	}
}
