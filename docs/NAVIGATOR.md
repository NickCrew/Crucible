# Crucible Documentation

## User Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](user-guides/getting-started.md) | Install, configure, and launch Crucible |
| [Running Scenarios](user-guides/running-scenarios.md) | Browse the catalog, run simulations, and review assessments |
| [FedRAMP Functionality](user-guides/fedramp.md) | FedRAMP scenario discovery, assessment rollups, and OSCAL-shaped evidence exports |
| [HIPAA Functionality](user-guides/hipaa.md) | HIPAA scenario discovery, assessment rollups, and technical evidence exports |
| [Editing Scenarios](user-guides/editing-scenarios.md) | Create and modify scenario definitions |
| [API Client Library](user-guides/api-client.md) | Typed TypeScript client for the Crucible REST and WebSocket APIs |
| [CLI Reference](user-guides/cli.md) | Lightweight remote CLI for scripts and CI pipelines |

## Architecture

| Document | Description |
|----------|-------------|
| [System Overview](architecture/system-overview.md) | High-level architecture, component map, and data flow |
| [Scenario Engine](architecture/scenario-engine.md) | Execution model, DAG scheduling, assertions, and WebSocket protocol |

## Reference

| Document | Description |
|----------|-------------|
| [Database Schema](reference/database-schema.md) | `executions` and `execution_steps` tables, invariants, and migration history |
| [REST API](reference/rest-api.md) | REST endpoints for scenarios, executions, reports, and FedRAMP export downloads |

## Development

| Document | Description |
|----------|-------------|
| [Testing Guide](development/testing/testing-guide.md) | Test infrastructure, conventions, mocking patterns, and coverage breakdown |
| [Chimera FedRAMP Contract](development/contracts/chimera-fedramp-openapi-extensions.md) | Consumer expectations for Chimera FedRAMP endpoint annotations |
