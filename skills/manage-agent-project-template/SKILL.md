---
name: manage-agent-project-template
description: Coordinate a profile-driven AI/Agent project template workflow. Use when users need a top-level router for template operations across bootstrap, document pipeline, and sync/upgrade tasks, or when the task spans more than one of those modes.
---

# Manage Agent Project Template

## Overview

Use this skill as the top-level router for a reusable AI / Agent project template with clear separation between raw inputs, generated drafts, formal documents, reusable skills, and project-level specification.

It coordinates three recurring tasks:

1. Bootstrap a new project workspace from the template
2. Run the document generation pipeline in the correct order
3. Sync template upgrades into an existing project safely

## When To Use

Use this skill when the user asks to:

- initialize a project from the template
- choose or infer a template profile
- adapt the skeleton for a new project type
- generate PRD, Spec, or execution docs with the template flow
- upgrade or sync template files in an existing workspace
- turn project process rules into a reusable template-based workflow
- or when the request spans more than one of the above at once

Do not use this skill for project-specific business analysis itself.  
When the request is about the business content inside PRD, Spec, or source materials, use the relevant domain workflow after this template structure is in place.

When the request is narrower, prefer the focused skills:

- `$bootstrap-agent-project-template`
- `$run-project-document-pipeline`
- `$sync-agent-project-template`

## Required Checks

Before acting, always:

1. Read `specification/project-specification.md`
2. Read root `AGENTS.md`
3. Confirm the repository contains:
   - `templates/template-manifest.json`
   - `templates/profiles/`
   - `templates/commands/`
4. Determine the operating mode:
   - bootstrap
   - document pipeline
   - sync / upgrade
5. Keep these layers separate:
   - `assets/` = raw input
   - `generated/` = drafts / intermediate output
   - `docs/` = confirmed formal docs

## Workflow Decision

### Mode A: Bootstrap a New Workspace

Use this mode when the user wants a new project skeleton.  
Prefer delegating to `$bootstrap-agent-project-template`.

Steps:

1. Infer the closest profile from the requested project type  
   If uncertain, read `references/profile-selection.md`
2. Prepare a project config derived from `templates/template-config.example.json`
3. Run `templates/commands/bootstrap-project.ps1`
4. Verify `.template/template-state.json` was created
5. Confirm the selected profile, generated directories, and protected paths

Default rule:

- Prefer config-driven initialization over ad-hoc manual directory creation

### Mode B: Run the Document Pipeline

Use this mode when the user already has source materials and wants formal project documents.  
Prefer delegating to `$run-project-document-pipeline`.

Steps:

1. Verify required inputs exist under `assets/` and `preparation/`
2. Choose the correct template command and prompt
3. Generate drafts into `generated/`
4. Only after review or confirmation, consolidate formal versions into `docs/`
5. Record unresolved issues as `待确认项`, not fabricated facts

Read `references/workflow-and-commands.md` when you need the exact order or command pattern.

### Mode C: Sync or Upgrade an Existing Workspace

Use this mode when the template evolves and an existing project should inherit the new scaffold safely.  
Prefer delegating to `$sync-agent-project-template`.

Steps:

1. Read `.template/template-state.json`
2. Review profile, managed globs, and protected prefixes
3. Run `templates/commands/sync-template.ps1 -DryRun` first
4. Inspect creates / updates / skipped items
5. Apply the real sync only when the preview is safe or the user explicitly asks

Default protection:

- Do not overwrite `assets/raw/`
- Do not overwrite `generated/`
- Do not overwrite formal business docs under `docs/`
- Do not remove project-specific assets unless the user explicitly requests it

## Output Requirements

When using this skill, always output:

- the selected operating mode
- the selected or inferred profile
- missing inputs or blocking questions
- the exact command or next action
- which files are treated as raw, draft, formal, and managed template files

If the request is to build a generic framework artifact, keep the result free of project-specific business facts.

## References

- Read `references/profile-selection.md` when selecting or extending a profile
- Read `references/workflow-and-commands.md` when bootstrapping, generating docs, or syncing upgrades
