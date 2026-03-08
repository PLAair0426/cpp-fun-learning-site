# Skills

存放项目执行需要的技能目录。每个技能应单独成目录，并至少包含一个 `SKILL.md` 文件。

总览文档：

- `skills/catalog.md:1`
- `skills/install-and-usage.md:1`
- `skills/baseline.md:1`

当前内置技能：

- `manage-agent-project-template/`：总入口，用于分发模板初始化、文档流水线和同步升级任务
- `bootstrap-agent-project-template/`：用于初始化新的通用 AI / Agent 项目模板骨架
- `run-project-document-pipeline/`：用于按固定顺序生成 PRD、Spec 和执行文档
- `sync-agent-project-template/`：用于安全预览和同步模板升级

推荐使用方式：

1. 模板操作边界不清时，先用 `manage-agent-project-template/`
2. 新项目初始化时，用 `bootstrap-agent-project-template/`
3. 文档生成时，用 `run-project-document-pipeline/`
4. 模板升级时，用 `sync-agent-project-template/`
