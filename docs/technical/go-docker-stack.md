# Go 后端 + Docker 部署技术栈说明

## 1. 文档目的

本文件用于明确 `C++ 趣味学习网站` 在采用 `Go` 作为后端语言、采用 `Docker` 作为部署方式时的推荐技术栈、服务拆分、部署边界与实施重点。

本说明是对以下两份文档的补充和收敛：

- `docs/technical/cpp-fun-learning-spec.md`
- `docs/technical/cpp-fun-learning-implementation.md`

## 2. 总体方案

项目采用以下总体组合：

- 前端：`Next.js` + `TypeScript`
- 后端 API：`Go` + `chi` + `net/http`
- 异步任务：`Go Worker`
- 数据库：`PostgreSQL`
- 缓存与限流：`Redis`
- 消息总线：`NATS JetStream`
- 判题服务：`Judge0 CE`
- 对象存储：`MinIO`
- 网关：`Nginx`
- 可观测性：`OpenTelemetry` + `Prometheus` + `Grafana`
- 部署方式：`Docker Compose`

## 3. 推荐技术栈

### 3.1 前端

- 框架：`Next.js`
- 语言：`TypeScript`
- 样式：`Tailwind CSS`
- 编辑器：`Monaco Editor`
- 数据请求：`TanStack Query`
- 轻状态：`Zustand`

说明：

- `Next.js` 适合课程内容页、题库页、SEO 和后续后台整合。
- `Monaco Editor` 适合 PC 端代码编辑，移动端仍以只读和轻交互为主。

### 3.2 Go 后端

- Go 版本：`Go 1.26.x`
- HTTP 路由：`chi`
- 原生协议栈：`net/http`
- 接口风格：`REST`
- 实时状态：`SSE`
- 内部服务通信：`NATS` 事件驱动，必要时再引入 `ConnectRPC` / `gRPC`

说明：

- `chi` 轻量、标准库兼容，适合长期维护的 REST API。
- `SSE` 适合提交状态、队列状态等单向推送，不必过早引入 `WebSocket`。
- 判题结果、经验值发放、徽章结算等异步场景用事件驱动更稳定。

### 3.3 数据层

- 主数据库：`PostgreSQL`
- Go 驱动：`pgx/v5`
- 连接池：`pgxpool`
- SQL 管理：`sqlc`
- 迁移工具：`golang-migrate`

说明：

- 本项目题库、提交记录、学习进度、课程内容块都适合落在 `PostgreSQL`。
- `lesson_blocks` 建议使用 `jsonb`，便于承载 `text/code/quiz/runner/wasm_demo` 等块结构。
- `sqlc + pgx` 适合复杂查询和高可控的数据层，不建议核心链路重度依赖 ORM。

### 3.4 缓存、限流与消息

- 缓存：`Redis`
- 限流：基于 `Redis` 实现滑动窗口
- 排行榜：`Redis Sorted Set`
- 队列与事件流：`NATS JetStream`

说明：

- `Redis` 用于热点缓存、限流、排行榜、短时状态。
- `NATS JetStream` 用于提交编排、判题回写、状态广播、成长事件处理。
- 这样可以把“主站请求链路”和“重任务链路”拆开。

### 3.5 判题服务

- 判题引擎：`Judge0 CE`
- 运行语言：首发只开启 `C++17`
- 接入方式：主站异步调用 Judge0 API

说明：

- `run`：用于课堂内快速运行，偏体验反馈。
- `submit`：用于正式判题，必须走隐藏用例。
- 主站只负责业务编排；真实代码执行交给独立 Judge0 服务。

### 3.6 存储与运维

- 对象存储：`MinIO`
- 反向代理：`Nginx`
- 指标监控：`Prometheus`
- 仪表盘：`Grafana`
- 链路与埋点：`OpenTelemetry`
- 本地/单机编排：`Docker Compose`

说明：

- `MinIO` 用于课程封面、图片、导入资产、备份包。
- `Nginx` 统一对外暴露 `80/443`，内部服务全部走容器内网。

## 4. 推荐容器拆分

建议至少拆成以下容器：

- `nginx`：统一入口、反向代理、静态资源代理
- `web`：Next.js 前端应用
- `api`：Go 主业务接口
- `worker`：Go 异步任务服务
- `postgres`：主数据库
- `redis`：缓存、限流、排行榜
- `nats`：消息总线与事件流
- `minio`：对象存储
- `judge0`：独立判题服务
- `prometheus`：指标采集
- `grafana`：监控看板
- `otel-collector`：统一采集 traces / metrics / logs

## 5. 容器职责边界

### 5.1 `web`

负责：

- 首页
- 学习地图
- 课程页
- 章节页
- 题库页
- 用户中心
- 后台前端

不负责：

- 判题执行
- 状态持久化
- 业务规则结算

### 5.2 `api`

负责：

- 注册登录
- 课程、路径、章节、题库接口
- 运行/提交入口
- 用户进度
- 成长系统
- 后台管理接口
- SSE 状态流接口

不负责：

- 重型异步任务执行
- 代码真实编译运行

### 5.3 `worker`

负责：

- Judge0 结果轮询
- 提交结果回写
- XP 发放
- 徽章触发
- 提交状态事件广播
- 夜间批任务

