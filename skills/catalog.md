# Skill Catalog

本目录用于发布和维护一组围绕通用 AI / Agent 项目模板的可复用 Skill。

这些 Skill 只描述稳定的方法、结构、命令和边界，不承载任何单次项目的业务事实。

## 1. 目标

这组 Skill 的目标是把模板框架的核心操作拆成清晰、可组合、可分发的能力单元：

- 初始化新项目骨架
- 按固定顺序推进文档流水线
- 安全同步模板升级
- 在复杂请求下由总入口 Skill 做路由

## 2. Skill 清单

### `manage-agent-project-template`

定位：

- 总入口 / 路由 Skill

适用场景：

- 用户请求同时涉及初始化、文档流水线、同步升级中的两项及以上
- 用户只表达“帮我操作这套模板”，但尚未明确具体模式

主要职责：

- 判断当前任务属于 bootstrap / pipeline / sync 哪一类
- 将任务路由到更聚焦的 Skill
- 输出统一的操作模式、输入缺口和下一步动作

### `bootstrap-agent-project-template`

定位：

- 初始化 Skill

适用场景：

- 新建模板项目
- 选择 Profile
- 准备 `template-config`
- 执行初始化脚本

主要职责：

- 识别最合适的 Profile
- 准备或校验初始化配置
- 执行 `bootstrap-project.ps1`
- 验证 `.template/template-state.json`

### `run-project-document-pipeline`

定位：

- 文档流水线 Skill

适用场景：

- 从原始资料生成 PRD
- 从确认版 PRD 生成 Spec
- 从确认版 PRD + Spec 生成执行文档

主要职责：

- 维护 PRD → Spec → Execution Plan 顺序
- 强制区分 `assets/`、`generated/`、`docs/`
- 在输入不完整时输出缺口和 `待确认项`

### `sync-agent-project-template`

定位：

- 模板同步 Skill

适用场景：

- 模板仓库升级后，同步到已有项目
- 预览受管文件变化
- 根据配置刷新模板变量

主要职责：

- 读取 `.template/template-state.json`
- 执行 `sync-template.ps1 -DryRun`
- 保护原始资料、草稿和正式文档
- 在安全前提下执行正式同步

## 3. 推荐调用顺序

### 新项目启动

1. `$bootstrap-agent-project-template`
2. `$run-project-document-pipeline`
3. `$sync-agent-project-template`（后续模板演进时）

### 复杂混合请求

1. `$manage-agent-project-template`
2. 由总入口 Skill 路由到具体子 Skill

## 4. 输入与输出边界

所有 Skill 都应遵守同一套目录分层：

- `assets/`：原始输入
- `preparation/`：问题、受理、决策
- `generated/`：草稿与中间产物
- `docs/`：正式文档
- `.template/`：模板状态

统一规则：

- 不把草稿当正式版
- 不把未确认内容写成事实
- 不跳过固定执行顺序
- 不在同步模板时默认覆盖业务成果

## 5. 发布建议

如果要把这组 Skill 作为通用模板包对外分发，建议至少包含：

- 每个 Skill 的 `SKILL.md`
- 每个 Skill 的 `agents/openai.yaml`
- 每个 Skill 的图标资源
- 本目录的 `catalog.md`
- 本目录的 `install-and-usage.md`
- 本目录的 `baseline.md`
- 根级 `skills/README.md`

## 6. 维护建议

当模板框架升级时：

1. 先更新模板脚本和规范
2. 再检查 Skill 描述是否仍与真实流程一致
3. 若有新的稳定操作模式，再新增子 Skill
4. 若只是局部差异，优先更新现有 Skill，而不是制造重复 Skill

## 7. 一句话说明

这组 Skill 是“通用 AI / Agent 项目模板的操作层”，用于把模板骨架初始化、文档生成和安全升级沉淀为可复用能力。
