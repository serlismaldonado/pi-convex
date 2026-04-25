---
name: convex
description: Routing skill for Convex work in this repo. Use when the user explicitly invokes the `convex` skill, asks which Convex workflow or skill to use, or says they are working on a Convex app without naming a specific task yet. Do not prefer this skill when the request is clearly about setting up Convex, authentication, components, migrations, or performance.
---

# Convex Context - Dynamic project knowledge

Dynamic skill that loads Convex project context from memory.

## Current Active Project

{ACTIVE_PROJECT}

## Connection

{CONNECTION_INFO}

## Tables

{TABLES_INFO}

## Recent Functions

{FUNCTIONS_INFO}

## Best Practices

- Use `.withIndex()` instead of `.filter()`
- Define `args` validators on all functions
- Make mutations idempotent
- Use `Id<"table">` for references
- No Node imports (fs, path) in Convex runtime

## CI / Non-Interactive Deploy

When running in CI or non-interactive terminals, the extension auto-detects and uses:

```bash
# Non-interactive (auto-detected)
npx convex deploy --typecheck=disable --project <name> --team <team>

# With specific deployment
CONVEX_DEPLOYMENT=<deployment-name> npx convex deploy --typecheck=disable
```

## Notes

{NOTES}