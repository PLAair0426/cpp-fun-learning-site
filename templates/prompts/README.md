# Prompts

本目录存放阶段型提示词手册，用于约束模型在不同文档阶段的职责、输入、输出和边界。

这些文件不是“随手提问模板”，而是整套项目文档流水线中的固定执行提示词：

- `generate-prd.md`：把原始资料、访谈记录、补充问答整理为正式 PRD
- `prd-to-spec.md`：把确认版 PRD 转译为可执行的技术 Spec
- `spec-to-execution-plan.md`：把确认版 PRD + Spec 转译为研发执行计划

## 推荐顺序

1. `generate-prd.md`
2. `prd-to-spec.md`
3. `spec-to-execution-plan.md`

如果项目已经有正式 PRD，可直接从第二步开始；如果已经有正式 PRD 和 Spec，可直接进入执行计划阶段。

## 如何理解这些文件

- `commands/` 负责说明“命令怎么触发”
- `prompts/` 负责说明“模型收到任务后应如何工作”
- `documents/` 负责说明“正式文档最终采用什么结构”
- `specification/project-specification.md` 负责说明“整个项目为什么这样分层，以及必须遵守哪些规则”

## 阶段边界

- `generate-prd.md` 只负责需求澄清与产品定义，不负责技术架构设计
- `prd-to-spec.md` 只负责技术承接与方案结构化，不负责新增业务范围
- `spec-to-execution-plan.md` 只负责任务拆解、阶段划分与落地排程，不负责重写 PRD 或重做 Spec

## 使用规则

- 优先使用对应阶段的单一提示词，不混用多个阶段职责
- 若输入不足，先输出 `待确认项`，不要脑补缺失事实
- 先产出草稿到 `generated/`，确认后再整理到 `docs/`
- 如需长期复用或自动化调用，应通过 `commands/` 或 Node CLI 统一封装

## 推荐习惯

1. 先确认当前项目处于哪个阶段
2. 再打开该阶段对应的 `commands/*.md`
3. 最后使用本目录中的阶段提示词执行生成
4. 输出完成后用 `documents/` 模板检查结构完整性
