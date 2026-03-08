# Commands

本目录存放可直接复制使用的命令模板与脚本入口，覆盖两类能力：

- 模板工程初始化 / 同步
- PRD / Spec / 执行计划的文档生成

如果只记一个入口，优先记：

```powershell
npx agent-project-template help
```

## 推荐顺序

1. `node-cli-command.md`
2. `bootstrap-project-command.md`
3. `init-full-template-command.md`
4. `sync-template-command.md`
5. `generate-prd-command.md`
6. `generate-spec-command.md`
7. `generate-execution-plan-command.md`

## 如何理解这些文件

- `node-cli-command.md`：Node CLI 总入口，适合日常直接执行
- `bootstrap-project-command.md`：只讲“如何初始化模板工程”
- `init-full-template-command.md`：只讲“如何初始化完整模板框架”
- `sync-template-command.md`：只讲“如何同步模板升级”
- `generate-prd-command.md`：只讲“如何进入 PRD 阶段”
- `generate-spec-command.md`：只讲“如何进入 Spec 阶段”
- `generate-execution-plan-command.md`：只讲“如何进入执行计划阶段”

## 规则

- 命令模板负责说明“如何调用”
- `prompts/` 负责说明“调用时模型应如何工作”
- `documents/` 负责说明“最终文档长什么样”
- `.ps1` 脚本负责执行初始化或同步
- `template-utils.ps1` 作为脚本共享工具库，不单独直接调用
- `agent-project-template` Node CLI 是推荐主入口，`.ps1` 作为兼容入口保留

## 推荐习惯

1. 先看 `node-cli-command.md`
2. 初始化前先用 `profiles`
3. 同步前先用 `sync --dry-run`
4. 生成文档时先明确当前处于 PRD / Spec / 执行计划哪一阶段
