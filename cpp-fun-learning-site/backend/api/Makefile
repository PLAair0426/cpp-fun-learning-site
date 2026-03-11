APP_NAME=cpp-learning-api

.PHONY: test build run docker-test

test:
	go test ./...

build:
	go build -o bin/$(APP_NAME) ./cmd/server

run:
	go run ./cmd/server

docker-test:
	docker run --rm -v $${PWD}:/workspace -w /workspace/backend/api golang:1.24-alpine go test ./...
