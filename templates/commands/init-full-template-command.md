# Init Full Template Command

本文件只说明“如何初始化完整模板框架”。

## 适用场景

- 不只是创建项目骨架，而是要拿到整套模板母版
- 需要把 CLI、模板、技能、规范一起拷贝出来
- 希望新目录后续还能继续同步框架级升级

## 推荐方式：Node CLI

```powershell
npx agent-project-template init-full --name "Acme Agent Template" --slug acme-agent-template --target . --profile ai-agent-workspace
```

## 会带出的内容

- 根级入口文件：`README.md`、`AGENTS.md`、`package.json`
- CLI 源码：`bin/`、`lib/`
- 模板控制面：`templates/`
- 技能资产：`skills/`
- 规范与基础目录：`assets/`、`preparation/`、`generated/`、`docs/`、`specification/` 的目录骨架与通用说明文件

## 不会带出的内容

- `assets/raw/` 里的原始业务资料
- `generated/` 里的草稿与中间产物
- `docs/product/`、`docs/technical/`、`docs/execution/` 里的项目正式文档

## 常用参数

- `--name`：项目名称
- `--slug`：项目目录名
- `--target`：目标父目录
- `--profile`：模板 Profile
- `--config`：配置文件
- `--force`：允许写入非空目录
- `--in-place`：在当前目标目录原地初始化

## 示例 1：生成完整模板母版目录

```powershell
npx agent-project-template init-full --name "Acme Agent Template" --slug acme-agent-template --target "H:\workspace" --profile ai-agent-workspace
```

效果：

- 生成目录：`H:\workspace\acme-agent-template`
- 复制完整模板框架内容
- 生成模板状态：`.template/template-state.json`

## 示例 2：通过配置文件初始化完整模板

```powershell
npx agent-project-template init-full --target "H:\workspace" --config "H:\workspace\acme-template-config.json"
```

适合：

- 希望统一管理项目名、Owner、技术栈与 Profile
- 希望把完整模板框架作为标准母版批量生成

## 与 `init` 的区别

- `init`：适合普通项目落地，只复制轻量骨架与必要模板
- `init-full`：适合模板母版场景，会把 CLI、技能和完整框架一起复制，但不会带出具体项目资料

## 备注

- `init-full` 的兼容别名是 `init-template`
- 初始化后，后续 `sync` 会继续管理框架级文件
- 如果你只想开始一个具体项目，优先使用 `init`
