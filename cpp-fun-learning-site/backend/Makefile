.PHONY: help start stop compose-up compose-down web-install web-build api-test worker-test test

help:
	@echo Available targets:
	@echo   make start        - 启动本地完整环境
	@echo   make stop         - 停止本地完整环境
	@echo   make compose-up   - 仅启动后端容器
	@echo   make compose-down - 停止后端容器
	@echo   make web-install  - 安装前端依赖
	@echo   make web-build    - 构建前端
	@echo   make api-test     - 运行 backend/api 测试
	@echo   make worker-test  - 运行 backend/worker 测试
	@echo   make test         - 运行前后端关键验证

start:
	powershell -ExecutionPolicy Bypass -File .\deployments\start-local.ps1

stop:
	powershell -ExecutionPolicy Bypass -File .\deployments\stop-local.ps1

compose-up:
	docker compose -f deployments/docker-compose.yml up --build -d postgres redis api worker

compose-down:
	docker compose -f deployments/docker-compose.yml down

web-install:
	powershell -NoProfile -Command "Set-Location '$(CURDIR)\..\frontend'; npm install"

web-build:
	powershell -NoProfile -Command "$$env:API_BASE_URL='http://localhost:18080'; $$env:NEXT_PUBLIC_API_BASE_URL='http://localhost:18080'; Set-Location '$(CURDIR)\..\frontend'; npm run build"

api-test:
	docker run --rm -v "$(CURDIR)\..:/workspace" -w /workspace/backend/api golang:1.24-alpine go test ./...

worker-test:
	docker run --rm -v "$(CURDIR)\..:/workspace" -w /workspace/backend/worker golang:1.24-alpine go test ./...

test: api-test worker-test web-build
