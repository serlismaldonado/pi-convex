---
name: convex
description: Routing skill for Convex work. Use when working with Convex database, backend, or deployment.
---

# Convex

Convex extension for Pi - database, backend, queries, mutations, and deployment.

## Current Project

**Project Path:** `{PROJECT_PATH}`

**IMPORTANT:** Always use `{PROJECT_PATH}` as the base directory for all file operations (read, write, bash with cd, etc.).

Example:
- Correct: `write {PROJECT_PATH}/convex/schema.ts`
- Wrong: `write convex/schema.ts` (relative to wrong cwd)

## Active Project

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
| `/convex-connect` | Connect to existing project |
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

### Convex API (Common Mistakes)

**IMPORTANT - Common errors to avoid:**
- Use `.order("desc")` NOT `.orderBy("field")`
- Import path is `../_generated/server` (one level up from files/)
- Function paths use FULL path: `notes/mutations:create` NOT `notes:create`
- Always verify existing structure before creating files

### General Rules

- Use `.withIndex()` instead of `.filter()`
- Define `args` validators on all functions
- Make mutations idempotent
- Use `Id<"table">` for references
- Use `Doc<"table">` for documents
- No Node imports (fs, path) in Convex runtime
- Always include `_creationTime` in tables

## Deploy

**IMPORTANT:** Always use `convex_dev with {"once": true}` or add `--once` flag to deploy commands. Never run `npx convex dev` without `--once` as it will block in watch mode.

```bash
# Correct (non-blocking)
convex_dev with {"once": true}

# Wrong (blocks in watch mode)
npx convex dev
```

## Quick Actions

```bash
# Query
convex_query with {"path": "table/list"}

# Mutation
convex_mutation with {"path": "table/create", "args": "{\"field\":\"value\"}"}

# Deploy (non-blocking)
convex_dev with {"once": true}

# Lint
convex_lint

# Status
convex_status
```

## Notes

{NOTES}
