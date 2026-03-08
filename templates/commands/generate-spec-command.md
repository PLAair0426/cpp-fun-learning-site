# Generate Spec Command

本文件说明“如何进入 Spec 阶段”。

## 适用场景

- 已有确认版 PRD，准备生成 Spec 草稿

## 输入前提

建议至少具备：

- 确认版 PRD：`docs/product/{project}-prd.md`
- 技术约束、技术栈或相关参考资料

## 推荐调用语句

```text
请使用 templates/prompts/prd-to-spec.md 的规则，
基于 docs/product/{project}-prd.md，
结合 docs/technical/ 下的技术约束资料，
先完成 PRD 可承接性检查与技术映射，
再将 Spec 草稿输出到 generated/spec/{project}-spec-draft.md，
正式版输出到 docs/technical/{project}-spec.md。
```

## 输出位置

- 草稿：`generated/spec/{project}-spec-draft.md`
- 正式版：`docs/technical/{project}-spec.md`

## 备注

- Spec 阶段只负责技术规格定义
- 不应在这一阶段新增产品需求或直接拆研发排期
