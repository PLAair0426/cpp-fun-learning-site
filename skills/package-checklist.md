# Skill Package Checklist

本文件用于在分发这组通用模板 Skill 之前，执行一次结构、内容与可用性检查。

它面向“发布打包前检查”，重点是确认 Skill 包是否完整、通用、可安装、可识别。

## 1. 打包范围检查

确认待分发内容至少包含：

- `skills/README.md`
- `skills/catalog.md`
- `skills/install-and-usage.md`
- `skills/package-checklist.md`
- `skills/manage-agent-project-template/`
- `skills/bootstrap-agent-project-template/`
- `skills/run-project-document-pipeline/`
- `skills/sync-agent-project-template/`

检查标准：

- 没有漏掉任何一个核心 Skill
- 没有把临时草稿、测试输出、无关业务文档一并打包

## 2. Skill 目录完整性检查

对每个 Skill，确认至少包含：

- `SKILL.md`
- `agents/openai.yaml`
- `assets/icon-small.svg`
- `assets/icon-large.svg`

检查标准：

- 目录结构完整
- 所有引用路径真实存在
- 没有空目录占位但缺少核心文件

## 3. `SKILL.md` 规范检查

对每个 Skill，检查：

- frontmatter 中有 `name`
- frontmatter 中有 `description`
- `name` 使用小写 + 连字符格式
- `description` 明确说明“做什么”和“何时使用”
- 文档中没有残留 TODO
- 文档中没有项目特定业务事实

检查标准：

- 能被 `quick_validate.py` 通过
- 读者不需要本次聊天上下文也能理解 Skill 的用途

## 4. `agents/openai.yaml` 检查

对每个 Skill，检查：

- `display_name`
- `short_description`
- `icon_small`
- `icon_large`
- `brand_color`
- `default_prompt`

检查标准：

- 字段完整
- `short_description` 简短清晰
- `default_prompt` 显式引用对应的 `$skill-name`
- 图标路径为相对路径且可访问

## 5. 通用性检查

检查整包内容是否仍保持通用：

- 没有项目名称、项目路径、仓库专有信息
- 没有单次 PRD、Spec、业务背景内容
- 没有硬编码到某个行业、某个产品、某个客户

检查标准：

- 所有文档都描述“框架方法”而不是“本次项目内容”
- 示例路径和调用语句可以迁移到别的项目

## 6. 入口与导航检查

检查以下入口是否互相连通：

- `skills/README.md`
- `skills/catalog.md`
- `skills/install-and-usage.md`
- `skills/package-checklist.md`

检查标准：

- `README.md` 能把使用者引导到总览与安装文档
- `catalog.md` 能说明 Skill 角色分工
- `install-and-usage.md` 能说明如何安装和调用
- `package-checklist.md` 能说明如何在发布前自检

## 7. 资源可用性检查

检查每个 Skill 的资源：

- 图标是否存在
- 图标路径是否与 `openai.yaml` 一致
- 文档引用的文件是否存在

检查标准：

- 不存在悬空引用
- 不存在已删除文件仍被文档引用

## 8. 调用示例检查

检查示例是否覆盖以下场景：

- 总入口路由
- 初始化新项目
- 执行文档流水线
- 预览和同步模板升级

检查标准：

- 示例与 Skill 真实职责一致
- 示例使用的是通用术语
- 示例不会暗示项目特定事实

## 9. 发布前最小自检动作

建议至少执行以下动作：

1. 运行 Skill 结构校验
2. 打开每个 `agents/openai.yaml` 检查字段
3. 打开每个图标路径确认资源存在
4. 搜索是否残留项目特定关键词
5. 抽样阅读 1 次 README / catalog / install guide / package checklist

## 10. 通过标准

当以下条件全部满足时，可视为“可分发”：

- Skill 结构完整
- 元数据完整
- 资源路径有效
- 内容通用无项目污染
- 入口文档清晰
- 示例可直接复用

## 11. 一句话说明

`package-checklist.md` 的作用不是教你怎么写 Skill，而是帮你在“准备发布这组 Skill”之前，快速确认它们已经足够完整、通用、可安装。
