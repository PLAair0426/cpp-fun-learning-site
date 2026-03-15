# Profiles

Profile 用于描述不同项目类型在模板初始化时的默认目录、生成物与保护规则。

## 合并来源

初始化时通常会合并以下信息：

1. `backend/meta/templates/template-manifest.json`
2. `backend/meta/templates/profiles/*.json`
3. 用户传入配置
4. 目标仓库已有状态

## 使用建议

- 新项目先选择最接近的 profile
- profile 负责默认行为，不替代正式文档
- 需要长期复用的结构变更应回写到 profile
