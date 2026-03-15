# Go 后端 + Docker 技术栈说明

## 1. 目标

说明当前项目为何采用 Go 后端与 Docker 作为主要运行基础。

## 2. 技术组成

### Web

- `Next.js 16`
- `React 19`
- `TypeScript`

### Backend

- `Go` API
- `Go` Worker
- `PostgreSQL`
- `Redis`

### Deployments

- `Docker`
- `Docker Compose`

## 3. 选型理由

- Go 适合承担 API、并发与后续判题相关工作
- Next.js 适合快速迭代学习站点与后台界面
- Docker 便于统一本地与部署环境
- PostgreSQL + Redis 能覆盖主数据与缓存/运行辅助

## 4. 本地运行建议

- 先确保 Docker Desktop 正常运行
- 通过 Compose 启动依赖服务
- 分别验证 API 与 Frontend 是否可访问

## 5. 后续演进

- Web、API、Worker 独立扩缩容
- 逐步接入队列与异步执行能力
- 补充更完整的日志、监控与备份方案
