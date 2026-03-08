# Changelog

All notable changes to this package are documented in this file.

## [0.1.3] - 2026-03-08

### Changed

- Trimmed user-facing README content to remove maintainer-only release and implementation details.
- Excluded internal release documents from the published npm package.
- Moved maintainer release guidance into the repo-only `maintainers/` directory.

## [0.1.2] - 2026-03-08

### Added

- Added standard npm release scripts for `check`, version bump, and publish workflows.
- Added a release command handbook at `templates/commands/release-package-command.md`.
- Added a root `CHANGELOG.md` so releases can be tracked in a fixed format.

### Changed

- Updated `README.md` and `skills/publish-workflow.md` to align with the standardized npm release flow.

## [0.1.1] - 2026-03-08

### Changed

- Normalized `package.json` `bin` metadata to match npm publish expectations.
- Published the first patched npm release after the initial registry launch.

## [0.1.0] - 2026-03-08

### Added

- First public npm release of `agent-project-template`.
- Published the Node CLI with `profiles`, `init`, `init-full`, and `sync`.
- Published the reusable template skeleton, profiles, prompts, document templates, and skills.
