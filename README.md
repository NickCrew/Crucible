# Crucible

Next-generation security testing platform. Crucible provides a scenario catalog, a web-based management UI, and a real-time simulation dashboard for orchestrating security assessment workflows.

## Architecture

```
crucible/
├── packages/catalog        # @crucible/catalog — scenario schemas, validation, and loader
├── apps/web-client         # Next.js 16 web UI (scenarios, assessments, simulations)
└── apps/demo-dashboard     # Express + WebSocket simulation orchestrator
```

| Package | Stack | Description |
|---------|-------|-------------|
| `@crucible/catalog` | TypeScript, Zod | Scenario type definitions, JSON schema validation, runbook parser |
| `web-client` | Next.js 16, React 19, Tailwind 4, Radix UI | Primary web interface for browsing and editing scenarios |
| `@crucible/demo-dashboard` | Express, WebSocket | Real-time scenario execution engine with live dashboard |

## Prerequisites

- **Node.js** 22+
- **pnpm** 9.15.4 (activated via `corepack enable`)

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages (catalog must build before apps that depend on it)
pnpm build

# Run type checks
pnpm type-check

# Run tests
pnpm test
```

### Development Servers

```bash
# Web client (Next.js) — http://localhost:3000
pnpm --filter web-client dev

# Demo dashboard (Express + WS) — http://localhost:3001
pnpm --filter @crucible/demo-dashboard dev
```

## CI/CD

### Pull Request Checks

Every PR to `main` runs build, type-check, and test via [GitHub Actions](.github/workflows/ci.yml).

### Docker Release

Pushing a semver tag triggers a Docker build and push to GitHub Container Registry:

```bash
git tag v0.2.0
git push origin v0.2.0
```

This publishes `ghcr.io/<owner>/crucible/web-client` with tags derived from the version (e.g. `0.2.0`, `0.2`, `latest`).

To run the image locally:

```bash
docker run -p 3000:3000 ghcr.io/<owner>/crucible/web-client:latest
```

## Project Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages (Nx orchestrated) |
| `pnpm test` | Run all test suites |
| `pnpm type-check` | TypeScript type checking across all packages |
| `pnpm lint` | Lint all packages |
