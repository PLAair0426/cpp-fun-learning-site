# C++ 趣味学习网站 Implementation

## 1. 实现概览

当前实现采用单仓库、多服务目录结构，前端、后端、文档与模板协作统一管理。

- `frontend/`：Next.js Web 站点
- `backend/api/`：Go HTTP API
- `backend/worker/`：异步任务与运行时能力
- `backend/sql/migrations/`：数据库迁移
- `backend/deployments/`：Docker Compose 与运行辅助文件

## 2. 前端实现

- 使用 App Router 组织页面
- 主页、题库、路径页与后台页复用统一设计系统
- 通过服务端 API 封装读取首页、路径、题目与进度数据
- 支持首页与其他关键页面的实验分流

## 3. 后端实现

- Go API 提供首页、路径、题库、进度、认证与管理接口
- Redis 用于缓存与运行辅助
- PostgreSQL 用于用户、提交与内容数据存储
- Worker 预留给异步任务和判题集成

## 4. 管理端实现

- 管理台与前台同仓库维护，便于统一鉴权与组件复用
- 提供用户概览、内容概览与活动信息
- 后续可继续补全课程创建、编辑与审核流程

## 5. 运行方式

- 开发环境可分别启动 frontend 与 backend
- 容器环境通过 Docker Compose 统一拉起依赖服务
- 本地验证前应确认 API 与数据库服务可访问

## 6. 后续实现建议

- 把判题与队列能力逐步从 API 中抽离到 Worker
- 补充更稳定的内容导入工具链
- 为后台内容编辑和审核添加更完整的权限控制
