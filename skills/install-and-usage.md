# Skill Install And Usage Guide

本文件说明这组通用模板 Skill 的安装方式、目录要求和典型调用示例。

它只描述 Skill 包本身的分发与使用，不承载任何单个项目的业务信息。

## 1. 适用对象

适用于以下场景：

- 想把这组 Skill 作为模板包分发给其他项目
- 想在新的 AI / Agent 工作区中复用这些 Skill
- 想明确每个 Skill 应该如何调用
- 想了解安装后如何配合模板脚本使用

## 2. Skill 包内容

建议分发时至少包含以下内容：

- `skills/README.md`
- `skills/catalog.md`
- `skills/install-and-usage.md`
- `skills/baseline.md`
- `skills/manage-agent-project-template/`
- `skills/bootstrap-agent-project-template/`
- `skills/run-project-document-pipeline/`
- `skills/sync-agent-project-template/`

每个 Skill 目录至少包含：

- `SKILL.md`
- `agents/openai.yaml`
- `assets/` 中的图标资源

## 3. 安装方式

### 方式 A：作为项目内置 Skill 使用

适合：

- 项目模板仓库
- 团队内部项目脚手架
- 希望 Skill 与模板脚本一起版本化管理

做法：

1. 将整个 `skills/` 目录保留在项目仓库中
2. 确保根级 `AGENTS.md` 能引导 Agent 识别和使用这些 Skill
3. 通过仓库内路径直接维护 Skill 内容

优点：

- 和模板脚本、规范文档一起演进
- 便于项目级定制

### 方式 B：作为可复用 Skill 安装到 Codex 技能目录

适合：

- 想跨多个项目复用这些 Skill
- 想把 Skill 当成通用工具包安装

做法：

1. 选择需要的 Skill 目录
2. 将其复制到你的 Codex 技能目录，例如 `$CODEX_HOME/skills/`
3. 保持 Skill 目录结构完整，不要只复制 `SKILL.md`

示例：

```powershell
Copy-Item -Recurse .\skills\bootstrap-agent-project-template $env:CODEX_HOME\skills\
Copy-Item -Recurse .\skills\run-project-document-pipeline $env:CODEX_HOME\skills\
Copy-Item -Recurse .\skills\sync-agent-project-template $env:CODEX_HOME\skills\
Copy-Item -Recurse .\skills\manage-agent-project-template $env:CODEX_HOME\skills\
```

注意：

- 具体技能发现方式以你当前 Codex 环境配置为准
- 若环境支持项目内 Skill 与全局 Skill 共存，优先避免同名冲突

## 4. 安装后检查项

安装完成后，至少检查：

1. 每个 Skill 目录是否完整
2. `SKILL.md` 是否存在
3. `agents/openai.yaml` 是否存在
4. 图标路径是否仍然有效
5. Skill 名称是否唯一

建议检查目录示例：

```text
bootstrap-agent-project-template/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
└─ assets/
   ├─ icon-small.svg
   └─ icon-large.svg
```

## 5. 推荐使用方式

### 场景 1：用户只说“帮我操作这套模板”

优先使用：

- `$manage-agent-project-template`

示例：

```text
Use $manage-agent-project-template to route this template task and choose the correct workflow.
```

### 场景 2：用户要新建模板项目

优先使用：

- `$bootstrap-agent-project-template`

示例：

```text
Use $bootstrap-agent-project-template to initialize a new profile-driven project workspace in the current directory.
```

### 场景 3：用户要生成 PRD、Spec 或执行文档

优先使用：

- `$run-project-document-pipeline`

示例：

```text
Use $run-project-document-pipeline to generate the next document stage and keep drafts in generated/ and formal docs in docs/.
```

### 场景 4：用户要同步模板升级

优先使用：

- `$sync-agent-project-template`

示例：

```text
Use $sync-agent-project-template to preview template updates before applying them to this workspace.
```

## 6. 与模板脚本的配合关系

这组 Skill 与以下脚本直接配合：

- `templates/commands/bootstrap-project.ps1`
- `templates/commands/sync-template.ps1`
- `templates/commands/generate-prd-command.md`
- `templates/commands/generate-spec-command.md`
- `templates/commands/generate-execution-plan-command.md`

关系如下：

- Skill 负责判断流程、边界和输出要求
- 模板脚本负责初始化与同步
- Prompt / Command 模板负责文档生成调用方式

## 7. 发布前自检建议

在分发这组 Skill 前，建议执行以下检查：

1. 确认所有 `SKILL.md` frontmatter 合法
2. 确认所有 `agents/openai.yaml` 字段完整
3. 确认图标文件存在
4. 确认文档中没有残留单次项目业务信息
5. 确认默认提示词中正确引用 `$skill-name`

## 8. 一句话使用建议

如果用户的目标不明确，先走 `$manage-agent-project-template`；  
如果目标明确，则直接进入对应的子 Skill，减少上下文开销。
