# Backend Workspace

这里承载项目的运行入口与工程协作资产：

- `api/`：Go API 服务
- `worker/`：Go Worker 服务
- `deployments/`：Docker Compose 与本地启动 / 停止脚本
- `sql/`：数据库迁移
- `meta/`：规范、模板、草稿、分析与项目协作文档
- `Makefile`：后端侧统一命令入口
- `.env` / `.env.example`：本地环境配置

常用命令：

```powershell
cd backend
make start
make stop
make test
```
