---
name: bootstrap-agent-project-template
description: Bootstrap a new profile-driven AI/Agent project workspace. Use when users want to initialize a reusable project skeleton, choose a template profile, prepare template config, or create a new workspace with manifest, profiles, prompts, commands, docs, and template state.
---

# Bootstrap Agent Project Template

## Overview

Use this skill to create a new project workspace from a reusable AI / Agent template.

It is specifically for initialization, not for syncing an existing workspace and not for writing business-specific PRD or Spec content.

## When To Use

Use this skill when the user asks to:

- initialize a new project from the template
- create a new workspace in the current directory or target path
- choose the right template profile
- prepare a template config file
- generate the initial directory skeleton and `.template/template-state.json`

## Required Checks

Before acting, always:

1. Read `specification/project-specification.md`
2. Read root `AGENTS.md`
3. Confirm these paths exist:
   - `templates/template-manifest.json`
   - `templates/profiles/`
   - `templates/commands/bootstrap-project.ps1`
4. Distinguish:
   - template source repo
   - target project directory
5. Keep the output generic unless the user explicitly wants project-specific values

## Profile Selection

Choose the closest base profile by the dominant project type:

- `web-product` for UX-first web products
- `backend-service` for API or service-first systems
- `ai-agent-workspace` for skill, workflow, or knowledge-driven workspaces
- `content-platform` for content, course, or publishing systems

If the project overlaps several types:

- choose one base profile
- put local differences in config overrides
- avoid creating a new profile unless the difference is stable and reusable

## Execution Steps

1. Infer or confirm the target profile
2. Decide whether to initialize by direct parameters or config file
3. If needed, prepare a config based on `templates/template-config.example.json`
4. Run `templates/commands/bootstrap-project.ps1`
5. Verify the following were created:
   - base directories
   - copied template files
   - `.template/template-state.json`
6. Report the selected profile, target path, and generated project root

## Command Patterns

Direct parameter mode:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\bootstrap-project.ps1 `
  -ProjectName "Example Project" `
  -ProjectSlug "example-project" `
  -TargetPath . `
  -Profile "web-product"
```

Config mode:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\bootstrap-project.ps1 `
  -TargetPath . `
  -ConfigFile .\project-config.json
```

## Output Requirements

Always return:

- chosen profile
- command to run
- target output path
- whether config is still missing
- whether `.template/template-state.json` exists after initialization

If information is missing, ask only for the minimum required fields or present them as `待确认项`.
