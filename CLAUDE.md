# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
source .env                                          # load env vars first
docker compose -f docker-compose.local.yaml up -d   # start PostgreSQL
yarn install                                         # install deps
yarn start                                           # start both frontend + backend (hot-reload)

# Type checking
yarn tsc                  # incremental (fast)
yarn tsc:full             # full check, no lib-check skip (CI-accurate)

# Linting & formatting
yarn lint                 # lint files changed since origin/main
yarn lint:all             # lint everything
yarn prettier:check       # check formatting

# Testing
yarn test                 # run tests (changed files)
yarn test:all             # full suite with coverage
yarn test:e2e             # Playwright end-to-end tests

# Build
yarn build:backend        # build backend only
yarn build:all            # build all packages
yarn build-image          # build Docker image (multi-arch via buildx)
```

## Architecture

**Backstage monorepo** with two packages and no custom plugins yet:

- `packages/app` — React 18 frontend (Material-UI v4, React Router v6)
- `packages/backend` — Node.js backend using Backstage's new backend system (`createBackend()`)
- `plugins/` — empty; custom plugins go here when needed

### Backend plugin registration (`packages/backend/src/index.ts`)

All plugins are registered via dynamic import. Notable ones:

| Plugin                                             | Purpose                                                  |
| -------------------------------------------------- | -------------------------------------------------------- |
| `@backstage/plugin-mcp-actions-backend`            | Exposes catalog + scaffolder as MCP tools for AI clients |
| `@immobiliarelabs/backstage-plugin-gitlab-backend` | GitLab REST proxy (self-hosted instance)                 |
| `@roadiehq/backstage-plugin-argo-cd-backend`       | ArgoCD integration                                       |
| `@backstage/plugin-kubernetes-backend`             | Multi-tenant K8s via service accounts                    |
| `@backstage/plugin-search-backend-module-pg`       | PostgreSQL search engine                                 |
| Scaffolder custom module                           | Registers the `fs:append` custom action (see below)      |

### Frontend (`packages/app/src/App.tsx`)

Uses `convertLegacyAppOptions` + `convertLegacyAppRoot` from `@backstage/core-compat-api` to load the new-system `@backstage/plugin-auth` alongside legacy-style plugins. This hybrid mode avoids per-plugin migration while enabling MCP OAuth DCR support.

Sign-in is GitLab OAuth (`gitlabAuthApiRef`).

### Custom scaffolder action

`packages/backend/src/scaffolder/actions/appendFile.ts` implements `fs:append`, which appends UTF-8 content to a file. It exists because Backstage's built-in actions have no append primitive, which is needed for YAML concatenation workflows.

The module is registered via `createBackendModule` + extension points in `packages/backend/src/scaffolder/module.ts`.

### Configuration

Two config layers, merged at startup:

- `app-config.yaml` — local development (PostgreSQL on localhost, local Docker TechDocs builder)
- `app-config.production.yaml` — production overrides (in-cluster K8s, image publisher, etc.)

Key integrations configured there: self-hosted GitLab at `gitlab.home.rottlr.de`, ArgoCD, Kubernetes clusters, catalog discovery (GitLab group `idp`, 5-min polling frequency).

### MCP server

The backend exposes catalog and scaffolder actions as MCP tools at `/api/mcp-actions/v1` (plugin: `@backstage/plugin-mcp-actions-backend`). Authentication uses OAuth Dynamic Client Registration — on first connect a browser login is triggered; token TTL is 1 hour. Respects the same permissions as the web UI.

Local dev auto-config: `.mcp.json` points Claude Code at `http://localhost:7007/api/mcp-actions/v1`.

### CI/CD

`.gitlab-ci.yml` runs four stages: `build → package → deploy:homelab → deploy:development`.

Deployment is GitOps: the `docker` job builds a multi-arch image and the deploy jobs update the image tag in the `idp/platform/idp-portal-deployment` repo.
