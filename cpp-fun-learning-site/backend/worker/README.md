# Backend Worker

`backend/worker` 是项目的异步任务服务，负责：

- 消费待处理提交
- 推进 `QUEUED -> RUNNING -> FINISHED`
- 回写 PostgreSQL / Redis 中的提交状态
- 输出健康检查与心跳
- 对接 mock judge 或真实 `Judge0`

## 本地开发

如本机已安装 Go：

```powershell
go test ./...
go run ./cmd/worker
```

如本机未安装 Go，推荐用 Docker 临时执行：

```powershell
docker run --rm -v ${PWD}:/workspace -w /workspace/backend/worker golang:1.24-alpine go test ./...
```

## 常用命令

- 测试：`make test`
- 构建：`make build`
- 运行：`make run`
- Docker 测试：`make docker-test`

## 入口

- 启动入口：`cmd/worker`
- 主要代码：`internal/`
