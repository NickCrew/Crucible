---
id: TASK-74.6
title: Publish HIPAA Functionality on the GitHub Pages site
status: To Do
assignee: []
created_date: '2026-05-29 00:56'
updated_date: '2026-05-29 00:56'
labels:
  - documentation
  - hipaa
  - compliance
  - pages
dependencies:
  - TASK-74.5
references:
  - docs/user-guides/fedramp.md
  - docs/_data/navigation.yml
  - docs/NAVIGATOR.md
  - docs/user-guides/running-scenarios.md
  - README.md
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
parent_task_id: TASK-74
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Document HIPAA functionality on the Crucible GitHub Pages site once schema, discovery, and reporting behavior are stable enough to describe accurately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A HIPAA Functionality guide explains scope, limitations, metadata fields, discovery filters, report rollups, and evidence export behavior.
- [ ] #2 Pages navigation, README/NAVIGATOR, running-scenarios, CLI, and API client docs link to the HIPAA guide where relevant.
- [ ] #3 Jekyll build and local markdown link checks pass.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Use the FedRAMP guide as the structural template but replace FedRAMP-specific claims with HIPAA-specific scope and limitations.
2. Add navigation and cross-links from existing user guides.
3. Validate local Pages build and links before committing.
<!-- SECTION:PLAN:END -->
