# {{PROJECT_NAME}}

> 如果当前仓库仍是模板源仓库，`{{...}}` 占位符会在 `templates/commands/bootstrap-project.ps1` 初始化时自动替换。

- 项目类型：`{{PROJECT_TYPE}}`
- 主技术栈：`{{PRIMARY_STACK}}`
- 部署方式：`{{DEPLOYMENT_MODE}}`
- Owner：`{{OWNER}}`

这是一个面向 AI / Agent 协作研发的通用项目模板骨架，目标不是只存放 PRD 和 Spec，而是提供一套可一键初始化、可按项目类型自动适配、可持续同步升级的执行结构。

## 核心目录

- `assets/`：原始资料输入
- `preparation/`：受理、待确认项、决策记录
- `templates/`：模板清单、Profile、提示词、命令、文档模板
- `generated/`：AI 草稿与中间产物
- `docs/`：正式确认版文档
- `specification/`：项目级执行总规范
- `skills/`：项目技能
- `.template/`：当前项目的模板状态与同步元数据

## 推荐流程

1. 阅读 `specification/project-specification.md`
2. 阅读 `AGENTS.md`
3. 选择 `templates/profiles/` 中最接近的 Profile
4. 按需基于 `templates/template-config.example.json` 准备项目配置文件
5. 运行 `agent-project-template init`
6. 将原始资料放入 `assets/raw/`
7. 用 `templates/commands/` + `templates/prompts/` 生成文档
8. 后续通过 `agent-project-template sync` 同步模板升级

## CLI Quick Start

推荐使用 Node CLI。

```powershell
npx agent-project-template profiles
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product
npx agent-project-template init-full --name "Example Project Template" --slug example-project-template --target . --profile ai-agent-workspace
npx agent-project-template sync --project-root . --dry-run
```

详细命令参考：`templates/commands/node-cli-command.md:1`

## CLI 命令详解

下文统一使用 `npx agent-project-template ...` 作为示例。

### 1. `profiles`

用途：

- 查看当前内置的模板 Profile 列表
- 在初始化项目之前确认应该选哪个 Profile

命令：

```powershell
npx agent-project-template profiles
```

输出：

- 每行一个 Profile
- 格式为 `profile-name + 描述`

适合什么时候用：

- 不确定该选 `web-product`、`backend-service`、`ai-agent-workspace` 还是 `content-platform`

备注：

- 这是只读命令，不会修改任何文件
- 建议在第一次初始化前先执行一次

### 2. `init`

用途：

- 初始化一个新的模板项目
- 自动创建目录结构
- 自动复制模板文件
- 自动生成 `.template/template-state.json`

基础命令：

```powershell
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product
```

常用参数：

- `--name <value>`：项目名称，建议填写正式名称
- `--slug <value>`：项目目录名 / 项目标识，建议使用小写短横线
- `--target <path>`：目标父目录，默认是当前目录 `.`
- `--profile <value>`：模板 Profile
- `--config <path>`：配置文件路径，通常基于 `templates/template-config.example.json` 编写
- `--force`：允许写入非空目录，谨慎使用
- `--in-place`：直接在 `--target` 指向的目录里初始化，而不是再创建一层子目录

常见用法一：创建一个新的子目录项目

```powershell
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product
```

效果：

