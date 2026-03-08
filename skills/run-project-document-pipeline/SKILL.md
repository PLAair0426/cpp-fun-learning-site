---
name: run-project-document-pipeline
description: Run the PRD to Spec to execution-document workflow for a template-based AI/Agent project. Use when users want to turn raw materials into structured project docs, follow the correct document order, keep drafts in generated and formal versions in docs, and avoid mixing business facts with template rules.
---

# Run Project Document Pipeline

## Overview

Use this skill to drive the formal document workflow in the correct order:

1. PRD
2. Spec
3. Execution plan

This skill manages process order and output placement, not business invention.

## When To Use

Use this skill when the user asks to:

- generate PRD from source materials
- generate Spec from a confirmed PRD
- generate execution documents from confirmed PRD and Spec
- run the template-based document flow end to end
- place drafts and formal docs into the correct directories

## Required Checks

Before acting, always:

1. Read `specification/project-specification.md`
2. Read root `AGENTS.md`
3. Confirm the relevant prompt and command templates exist:
   - `templates/prompts/generate-prd.md`
   - `templates/prompts/prd-to-spec.md`
   - `templates/prompts/spec-to-execution-plan.md`
   - `templates/commands/generate-prd-command.md`
   - `templates/commands/generate-spec-command.md`
   - `templates/commands/generate-execution-plan-command.md`
4. Keep these layers separate:
   - `assets/` = raw inputs
   - `generated/` = drafts
   - `docs/` = confirmed formal outputs

## Execution Order

Never skip the order:

1. input completeness check
2. PRD draft
3. confirmed PRD
4. Spec draft
5. confirmed Spec
6. execution plan draft
7. confirmed execution plan

If the current stage lacks enough input, stop and output missing inputs or `待确认项`.

## Stage Rules

### PRD Stage

- source from `assets/raw/` and `preparation/`
- draft goes to `generated/prd/`
- confirmed version goes to `docs/product/`

### Spec Stage

- source from confirmed PRD and technical constraints
- draft goes to `generated/spec/`
- confirmed version goes to `docs/technical/`

### Execution Stage

- source from confirmed PRD + confirmed Spec
- draft goes to `generated/execution/`
- confirmed version goes to `docs/execution/`

## Command Entry Points

- `templates/commands/generate-prd-command.md`
- `templates/commands/generate-spec-command.md`
- `templates/commands/generate-execution-plan-command.md`

## Output Requirements

Always return:

- current document stage
- available inputs
- missing inputs
- draft output path
- formal output path
- whether the process can advance to the next stage

Never present unconfirmed assumptions as formal product or technical facts.
