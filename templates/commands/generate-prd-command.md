# Generate PRD Command

本文件说明“如何进入 PRD 阶段”。

## 适用场景

- 已有原始资料，准备生成 PRD 草稿

## 输入前提

建议至少具备：

- `assets/raw/` 下的原始资料
- 必要的前期澄清信息
- 当前项目的目录结构已经初始化完成

## 推荐调用语句

```text
请使用 templates/prompts/generate-prd.md 的规则，
基于 assets/raw/ 下的原始资料，
先完成输入完整性检查与需求澄清，
再将 PRD 草稿输出到 generated/prd/{project}-prd-draft.md，
正式版输出到 docs/product/{project}-prd.md。
```

## 输出位置

- 草稿：`generated/prd/{project}-prd-draft.md`
- 正式版：`docs/product/{project}-prd.md`

## 备注

- PRD 阶段只定义产品需求，不应越界到技术实现
- 如果输入不足，应先输出缺失项和待确认项，而不是强行生成完整 PRD
