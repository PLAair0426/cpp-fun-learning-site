# Node CLI Command

这是当前模板的推荐命令入口。  
适合想通过 `npm` / `npx` 统一完成初始化与同步的人。

## 支持的命令

- `profiles`
- `init`
- `init-full`
- `sync`

## 1. 查看内置 Profile

```powershell
npx agent-project-template profiles
```

用途：

- 查看当前可用的模板 Profile
- 在初始化之前确定项目类型

备注：

- 只读命令
- 不会修改任何文件

## 2. 初始化模板项目

最常用命令：

```powershell
npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product
```

常见参数：

- `--name`：项目名称
- `--slug`：项目目录名
- `--target`：目标父目录，默认当前目录
- `--profile`：模板 Profile
- `--config`：配置文件路径
- `--force`：允许写入非空目录
- `--in-place`：直接在目标目录初始化

基于配置文件初始化：

```powershell
npx agent-project-template init --target . --config .\project-config.json
```

在当前目录原地初始化：

```powershell
npx agent-project-template init --name "Example Project" --target . --profile web-product --in-place
```

备注：

- 不加 `--in-place` 时，会在 `--target` 下再生成一个子目录
- 加了 `--in-place` 时，会直接把当前目录当项目目录使用
- 初始化后会生成 `.template/template-state.json`

## 3. 初始化完整模板框架

当你希望拿到完整模板母版能力，而不只是轻量项目骨架时，使用：

```powershell
npx agent-project-template init-full --name "Example Project Template" --slug example-project-template --target . --profile ai-agent-workspace
```

它会额外带上：

- `package.json`
- `bin/`
- `lib/`
- `skills/` 全部内容
- `templates/` 下的完整模板资产
- 基础目录说明文件与规范文件

适合：

- 你要把这一套骨架当成“模板母版”继续演化
- 你希望新目录里直接具备 CLI、模板、技能与规范的完整能力
- 你后续还希望通过 `sync` 同步这些框架级文件

备注：

- 参数与 `init` 保持一致
- `init-full` 的兼容别名是 `init-template`
- 初始化后写入的 `.template/template-state.json` 会记录框架模式，后续 `sync` 会继续管理这些框架级文件
- 不会复制 `assets/raw/`、`generated/*` 草稿或 `docs/product/` / `docs/technical/` 里的业务内容

## 4. 预览或执行模板同步

预览同步：

```powershell
npx agent-project-template sync --project-root . --dry-run
```

执行同步：

```powershell
npx agent-project-template sync --project-root .
```

带配置文件刷新变量：

```powershell
npx agent-project-template sync --project-root . --config .\project-config.json
```

备注：

- `init` 是 `bootstrap-project.ps1` 的 Node 版入口
- `init-full` 是“完整模板母版初始化”入口
- `sync` 是 `sync-template.ps1` 的 Node 版入口
- 强烈建议同步前先跑一次 `--dry-run`
- PowerShell 脚本仍可保留为兼容入口，但推荐优先使用 Node CLI

## 兼容入口

如果当前仍需要 PowerShell 入口，可参考：

- `bootstrap-project-command.md`
- `sync-template-command.md`
