# pi-convex

Pi extension for Convex - manage queries, mutations, deployment, and **learns about your project automatically**.

## Quick Start

```bash
pi install npm:pi-convex
```

Then in Pi:

```
1. /convex-connect        # Connect to Convex
2. /convex-project       # Set project path (or auto-detects)
3. convex_deploy         # Deploy!
```

## Setup Flow (First Time)

### 1. Connect to Convex

```
/convex-connect
→ Connection name: my-app
→ Is local? (y/n): n
→ URL: https://xxx.convex.cloud
→ Deploy key: (from dashboard.convex.dev)
```

### 2. Configure Project

```
/convex-project
→ Use detected project? y
```

Or enter path manually: `/convex-project` → `~/projects/my-app`

### 3. First Deploy

**Interactive (local):**
```bash
npx convex dev --configure new --project my-project --team my-team
npx convex deploy
```

**Non-interactive (CI):**
```bash
convex_deploy with {"projectName": "my-project", "teamName": "my-team"}
```

### 4. (Optional) Setup ESLint

```
/convex-setup
convex_functions    # Learn all functions
convex_lint         # Run lint
```

### 5. View Learned Context

```
/skill:convex
```

## CI / Non-Interactive Deploy

The extension auto-detects non-interactive terminals (CI, scripts, etc.) and uses optimal flags:

```bash
# Auto-detected in CI
npx convex deploy --typecheck=disable --project <name> --team <team>

# With specific deployment
CONVEX_DEPLOYMENT=<deployment-name> npx convex deploy --typecheck=disable
```

**Troubleshooting deploy:**
- **ARM64/Android**: Deploy directly to cloud (local dev not supported)
- **Interactive blocked**: Use `convex_deploy` with `projectName` and `teamName`
- **TypeScript errors**: Uses `--typecheck=disable` automatically in CI

## Commands

| Command | Description |
|---------|-------------|
| `/convex-connect` | Add/switch connection |
| `/convex-use` | Switch between connections |
| `/convex-connections` | List all connections |
| `/convex-disconnect` | Remove a connection |
| `/convex-project` | Configure project path |
| `/convex-setup` | Install ESLint plugin |

## Tools

| Tool | Description |
|------|-------------|
| `convex_query` | Execute query: `{"path": "tasks/list"}` |
| `convex_mutation` | Execute mutation: `{"path": "tasks/create", "args": "{\"title\":\"Test\"}"}` |
| `convex_dev` | Run dev server (use `{"once": true}` for single deploy) |
| `convex_deploy` | Deploy to production (auto-detects CI) |
| `convex_functions` | List all functions + save to memory |
| `convex_status` | Show connection and project status |
| `convex_schema_validate` | Analyze schema for best practices |
| `convex_lint` | Run ESLint (auto-installs plugin) |
| `convex_best_practices` | Show Convex best practices |
| `convex_dashboard` | Open dashboard in browser |

## Usage Examples

```bash
# Query all clients
convex_query with {"path": "clients/list"}

# Create a record
convex_mutation with {"path": "tasks/create", "args": "{\"title\":\"New task\"}"}

# Deploy (interactive)
convex_deploy

# Deploy (CI/non-interactive)
convex_deploy with {"projectName": "my-project", "teamName": "my-team"}

# List functions
convex_functions

# Run lint
convex_lint

# Check status
convex_status
```

## Memory

The extension automatically learns:

1. **Tables** - From schema analysis
2. **Functions** - From `convex_functions`
3. **Patterns** - From lint results

Access via `/skill:convex` to see learned context.

## Multiple Connections

```
/convex-connect        # Add new
/convex-use            # Switch
/convex-connections    # List all
/convex-disconnect     # Remove
```

## Files

Settings stored in:
- `~/.pi/agent/extensions/pi-convex/config.json` - Connections
- `~/.pi/agent/extensions/pi-convex/project.json` - Project path
- `~/.pi/agent/extensions/pi-convex/memory.json` - Learned context

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No project" | Run `/convex-project` or cd to project dir |
| "No connection" | Run `/convex-connect` |
| Deploy interactive blocked | Use `convex_deploy` tool with projectName/teamName |
| ARM64 deploy fails | Use `npx convex deploy --typecheck=disable` (no local dev) |
| TypeScript errors | Extension uses `--typecheck=disable` automatically |

## License

MIT