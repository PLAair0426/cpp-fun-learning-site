# Bootstrap Project Command

本文件只说明“如何初始化模板工程”。

## 适用场景

- 初始化一个新项目骨架
- 按项目类型自动创建目录、模板和规则文件
- 为后续模板同步生成 `.template/template-state.json`

## 推荐方式：Node CLI

```powershell
npx agent-project-template init --name "Acme Learning Platform" --slug acme-learning-platform --target . --profile web-product
```

### 常用参数

- `--name`：项目名称
- `--slug`：项目目录名
- `--target`：目标父目录
- `--profile`：模板 Profile
- `--config`：配置文件
- `--force`：允许写入非空目录
- `--in-place`：在当前目标目录原地初始化

### 示例 1：直接用参数初始化

```powershell
npx agent-project-template init --name "Acme Learning Platform" --slug acme-learning-platform --target "H:\workspace" --profile web-product
```

效果：

- 生成目录：`H:\workspace\acme-learning-platform`
- 生成模板状态：`.template/template-state.json`

### 示例 2：通过已编辑的配置文件初始化

```powershell
npx agent-project-template init --target "H:\workspace" --config "H:\workspace\acme-template-config.json"
```

适合：

- 希望把项目名、Owner、技术栈等初始化信息统一放进配置文件

### 示例 3：原地初始化

```powershell
npx agent-project-template init --name "Acme Learning Platform" --target "H:\workspace\acme-learning-platform" --profile web-product --in-place
```

适合：

- 目标目录已经明确
- 不希望再自动创建子目录

## PowerShell 兼容入口

```powershell
powershell.exe -ExecutionPolicy Bypass -File templates/commands/bootstrap-project.ps1 `
  -ProjectName "Acme Learning Platform" `
  -ProjectSlug "acme-learning-platform" `
  -TargetPath "H:\workspace" `
  -Profile "web-product"
```

## 备注

- `Profile` 决定默认目录、默认变量和保护路径
- `ConfigFile` 建议基于 `templates/template-config.example.json` 复制后填写，再传入脚本
- `ConfigFile` 用于覆盖具体项目的名称、Owner、技术栈和额外目录
- 初始化后会生成 `.template/template-state.json`，供后续同步使用
- `init` 是日常推荐入口；PowerShell 脚本主要作为兼容方式保留
- 如果你需要的是“完整模板母版”而不是轻量项目骨架，请改用 `init-full`