### 5.4 `judge0`

负责：

- 接收源码
- 编译执行
- 返回编译信息、运行输出和资源消耗

不负责：

- 用户鉴权
- 课程逻辑
- 学习记录

## 6. Go 服务推荐模块

建议 API 服务内按业务模块拆分：

- `auth`
- `users`
- `paths`
- `courses`
- `lessons`
- `problems`
- `submissions`
- `progress`
- `gamification`
- `admin`
- `audit`

建议 Worker 服务内按任务模块拆分：

- `submission_polling`
- `submission_result_writer`
- `xp_granter`
- `achievement_dispatcher`
- `streak_updater`
- `nightly_jobs`

## 7. 推荐目录结构

```text
.
├─ apps/
│  ├─ web/
│  ├─ api/
│  └─ worker/
├─ deployments/
│  ├─ docker-compose.yml
│  ├─ nginx/
│  ├─ prometheus/
│  └─ grafana/
├─ internal/
│  ├─ auth/
│  ├─ users/
│  ├─ paths/
│  ├─ courses/
│  ├─ lessons/
│  ├─ problems/
│  ├─ submissions/
│  ├─ progress/
│  ├─ gamification/
│  ├─ admin/
│  └─ audit/
├─ pkg/
│  ├─ db/
│  ├─ logger/
│  ├─ middleware/
│  ├─ sse/
│  ├─ redisx/
│  ├─ natsx/
│  └─ storage/
├─ sql/
│  ├─ migrations/
│  └─ queries/
└─ docs/
```

## 8. 推荐接口与协议

### 8.1 外部接口

统一采用：

- `REST API`
- `JSON`
- `SSE`

推荐场景：

- `GET /api/v1/paths`
- `GET /api/v1/courses/:slug`
- `GET /api/v1/lessons/:id`
- `POST /api/v1/run`
- `POST /api/v1/submit`
- `GET /api/v1/submissions/:id/stream`

### 8.2 内部通信

统一采用：

- `NATS JetStream`

推荐主题：

- `submission.created`
- `submission.polling.requested`
- `submission.finished`
- `xp.grant.requested`
- `achievement.check.requested`

## 9. Docker 部署方案

### 9.1 部署方式

首发采用：

- `Docker Compose` 单机或双机部署

推荐原因：

- 对 0→1 项目成本最低
- 调试简单
- 服务边界清晰
- 与后续迁移到多机/K8s 的路径兼容

### 9.2 网络原则

- 仅 `nginx` 对公网开放
- `api`、`worker`、`postgres`、`redis`、`nats`、`judge0` 均只在内网通信
- `judge0` 不直接暴露公网接口

### 9.3 存储原则

以下服务必须挂载持久卷：

- `postgres`
- `minio`
- `grafana`
- `prometheus`

可选持久卷：

- `redis`
- `nats`

### 9.4 安全原则

- Go 镜像使用多阶段构建
- 运行态容器使用非 root 用户
- `judge0` 单独限制 CPU / 内存
- 配置通过 `.env` 注入，不把密钥写死在镜像中
- 数据库、缓存、消息服务不暴露宿主公网端口

### 9.5 健康检查

所有核心容器建议加 `healthcheck`：

- `web`
- `api`
- `worker`
- `postgres`
- `redis`
- `nats`
- `judge0`

## 10. 高并发下的建议

如果后续用户量明显增加，仍保留 Docker 体系，但按以下方式扩展：

### 10.1 优先扩展顺序

1. `judge0`
2. `worker`
3. `api`
4. `web`

### 10.2 优化原则

- 内容页尽量静态化和缓存化
- 提交链路必须异步
- 排行榜与限流全部走 `Redis`
- 状态广播走 `NATS`
- `submissions` 表按月分区
- PostgreSQL 增加只读副本

### 10.3 何时考虑升级部署形态

出现以下情况时，可从 `Docker Compose` 升级到 `Kubernetes`：

- Judge0 需要多机扩容
- Worker 消费规模明显增加
- API 需要滚动发布和自动伸缩
- 监控、日志、网络策略开始复杂化

## 11. 首发推荐版本

### 11.1 MVP 建议

- Go：`1.26.x`
- 前端：`Next.js`
- API：`chi`
- DB：`PostgreSQL 17`
- Redis：`Redis 7`
- NATS：`2.x`
- Judge0：使用稳定版本镜像
- MinIO：最新稳定版
- Docker：当前稳定版
- Docker Compose：当前稳定版

## 12. 最终推荐结论

对于这个项目，推荐落地组合为：

- 前端：`Next.js` + `TypeScript` + `Tailwind CSS`
- 后端：`Go` + `chi` + `pgx/v5` + `sqlc`
- 数据：`PostgreSQL`
- 缓存：`Redis`
- 消息：`NATS JetStream`
- 判题：`Judge0 CE`
- 存储：`MinIO`
- 网关：`Nginx`
- 运维：`OpenTelemetry` + `Prometheus` + `Grafana`
- 部署：`Docker Compose`

这是当前阶段在“开发效率、可维护性、判题隔离、高并发演进能力、部署复杂度”之间最均衡的一套方案。
