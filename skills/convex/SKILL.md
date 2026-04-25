---
name: convex
description: Routing skill for Convex work. Use when working with Convex database, backend, or deployment.
---

# Convex

Convex extension for Pi - database, backend, queries, mutations, and deployment.

## Current Active Project

{ACTIVE_PROJECT}

## Connection

{CONNECTION_INFO}

## Tables

{TABLES_INFO}

## Recent Functions

{FUNCTIONS_INFO}

## Commands

| Command | Use Case |
|---------|----------|
| `/convex-init` | Create new project |
| `/convex-connect` | Connect to project (with deploy key or anonymous) |
| `/convex-project` | Set project path |
| `/convex-use` | Switch between saved connections |
| `/convex-setup` | Install ESLint plugin |

## Auth for CI

### Anonymous Mode (no login required)
```
/convex-connect
→ Use anonymous mode? Yes
```
Sets `CONVEX_AGENT_MODE=anonymous`

### Deploy Key Mode
```
/convex-connect
→ Use anonymous mode? No
→ Deploy key: (paste key)
```

Or via env:
```bash
CONVEX_DEPLOY_KEY='your-key' convex_deploy
```

## Best Practices

- Use `.withIndex()` instead of `.filter()`
- Define `args` validators on all functions
- Make mutations idempotent
- Use `Id<"table">` for references
- Use `Doc<"table">` for documents
- No Node imports (fs, path) in Convex runtime
- Always include `_creationTime` in tables

## Quick Actions

```bash
# Query
convex_query with {"path": "table/list"}

# Mutation
convex_mutation with {"path": "table/create", "args": "{\"field\":\"value\"}"}

# Deploy
convex_deploy

# Lint
convex_lint

# Status
convex_status
```

## Notes

{NOTES}
