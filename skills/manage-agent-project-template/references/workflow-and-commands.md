# Workflow And Commands

Use this reference only when you need the concrete operating sequence or example commands.

## 1. Bootstrap Sequence

Recommended order:

1. choose profile
2. prepare config file if needed
3. run bootstrap script
4. verify `.template/template-state.json`
5. place source materials into `assets/raw/`

Example:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\bootstrap-project.ps1 `
  -ProjectName "Example Project" `
  -ProjectSlug "example-project" `
  -TargetPath . `
  -Profile "web-product"
```

Config-driven example:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\bootstrap-project.ps1 `
  -TargetPath . `
  -ConfigFile .\project-config.json
```

## 2. Document Pipeline Order

Never skip the order below for complex projects:

1. input check
2. PRD draft
3. confirmed PRD
4. Spec draft
5. confirmed Spec
6. execution plan draft
7. confirmed execution plan

Path rules:

- raw input → `assets/`
- drafts → `generated/`
- formal docs → `docs/`

Command entry points:

- `templates/commands/generate-prd-command.md`
- `templates/commands/generate-spec-command.md`
- `templates/commands/generate-execution-plan-command.md`

## 3. Sync Sequence

Always preview first:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\sync-template.ps1 `
  -ProjectRoot . `
  -DryRun
```

Then apply:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\sync-template.ps1 `
  -ProjectRoot .
```

With config refresh:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\templates\commands\sync-template.ps1 `
  -ProjectRoot . `
  -ConfigFile .\project-config.json
```

## 4. Safety Rules

During template maintenance:

- treat `.template/template-state.json` as the source of current template state
- protect `assets/raw/`, `generated/`, and confirmed docs by default
- prefer manifest/profile/config updates over manual one-off folder surgery
- record unresolved gaps as open questions, not assumptions

## 5. Genericity Rule

When creating reusable framework artifacts:

- keep them free of current-project business facts
- only describe stable template structure, workflow, commands, and guardrails
- move project-specific details into actual project docs, not the skill
