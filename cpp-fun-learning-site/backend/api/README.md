# Backend API

`backend/api` is the HTTP API service for this project. It is responsible for:

- content data reads
- problem and progress endpoints
- `run` / `submit` endpoints
- submission status lookup and `SSE` updates
- PostgreSQL / Redis integration

## Local development

If Go is installed locally:

```powershell
go test ./...
go run ./cmd/server
```

If Go is not installed locally, you can use Docker:

```powershell
docker run --rm -v ${PWD}:/workspace -w /workspace/backend/api golang:1.24-alpine go test ./...
```
