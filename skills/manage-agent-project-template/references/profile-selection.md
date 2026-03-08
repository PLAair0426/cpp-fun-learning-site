# Profile Selection

Use this reference only when you need to choose, justify, or extend a template profile.

## Built-in Profiles

### `web-product`

Use for:

- Web products
- SaaS tools
- learning platforms
-运营平台 with clear frontend experience

Characteristics:

- product-facing UI is important
- frontend + API + data model evolve together
- often needs `docs/design/` and operations notes

### `backend-service`

Use for:

- API services
- microservices
- task workers
- infrastructure or platform backends

Characteristics:

- interface stability matters more than complex UX
- API / data / monitoring / performance docs are central
- often needs `docs/api/` and architecture or benchmark drafts

### `ai-agent-workspace`

Use for:

- agent workflows
- skill libraries
- prompt / spec / knowledge orchestration projects
- multi-agent collaboration workspaces

Characteristics:

- reusable process assets are first-class output
- `skills/`, workflow docs, and knowledge docs grow continuously
- often needs `docs/agent/`, `docs/knowledge/`, and `skills/custom/`

### `content-platform`

Use for:

- courses
- media platforms
- CMS / content operations systems
- knowledge or publishing platforms

Characteristics:

- content lifecycle and operations are central
- often needs content, SEO, and运营 documentation

## Profile Choice Rules

Choose the profile by the dominant delivery concern:

1. UX and product journey first → `web-product`
2. API, service stability, throughput, integration first → `backend-service`
3. reusable workflow / agent capability / knowledge assets first → `ai-agent-workspace`
4. content production, publishing, or运营 first → `content-platform`

If a project overlaps multiple types:

- choose the dominant type as the base profile
- add project-specific directories through config
- avoid cloning or forking an existing profile unless the difference is stable and reusable

## When To Create a New Profile

Create a new profile only when all are true:

1. the project repeatedly needs a distinct directory set
2. the default variables are consistently different
3. the sync protection rules differ materially
4. the difference is reusable across multiple future projects

Otherwise:

- keep the existing profile
- use `template-config` overrides for local variation
