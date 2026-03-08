---
name: sync-agent-project-template
description: Safely preview and sync template upgrades into an existing AI/Agent project workspace. Use when users want to read template state, inspect managed files, run a dry-run sync, refresh config-driven variables, or apply scaffold updates without overwriting raw materials and formal business docs by default.
---

# Sync Agent Project Template

## Overview

Use this skill to upgrade an existing project workspace from the template source safely.

It is specifically for template maintenance after initialization.

## When To Use

Use this skill when the user asks to:

- sync template updates into an existing workspace
- preview what the sync would change
- refresh project variables from config
- inspect protected paths or managed globs
- safely upgrade template commands, prompts, profiles, or specification files

## Required Checks

Before acting, always:

1. Read `specification/project-specification.md`
2. Read root `AGENTS.md`
3. Confirm these paths exist:
   - `.template/template-state.json`
   - `templates/commands/sync-template.ps1`
   - `templates/template-manifest.json`
4. Read current template state before proposing a sync
5. Default to preview mode before any real sync

## Safety Rules

By default, treat these as protected:

- `assets/raw/`
- `assets/research/`
- `generated/`
- confirmed docs under `docs/`
- project-specific custom assets

Never recommend a direct overwrite of protected content unless the user explicitly asks for it and the impact is clear.

## Execution Steps

1. Read `.template/template-state.json`
2. Identify:
   - current profile
   - template version
   - managed globs
   - protected prefixes
3. Run `templates/commands/sync-template.ps1 -DryRun`
4. Review:
   - `create`
   - `update`
   - `unchanged`
   - `skip-protected`
5. If safe, run the real sync
6. Report the final summary and any paths that stayed protected

## Command Patterns

Preview:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\sync-template.ps1 `
  -ProjectRoot . `
  -DryRun
```

Apply:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\sync-template.ps1 `
  -ProjectRoot .
```

Apply with config refresh:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\sync-template.ps1 `
  -ProjectRoot . `
  -ConfigFile .\project-config.json
```

## Output Requirements

Always return:

- current profile
- whether dry-run was performed
- create / update / unchanged / skipped counts
- any protected paths that were not touched
- next safe action

If a workspace lacks `.template/template-state.json`, stop and report that initialization history is missing.
