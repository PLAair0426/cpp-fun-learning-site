FROM golang:1.24-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/cpp-learning-api ./cmd/server

FROM alpine:3.21
WORKDIR /app

COPY --from=builder /bin/cpp-learning-api /usr/local/bin/cpp-learning-api

ENV API_PORT=8080
EXPOSE 8080

CMD ["cpp-learning-api"]
