# Backend API

`backend/api` 是项目的 HTTP API 服务，负责：

- 内容数据读取
- 题目与进度接口
- `run` / `submit` 接口
- 提交状态查询与 `SSE` 推送
- PostgreSQL / Redis 集成

## 本地开发

如本机已安装 Go：

```powershell
go test ./...
go run ./cmd/server
```

如本机未安装 Go，推荐用 Docker 临时执行：

```powershell
docker run --rm -v ${PWD}:/workspace -w /workspace/backend/api golang:1.24-alpine go test ./...
```

## 常用命令

- 测试：`make test`
- 构建：`make build`
- 运行：`make run`
- Docker 测试：`make docker-test`

## 入口

- 启动入口：`cmd/server`
- 主要代码：`internal/`
