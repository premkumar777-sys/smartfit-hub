# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-08

### Added
- Created professional documentation folder `/docs` including setup, architecture, deployment, roadmap, and API documents.
- Moved startup playbook to `/docs/STARTUP.md`.
- Added standard community workflow configurations inside `.github` folder (`workflows/ci.yml`, `CODEOWNERS`, pull request & issue templates).
- Added `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and initial `CHANGELOG.md`.
- Added `.gitkeep` files for scalability structures: `contexts`, `types`, `utils`, `routes`, `store`, `layouts` in `/src`.
- Added `tests/README.md` placeholder file.

### Fixed
- Resolved LightningCSS parsing/minification syntax error in `src/index.css` by escaping Tailwind arbitrary selectors (`.blur-\[80px\]` etc.).
- Cleaned up obsolete directories and root items (`dev-dist`, `dist`, `dataconnect`, `.env.backup`, and legacy build artifacts/logs).
- Enhanced and structured `.gitignore` to prevent tracking build outputs and AI agent metadata (`.gemini/`).