- 在当前目录下生成 `.\example-project\`

常见用法二：使用配置文件初始化

```powershell
npx agent-project-template init --target . --config .\project-config.json
```

适合：

- 不想把项目名、Owner、技术栈等参数都写在命令行里
- 希望把初始化参数保存下来便于复用

常见用法三：在当前目录原地初始化

```powershell
npx agent-project-template init --name "Example Project" --target . --profile web-product --in-place
```

适合：

- 你已经进入目标目录
- 不希望再额外生成一层子目录

常见用法四：强制写入非空目录

```powershell
npx agent-project-template init --name "Example Project" --target . --profile web-product --in-place --force
```

备注：

- `--force` 有覆盖现有模板文件的风险，只建议在你明确知道目录内容时使用
- 不加 `--in-place` 时，`--target` 表示“父目录”
- 加了 `--in-place` 时，`--target` 表示“项目目录本身”
- 初始化完成后，建议先检查 `.template/template-state.json`
- `init` 的兼容别名是 `bootstrap`

### 3. `init-full`

用途：

- 初始化一个“完整模板框架”目录
- 不只复制轻量工作区骨架，还会复制 CLI、技能和模板母版内容
- 让新目录天然具备后续继续演化模板本身的能力

基础命令：

```powershell
npx agent-project-template init-full --name "Example Project Template" --slug example-project-template --target . --profile ai-agent-workspace
```

常用参数：

- `--name <value>`：项目名称
- `--slug <value>`：项目目录名 / 项目标识
- `--target <path>`：目标父目录，默认是当前目录 `.`
- `--profile <value>`：模板 Profile
- `--config <path>`：配置文件路径
- `--force`：允许写入非空目录
- `--in-place`：直接在目标目录中初始化

会额外带出的内容：

- `package.json`
- `bin/`
- `lib/`
- `skills/` 的完整内容
- `templates/` 的完整模板资产
- 基础目录说明文件与规范文件

适合什么时候用：

- 你要复制一套可继续演化的模板母版
- 你希望目标目录直接具备 Node CLI 能力
- 你希望后续 `sync` 能继续管理框架级文件，而不只是轻量骨架

备注：

- `init-full` 的兼容别名是 `init-template`
- 参数与 `init` 保持一致
- 初始化后 `.template/template-state.json` 会记录框架模式
- 不会复制 `assets/raw/`、`generated/` 草稿或 `docs/product/` / `docs/technical/` 中的业务内容

### 4. `sync`

参数优先级：

- Profile 选择优先级：`--profile` > `config.project.profile` > `templates/template-manifest.json` 中的默认值
- 项目名优先级：`--name` > `config.project.name`
- slug 优先级：`--slug` > `config.project.slug` > 根据项目名自动推导

用途：

- 将模板仓库的新规则同步到已有项目
- 刷新模板文件、Profile 文件、命令模板、规范文件
- 保持已有项目与模板母版一致

基础命令：

```powershell
npx agent-project-template sync --project-root . --dry-run
```

常用参数：

- `--project-root <path>`：已有项目根目录，默认是当前目录 `.`
- `--profile <value>`：强制覆盖当前项目使用的 Profile
- `--config <path>`：配置文件路径，用于刷新变量
- `--include <glob>`：额外纳入同步的 glob，可重复传
- `--exclude <glob>`：额外排除的 glob，可重复传
- `--dry-run`：仅预览变更，不实际写入
- `--force`：允许触碰默认受保护路径，谨慎使用

常见用法一：先预览同步结果

```powershell
npx agent-project-template sync --project-root . --dry-run
```

这是推荐默认动作。  
通常会输出四类结果：

- `create`：目标项目中不存在，将新增
- `update`：目标项目中存在，但内容将更新
- `unchanged`：内容一致，无需变更
- `skip-protected`：属于受保护路径，默认跳过

常见用法二：正式执行同步

```powershell
npx agent-project-template sync --project-root .
```

适合：

- 你已经通过 `--dry-run` 确认本次变更安全

常见用法三：同步时刷新配置变量

```powershell
npx agent-project-template sync --project-root . --config .\project-config.json
```

适合：

- 项目名、Owner、技术栈、部署方式等变量有变更
- 需要让模板文件重新套用新的配置值

常见用法四：补充额外同步范围

```powershell
npx agent-project-template sync --project-root . --dry-run --include "templates/commands/*.md" --include "templates/documents/*.md"
```

适合：

- 你想在默认同步范围外，额外纳入一些受管文件

常见用法五：排除某些文件

```powershell
npx agent-project-template sync --project-root . --dry-run --exclude "templates/documents/*.md"
```

适合：

- 你不想让某些模板文件参与本轮同步

备注：

- 强烈建议总是先执行一次 `--dry-run`
- 默认会保护 `assets/raw/`、`generated/`、`docs/product/`、`docs/technical/`、`docs/execution/`
- 使用 `--force` 前，建议先人工确认本轮涉及路径
- `sync` 依赖 `.template/template-state.json`，如果项目未初始化，将无法正常工作

### 5. 典型操作组合

场景一：查看 Profile 后初始化新项目

```powershell
npx agent-project-template profiles
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile backend-service
```

场景二：用配置文件初始化并开始后续文档工作

```powershell
npx agent-project-template init --target . --config .\project-config.json
```

然后再配合：

- `templates/commands/generate-prd-command.md:1`
- `templates/commands/generate-spec-command.md:1`
- `templates/commands/generate-execution-plan-command.md:1`

场景三：初始化完整模板母版

```powershell
npx agent-project-template init-full --name "Example Project Template" --slug example-project-template --target . --profile ai-agent-workspace
```

适合：

- 需要完整模板框架而不是轻量项目骨架

场景四：模板更新后先预览再同步

```powershell
npx agent-project-template sync --project-root . --dry-run
npx agent-project-template sync --project-root .
```

## CLI 使用备注

- 已发布到 npm 后，推荐直接用 `npx` 或全局安装后用 `agent-project-template`
- PowerShell 脚本仍保留在 `templates/commands/` 下，作为兼容入口存在

## 目录说明

- `CHANGELOG.md:1`
- `assets/README.md:1`
- `preparation/README.md:1`
- `templates/README.md:1`
- `generated/README.md:1`
- `docs/README.md:1`
- `specification/project-specification.md:1`
- `skills/README.md:1`

## 适用场景

- 从原始资料生成 PRD
- 从 PRD 生成 Spec
- 从 PRD + Spec 生成执行计划
- 初始化 Web 产品 / 后端服务 / Agent 工作区 / 内容平台
- 把项目执行沉淀成统一规范、模板和可复用技能
- 把模板母版作为 npm 包持续发布
