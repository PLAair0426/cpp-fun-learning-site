APP_NAME=cpp-learning-worker

.PHONY: test build run docker-test

test:
	go test ./...

build:
	go build -o bin/$(APP_NAME) ./cmd/worker

run:
	go run ./cmd/worker

docker-test:
	docker run --rm -v $${PWD}:/workspace -w /workspace/backend/worker golang:1.24-alpine go test ./...
