# Templates

本目录保存项目模板体系，用于统一初始化、文档生成、提示词与命令说明。

## 目录说明

- `template-manifest.json`：模板清单、受管文件与同步规则
- `template-config.example.json`：模板配置示例
- `profiles/`：不同项目类型的默认配置
- `prompts/`：文档与分析任务的提示词模板
- `commands/`：面向 CLI 或人工执行的命令说明
- `documents/`：正式文档模板

## 使用建议

- 先选定 `profile`
- 再按需要读取 `prompts/` 与 `documents/`
- 复杂交付优先基于模板生成，再做项目定制
- 同步模板前先评估对现有仓库的影响
