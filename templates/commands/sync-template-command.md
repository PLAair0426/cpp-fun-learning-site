# Sync Template Command

本文件只说明“如何同步模板升级”。

## 适用场景

- 把模板仓库的新规则同步到已初始化项目
- 升级 `templates/`、`specification/`、根级规则文件
- 在不覆盖业务文档的前提下让项目骨架自动迭代

## 推荐方式：Node CLI

```powershell
npx agent-project-template sync --project-root . --dry-run
```

### 常用参数

- `--project-root`：已有项目根目录
- `--profile`：强制覆盖当前 Profile
- `--config`：配置文件路径
- `--include`：额外纳入同步的 glob
- `--exclude`：额外排除的 glob
- `--dry-run`：仅预览变更
- `--force`：允许触碰默认受保护路径

### 示例 1：先预览同步结果

```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform" --dry-run
```

推荐原因：

- 会先告诉你哪些文件是 `create`、`update`、`unchanged`、`skip-protected`
- 可以先确认风险，再决定是否正式写入

### 示例 2：执行同步

```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform"
```

### 示例 3：带配置文件更新项目变量

```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform" --config "H:\workspace\acme-learning-platform\project-config.json"
```

### 示例 4：额外包含或排除部分文件

```powershell
npx agent-project-template sync --project-root "H:\workspace\acme-learning-platform" --dry-run --include "templates/documents/*.md" --exclude "templates/commands/*.md"
```

## PowerShell 兼容入口

```powershell
powershell.exe -ExecutionPolicy Bypass -File templates/commands/sync-template.ps1 `
  -ProjectRoot "H:\workspace\acme-learning-platform" `
  -DryRun
```

## 备注

- 默认优先保护 `assets/raw/`、`generated/`、`docs/product/`、`docs/technical/`、`docs/execution/`
- 推荐先使用 `--dry-run`
- 如确需覆盖受保护路径，可显式传 `--force`
- 如果项目缺少 `.template/template-state.json`，说明它还不是通过模板初始化得到的，无法安全同步
