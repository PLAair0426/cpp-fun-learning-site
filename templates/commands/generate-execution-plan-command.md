# Generate Execution Plan Command

本文件说明“如何进入执行计划阶段”。

## 适用场景

- 已有确认版 PRD + Spec，准备生成执行计划

## 输入前提

建议至少具备：

- 确认版 PRD：`docs/product/{project}-prd.md`
- 确认版 Spec：`docs/technical/{project}-spec.md`

## 推荐调用语句

```text
请使用 templates/prompts/spec-to-execution-plan.md 的规则，
基于 docs/product/{project}-prd.md 和 docs/technical/{project}-spec.md，
先完成输入完整性检查、PRD/Spec 映射与冲突提取，
再将执行计划草稿输出到 generated/execution/{project}-execution-plan-draft.md，
正式版输出到 docs/execution/{project}-execution-plan.md。
```

## 输出位置

- 草稿：`generated/execution/{project}-execution-plan-draft.md`
- 正式版：`docs/execution/{project}-execution-plan.md`

## 备注

- 执行计划阶段不应重写 PRD 或重做 Spec
- 如果 PRD / Spec 仍有关键缺口，应先列入待确认项，再决定是否推进
