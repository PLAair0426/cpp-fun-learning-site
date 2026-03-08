# Skill Pack Baseline

本文件用于把当前这套通用模板 Skill 固化为一份可复用的基线说明。

目标很简单：

- 说明“这一版已经可以作为母版使用”
- 明确基线包含哪些 Skill 与配套文档
- 方便后续版本迭代时有一个稳定起点

## 1. Baseline 定位

这是一套面向通用 AI / Agent 项目模板的 Skill 基线。

它覆盖三类核心能力：

1. 初始化模板项目
2. 推进文档流水线
3. 安全同步模板升级

并提供一个总入口 Skill 做统一路由。

## 2. Baseline 范围

### 核心 Skill

- `manage-agent-project-template/`
- `bootstrap-agent-project-template/`
- `run-project-document-pipeline/`
- `sync-agent-project-template/`

### 配套文档

- `skills/README.md`
- `skills/catalog.md`
- `skills/install-and-usage.md`
- `skills/baseline.md`

## 3. 基线能力说明

这一基线默认具备：

- Skill 分工清晰
- 总入口与子 Skill 路由清晰
- 安装方式明确
- 发布前检查明确
- 轻量发布流程明确
- 发布说明模板明确
- UI 元数据与图标资源齐全

## 4. 适合作为母版的原因

这套基线已经满足“可复用模板包”的最小闭环：

- 能安装
- 能识别
- 能调用
- 能发布
- 能检查
- 能继续演进

同时它保持了较低复杂度，没有引入额外的自动发布系统、复杂依赖或多余层次。

## 5. 后续迭代原则

后续如果继续演进，建议遵守：

1. 优先更新现有文档，不轻易新增重复说明
2. 优先增强现有 Skill，不轻易拆出过多子 Skill
3. 如果新增内容不能提升复用性，就不要放入基线
4. 保持通用，不引入单项目业务信息

## 6. 何时视为需要升级基线

只有当出现以下变化之一时，再考虑升级这份基线：

- 新增稳定且可复用的 Skill
- Skill 之间的职责边界发生稳定变化
- 安装方式或发布方式发生变化
- 模板结构与当前说明不再一致

## 7. 一句话结论

当前 `skills/` 目录已经可以作为一套轻量、通用、可分发的模板 Skill 基线直接复用。
