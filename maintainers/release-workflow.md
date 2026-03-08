# Release Workflow

本文件记录模板维护者使用的内部发版流程，不会进入面向用户的 npm 包内容。

## 1. npm 包发版

推荐顺序：

1. 更新 `CHANGELOG.md`
2. 运行 `npm run release:check`
3. 按需执行：
   - `npm run release:patch`
   - `npm run release:minor`
   - `npm run release:major`
4. 再运行一次 `npm run release:check`
5. 执行 `npm run release:publish`

补充说明：

- 详细命令说明：`templates/commands/release-package-command.md`
- 面向用户的最终说明应保留在根目录 `README.md`
- 内部维护说明不要继续写回用户 README

## 2. Skill 发布

Skill 相关自检与发布说明继续参考：

- `skills/package-checklist.md`
- `skills/publish-workflow.md`
- `skills/release-notes-template.md`

## 3. 用户版约束

发布到 npm 的用户版需要遵守：

- 不在根目录 `README.md` 暴露内部实现文件路径
- 不在用户文档中暴露内部发版命令
- 不把维护者专用发布文档打进最终 npm 包
