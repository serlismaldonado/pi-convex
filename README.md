# pi-convex

Pi extension for Convex - manage queries, mutations, deployment, auth, and **learns about your project automatically**.

## Quick Start

```bash
pi install npm:pi-convex
```

Then in Pi:

```
1. /convex-init           # Create new project OR
1. /convex-connect        # Connect to existing project
2. /convex-auth           # Authenticate (optional - supports anonymous mode)
3. convex_deploy          # Deploy!
```

## Commands

| Command | Description |
|---------|-------------|
| `/convex-init` | Create a new Convex project (non-interactive, CI-friendly) |
| `/convex-connect` | Add/switch connection |
| `/convex-auth` | Authenticate using deploy keys (non-interactive) |
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

## Authentication

### Interactive Mode

```
/convex-auth
→ Use anonymous mode? No
→ Key type: production
→ Deploy key: (paste from dashboard.convex.dev)
```

### Anonymous Mode (CI Agents)

For CI agents that can't authenticate interactively:

```
/convex-auth
→ Use anonymous mode? Yes
```

This sets `CONVEX_AGENT_MODE=anonymous` for all commands.

### CI Mode (Env Vars)

```bash
CONVEX_DEPLOY_KEY='your-key' /convex-auth
```

Or set in environment before running any convex command.

## Create New Project

### Interactive

```
/convex-init
→ Project name: my-app
→ Team name (from convex.cloud): my-team
→ Cloud deployment? Yes
```

### Non-Interactive / CI

```bash
CONVEX_PROJECT_NAME=my-app CONVEX_TEAM_NAME=my-team /convex-init
```

Creates project with:
- `npx convex dev --configure new --typecheck=disable --project <name> --team <team> --dev-deployment cloud`
- Auto-configures as active project
- Auto-saves connection

## Connect to Existing Project

```
/convex-connect
→ Connection name: my-app
→ Is local? No
→ Use anonymous mode? No
→ Deploy key: (from dashboard.convex.dev)
```

## Usage Examples

```bash
# Create new project
/convex-init

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

## CI / Non-Interactive Mode

The extension auto-detects non-interactive terminals (CI, scripts, etc.) and uses optimal flags:

```bash
# Auth via environment
CONVEX_DEPLOY_KEY='your-key' convex_deploy

# Anonymous mode (no auth needed)
CONVEX_AGENT_MODE=anonymous convex_deploy
```

**Key types available:**
- `production` - For production deployments
- `preview` - For preview environments
- `admin` - Full control over deployment

## Memory

The extension automatically learns:

1. **Tables** - From schema analysis
2. **Functions** - From `convex_functions`
3. **Patterns** - From lint results

Access via `/skill:convex` to see learned context.

## Files

Settings stored in:
- `~/.pi/agent/extensions/pi-convex/config.json` - Connections + auth
- `~/.pi/agent/extensions/pi-convex/project.json` - Project path
- `~/.pi/agent/extensions/pi-convex/memory.json` - Learned context

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No project" | Run `/convex-project` or cd to project dir |
| "No connection" | Run `/convex-connect` |
| Auth issues in CI | Use `/convex-auth` or set `CONVEX_DEPLOY_KEY` env var |
| Anonymous mode for CI | `/convex-auth` then "Yes" to anonymous |
| Deploy interactive blocked | Use `convex_deploy` with `projectName` and `teamName` |
| ARM64 deploy fails | Use `npx convex deploy --typecheck=disable` (no local dev) |

## License

MIT
