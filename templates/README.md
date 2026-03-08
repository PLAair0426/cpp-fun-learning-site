# Templates

本目录是整套模板骨架的“控制面”，负责定义：

- 如何初始化项目骨架
- 如何按项目类型自动适配
- 如何在已有项目中同步模板升级
- 如何生成 PRD / Spec / 执行文档
- 如何通过 Node CLI 统一调用模板能力

## 模块分工

- `template-manifest.json`：基础骨架、受管文件、同步保护范围
- `template-config.example.json`：项目级覆盖配置示例
- `profiles/`：不同项目类型的默认适配规则
- `prompts/`：阶段型提示词手册，定义模型执行边界
- `commands/`：初始化、同步和生成命令
- `documents/`：正式文档模板

## CLI 入口

推荐优先使用 Node CLI：

```powershell
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product
npx agent-project-template init-full --name "Example Project Template" --slug example-project-template --target . --profile ai-agent-workspace
npx agent-project-template sync --project-root . --dry-run
```

PowerShell 脚本继续保留为兼容入口。

- `init`：初始化轻量项目工作区
- `init-full`：初始化完整模板框架母版

## Prompt 边界

详细说明可直接查看 `prompts/README.md`。

- `generate-prd.md`：只负责从原始资料和澄清问答生成 PRD，不负责技术设计和执行计划
- `prd-to-spec.md`：只负责从确认版 PRD 生成 Spec，不负责新增需求和研发排期
- `spec-to-execution-plan.md`：只负责从确认版 PRD + Spec 生成执行计划，不负责重写 PRD 或重设计 Spec

## 自动适配机制

初始化或同步时，默认按以下顺序合并配置：

1. `template-manifest.json`
2. `profiles/*.json`
3. 外部 `ConfigFile`
4. 命令行参数

## 自动迭代机制

- 新项目通过 `templates/commands/bootstrap-project.ps1` 初始化
- 已初始化项目通过 `templates/commands/sync-template.ps1` 同步骨架升级
- 项目本地状态写入 `.template/template-state.json`
