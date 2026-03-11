FROM golang:1.24-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/cpp-learning-worker ./cmd/worker

FROM alpine:3.21
WORKDIR /app

COPY --from=builder /bin/cpp-learning-worker /usr/local/bin/cpp-learning-worker

ENV WORKER_PORT=8081
EXPOSE 8081

CMD ["cpp-learning-worker"]
