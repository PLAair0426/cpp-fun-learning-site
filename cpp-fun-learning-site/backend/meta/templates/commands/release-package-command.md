# Release Package Command

本文件只说明“如何发布 npm 包”。

## 适用场景

- 准备发布新的 npm 版本
- 准备做补丁版、次版本或主版本更新
- 希望用固定命令减少手动发布失误

## 标准命令

### 1. 发布前检查

```powershell
npm run release:check
```

作用：

- 执行 `npm pack --dry-run`
- 检查最终会被打进 npm 包的文件
- 在真正发布前确认包内容是否正确

### 2. 升补丁版本

```powershell
npm run release:patch
```

适合：

- 文档修正
- 小范围脚本修复
- 不影响主要使用方式的兼容更新

### 3. 升次版本

```powershell
npm run release:minor
```

适合：

- 新增命令
- 新增模板能力
- 向后兼容的功能增强

### 4. 升主版本

```powershell
npm run release:major
```

适合：

- 不兼容的命令调整
- 模板结构或默认行为发生重大变化

### 5. 发布到 npm

```powershell
npm run release:publish
```

作用：

- 按当前 `package.json` 版本发布 npm 包
- 默认发布到 `latest`

## 推荐顺序

1. 更新代码与文档
2. 更新 `CHANGELOG.md`
3. 运行 `npm run release:check`
4. 运行 `npm run release:patch` / `release:minor` / `release:major`
5. 再运行一次 `npm run release:check`
6. 运行 `npm run release:publish`

## 备注

- 版本提升命令使用 `--no-git-tag-version`，不会自动创建 git tag
- 发布前建议确认 npm 登录状态正常
- 如果是模板母版仓库，优先保证 `README.md`、`CHANGELOG.md` 和命令文档同步
