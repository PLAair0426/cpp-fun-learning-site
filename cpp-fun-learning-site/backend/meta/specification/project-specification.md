# C++ 趣味学习网站 Project Specification

## 1. 文档定位

本文档定义项目级协作规则，用于统一前端、后端、内容、模板与 Agent 工作流的边界。

- 统一仓库结构与目录职责
- 统一文档生成与沉淀路径
- 统一模板、提示词与命令的使用方式
- 统一复杂任务的执行、评审与回溯要求

本文档不是某一次需求的 PRD，也不是某一版功能的技术方案；它是项目层面的约束说明。

## 2. 项目结构

- 项目名称：`C++ 趣味学习网站`
- 仓库形态：单仓库、多目录协作
- `frontend/`：Next.js + TypeScript 前端站点
- `backend/`：Go API、Worker、部署与元数据协作区
- `backend/meta/` 与 `frontend/content/docs/`：模板、规范、生成文档与正式文档

## 3. 目录职责

### 3.1 运行目录

- `frontend/`：Web 页面、交互、实验页、管理后台
- `backend/api/`：HTTP API、鉴权、数据访问
- `backend/worker/`：异步任务、判题集成、队列消费
- `backend/sql/`：迁移脚本与种子数据
- `backend/deployments/`：Docker Compose、环境与部署辅助文件

### 3.2 协作目录

- `frontend/content/assets/`：原始内容素材与研究资料
- `frontend/content/docs/`：正式文档输出
- `backend/meta/preparation/`：输入资料、问题、决策记录
- `backend/meta/generated/`：生成中的草稿与分析产物
- `backend/meta/templates/`：模板、命令、提示词、配置骨架
- `backend/meta/specification/`：项目级规范
- `backend/meta/skills/`：项目内技能清单与协作说明
- `backend/meta/.template/`：模板状态文件

## 4. 文档流程

建议使用以下顺序推进复杂工作：

1. 将原始资料放入 `frontend/content/assets/raw/`
2. 将待确认问题记录到 `backend/meta/preparation/`
3. 在 `backend/meta/generated/` 中形成 PRD / Spec / 执行计划草稿
4. 评审通过后沉淀到 `frontend/content/docs/`
5. 若形成稳定方法，再补充到 `backend/meta/templates/` 或 `backend/meta/skills/`

基本原则：

- 未确认内容不能写成正式结论
- 草稿必须明确标注状态
- 生成文档优先进入 `generated`
- 面向团队长期复用的文档进入 `docs`

## 5. 模板与 Agent 规则

- 复杂任务优先使用模板而不是自由发挥
- 需要多阶段交付时，至少包含 PRD、Spec、Execution Plan 三层
- Agent 在修改模板或规范前，应先阅读本规范和对应目录的 `AGENTS.md`
- 文档路径变更后，必须同步修正文档引用

## 6. 编码与文档质量

- 文本文件统一使用 UTF-8（无 BOM）
- 避免通过会破坏中文编码的脚本直接批量覆写文档
- 出现乱码时，优先区分“终端显示异常”和“文件内容已损坏”
- 生成的扫描报告应视为临时产物，可删除后重跑

## 7. 本地运行

### 7.1 Backend

```powershell
cd backend
make start
make stop
make test
```

### 7.2 Frontend

```powershell
cd frontend
npm install
npm run dev
```

### 7.3 依赖

- PostgreSQL
- Redis
- Docker / Docker Compose

## 8. 交付要求

正式文档至少应包含：

- 背景、目标、范围
- 信息架构或模块边界
- 关键流程与依赖
- 风险、验证与后续动作

## 9. 演进方向

- 判题服务与 Judge0 集成
- Web / API / Worker 独立扩缩容
- 内容后台与学习路径持续扩展
- A/B Test、数据分析与运营能力完善
