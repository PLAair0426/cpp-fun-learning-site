# AI Agent Context

本仓库是 `{{PROJECT_NAME}}` 的 AI / Agent 协作工作区。  
如果当前仓库仍是模板源仓库，`{{...}}` 占位符会在项目初始化时自动替换。

## 核心边界

### ALWAYS

- 总是先阅读 `specification/project-specification.md`
- 总是优先读取 `.template/template-state.json` 了解当前项目的 Profile、变量和受管路径
- 总是区分原始资料、草稿和正式文档
- 总是将复杂任务落到固定模板与正式工件
- 总是在信息不足时输出 `待确认项`
- 总是在修改文档路径后同步修正文档内引用
- 总是在同步模板时保护业务文档、原始资料和项目特有沉淀

### ASK FIRST

- 在删除正式文档前先询问
- 在重命名根级目录或根级规范文件前先询问
- 在调整项目总规范结构前先询问
- 在引入新的高优先级执行规则前先询问

### NEVER

- 绝不把未确认内容写成正式事实
- 绝不把草稿直接冒充正式版文档
- 绝不绕过固定模板直接输出复杂执行方案
- 绝不把密钥、凭证、敏感配置写入仓库
- 绝不让同一类规则散落在多个文档里长期重复维护

## 文档职责

- `assets/`：原始输入资料
- `preparation/`：受理、问题、决策
- `templates/`：生成模板与命令模板
- `generated/`：草稿与中间产物
- `docs/`：正式业务、技术、执行文档
- `specification/`：项目级上位规范
- `skills/`：可复用技能
- `.template/`：模板状态、Profile 和同步元数据

## 默认执行顺序

1. 检查 `.template/template-state.json` 与输入资料
2. 确认应使用的模板与 Profile
3. 先产出草稿到 `generated/`
4. 确认后再整理正式版到 `docs/`
5. 如具备复用价值，再沉淀到 `skills/` 或 `specification/`
