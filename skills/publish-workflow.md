# Skill Publish Workflow

本文件描述这组通用模板 Skill 的轻量发布流程。

目标不是引入复杂的发布系统，而是提供一套足够稳定、易执行的最小流程。

## 1. 适用场景

适用于：

- 准备把这组 Skill 对外分发
- 准备把这组 Skill 安装到新的工作区
- 模板能力更新后，需要整理一次新版本发布

## 2. 最小发布流程

推荐按以下顺序执行：

1. 更新 Skill 内容
2. 更新总览与安装文档
3. 执行发布前检查
4. 整理发布包
5. 编写发布说明
6. 再进行一次抽样复核

## 3. 第一步：更新 Skill 内容

确认以下内容已经同步：

- `SKILL.md`
- `agents/openai.yaml`
- 图标资源
- 相关引用文档

如果模板脚本、目录结构、调用方式发生变化，优先先更新 Skill，再准备发布。

## 4. 第二步：更新文档入口

至少检查以下文档：

- `skills/README.md`
- `skills/catalog.md`
- `skills/install-and-usage.md`
- `skills/package-checklist.md`

目标：

- 保证入口清晰
- 保证 Skill 分工一致
- 保证安装说明与实际结构一致

## 5. 第三步：执行发布前检查

执行方式：

1. 按 `skills/package-checklist.md` 逐项检查
2. 对每个 Skill 运行结构校验
3. 搜索是否残留项目特有信息
4. 如本仓库同时作为 npm 包发布入口，执行 `npm run release:check`

若有一项不通过，不进入打包阶段。

## 6. 第四步：整理发布包

建议只包含必要内容：

- `skills/README.md`
- `skills/catalog.md`
- `skills/install-and-usage.md`
- `skills/package-checklist.md`
- `skills/publish-workflow.md`
- `skills/release-notes-template.md`
- 各 Skill 目录

避免放入：

- 临时测试文件
- 业务草稿
- 与 Skill 无关的项目资料

## 7. 第五步：编写发布说明

发布说明建议至少回答：

- 本次发布包含哪些 Skill
- 有哪些新增或调整
- 是否影响安装方式
- 是否影响已有工作区使用方式

可直接基于：

- `skills/release-notes-template.md`
- `CHANGELOG.md`

## 8. 第六步：抽样复核

发布前最后做一次轻量复核：

1. 随机打开 1 个 Skill 的 `SKILL.md`
2. 随机打开 1 个 `agents/openai.yaml`
3. 随机打开 1 个安装示例
4. 检查发布说明是否与实际内容一致

## 9. 完成标准

满足以下条件即可视为“可以发布”：

- 核心 Skill 全部存在
- 入口文档完整
- 安装说明可执行
- 发布清单通过
- 发布说明已准备

## 10. 一句话说明

这是一套“轻量但可复用”的 Skill 发布流程，用来避免漏文件、漏说明、漏检查。

## 11. npm 包发布补充

如果当前仓库同时发布 npm 包，推荐附加执行：

1. 更新 `CHANGELOG.md`
2. 执行 `npm run release:patch` / `release:minor` / `release:major`
3. 再执行一次 `npm run release:check`
4. 执行 `npm run release:publish`
