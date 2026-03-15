# Backend Workspace

This directory contains the runtime entry points and collaboration assets for the backend side of the project.

- `api/`: Go API service
- `worker/`: Go worker service
- `deployments/`: Docker Compose files and local start/stop scripts
- `sql/`: database migrations
- `meta/`: specifications, templates, generated notes, and project docs
- `Makefile`: common backend command entry point
- `.env` / `.env.example`: local environment configuration

Common commands:

```powershell
cd backend
make start
make stop
make test
```
