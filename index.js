import { Type } from "typebox";
import * as memory from "./memory.js";
let config = { connections: {}, active: null };
let project = null;
const CONFIG_DIR = `${process.env.HOME}/.pi/agent/extensions/pi-convex`;
const CONFIG_PATH = CONFIG_DIR + "/config.json";
const PROJECT_PATH = CONFIG_DIR + "/project.json";
function loadConfig() {
    try {
        const fs = require("fs");
        if (!fs.existsSync(CONFIG_PATH))
            return { connections: {}, active: null };
        const content = fs.readFileSync(CONFIG_PATH, "utf-8");
        return JSON.parse(content);
    }
    catch {
        return { connections: {}, active: null };
    }
}
function saveConfig() {
    const fs = require("fs");
    const fsPromises = fs.promises;
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fsPromises.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
function loadProject() {
    try {
        const fs = require("fs");
        if (!fs.existsSync(PROJECT_PATH))
            return null;
        const content = fs.readFileSync(PROJECT_PATH, "utf-8");
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function saveProject(projectConfig) {
    const fs = require("fs");
    const fsPromises = fs.promises;
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fsPromises.writeFile(PROJECT_PATH, JSON.stringify(projectConfig, null, 2), "utf-8");
}
function findProjectInCwd(cwd) {
    try {
        const fs = require("fs");
        const pathModule = require("path");
        let dir = cwd;
        let maxDepth = 10;
        while (maxDepth > 0) {
            const convexJson = pathModule.join(dir, "convex.json");
            const packageJson = pathModule.join(dir, "package.json");
            if (fs.existsSync(convexJson) && fs.existsSync(packageJson)) {
                const name = pathModule.basename(dir);
                return { path: dir, name };
            }
            const parent = pathModule.dirname(dir);
            if (parent === dir)
                break;
            dir = parent;
            maxDepth--;
        }
        return null;
    }
    catch {
        return null;
    }
}
function getActiveConnection() {
    if (!config.active || !config.connections[config.active]) {
        return null;
    }
    return config.connections[config.active] || null;
}
function getApiUrl() {
    const conn = getActiveConnection();
    if (!conn)
        return "";
    if (conn.type === "local") {
        return conn.url;
    }
    return conn.url + "/api";
}
function isInteractive() {
    return process.stdin.isTTY === true;
}
function buildDeployCommand(projectName, teamName) {
    if (!isInteractive()) {
        const env = {};
        let cmd = "npx convex deploy --typecheck=disable";
        if (teamName) {
            cmd += ` --project ${projectName} --team ${teamName}`;
        }
        return { cmd, env };
    }
    return { cmd: "npx convex dev", env: {} };
}
function execCommand(cmd, cwd, signal, env) {
    return new Promise((resolve) => {
        const child = require("child_process");
        // Inject auth env vars if configured
        const conn = getActiveConnection();
        const baseEnv = {};
        for (const [k, v] of Object.entries(process.env)) {
            if (v !== undefined)
                baseEnv[k] = v;
        }
        const spawnEnv = { ...baseEnv };
        if (conn?.authType === "anonymous") {
            spawnEnv.CONVEX_AGENT_MODE = "anonymous";
        }
        else if (conn?.authType === "deploy_key" && conn.deployKey) {
            spawnEnv.CONVEX_DEPLOY_KEY = conn.deployKey;
        }
        // Merge custom env
        Object.assign(spawnEnv, env);
        const proc = child.spawn("bash", ["-c", cmd], { cwd, env: spawnEnv, stdio: isInteractive() ? undefined : "pipe" });
        let stdout = "";
        let stderr = "";
        if (proc.stdout) {
            proc.stdout.on("data", (data) => { stdout += data.toString(); });
        }
        if (proc.stderr) {
            proc.stderr.on("data", (data) => { stderr += data.toString(); });
        }
        proc.on("close", (code) => {
            resolve({ stdout, stderr, code: code || 0 });
        });
        proc.on("error", (err) => {
            stderr = err.message;
            resolve({ stdout, stderr, code: 1 });
        });
    });
}
export default function (pi) {
    config = loadConfig();
    project = loadProject();
    // ===== SETUP COMMAND =====
    pi.registerCommand("convex-setup", {
        description: "Setup Convex project (ESLint, best practices)",
        async handler(_args, ctx) {
            if (!project) {
                const detected = findProjectInCwd(ctx.cwd);
                if (detected)
                    project = detected;
            }
            if (!project) {
                ctx.ui.notify("No project. Make sure you are in a Convex project directory", "error");
                return;
            }
            const fs = require("fs");
            const fsPromises = fs.promises;
            const steps = [];
            // 1. Install ESLint plugin
            ctx.ui.notify("Installing @convex-dev/eslint-plugin...", "info");
            await execCommand("npm install @convex-dev/eslint-plugin --save-dev", project.path);
            steps.push("Installed @convex-dev/eslint-plugin");
            // 2. Create ESLint config
            const eslintConfig = project.path + "/eslint.convex.mjs";
            if (!fs.existsSync(eslintConfig)) {
                const eslintContent = `import convexPlugin from "@convex-dev/eslint-plugin";

export default [
  {
    files: ["convex/**/*.ts"],
    plugins: { "@convex-dev": convexPlugin },
    rules: {
      "@convex-dev/no-old-registered-function-syntax": "error",
      "@convex-dev/require-args-validator": "error",
      "@convex-dev/explicit-table-ids": "error",
      "@convex-dev/import-wrong-runtime": "error",
      "@convex-dev/no-filter-in-query": "error",
      "@convex-dev/no-collect-in-query": "error",
    },
  },
];
`;
                fs.writeFileSync(eslintConfig, eslintContent);
                steps.push("Created eslint.convex.mjs");
            }
            ctx.ui.notify(`Setup complete! (${steps.length} steps)`, "info");
            ctx.ui.notify(steps.join(", "), "info");
        },
    });
    // ===== INIT COMMAND =====
    pi.registerCommand("convex-init", {
        description: "Create a new Convex project (non-interactive, CI-friendly)",
        async handler(_args, ctx) {
            const isCI = !process.stdin.isTTY;
            if (!ctx.hasUI && !isCI) {
                ctx.ui.notify("Interactive mode required", "error");
                return;
            }
            let projectName;
            let teamName;
            let deploymentType;
            if (isCI) {
                projectName = process.env.CONVEX_PROJECT_NAME || "my-project";
                teamName = process.env.CONVEX_TEAM_NAME || "";
                deploymentType = process.env.CONVEX_DEPLOYMENT_TYPE || "cloud";
                ctx.ui.notify(`[CI] Creating project: ${projectName}`, "info");
            }
            else {
                projectName = await ctx.ui.input("Project name:", ctx.cwd.split("/").pop() || "");
                if (!projectName) {
                    ctx.ui.notify("Project name required", "error");
                    return;
                }
                teamName = await ctx.ui.input("Team name (from convex.cloud, optional):", "");
                const useCloud = await ctx.ui.confirm("Cloud deployment?", "Yes = Convex Cloud, No = local dev server");
                deploymentType = useCloud ? "cloud" : "local";
            }
            const fs = require("fs");
            const targetPath = ctx.cwd;
            if (!fs.existsSync(targetPath)) {
                ctx.ui.notify(`Creating directory: ${targetPath}`, "info");
                fs.mkdirSync(targetPath, { recursive: true });
            }
            const packageJsonPath = require("path").join(targetPath, "package.json");
            if (!fs.existsSync(packageJsonPath)) {
                ctx.ui.notify("Creating package.json...", "info");
                fs.writeFileSync(packageJsonPath, JSON.stringify({
                    name: projectName,
                    version: "0.0.1",
                    private: true,
                    scripts: { dev: "convex dev", deploy: "convex deploy", start: "convex dev" }
                }, null, 2));
            }
            ctx.ui.notify(`Initializing Convex in ${targetPath}...`, "info");
            let cmd = "npx convex dev --configure new --typecheck=disable --once";
            cmd += ` --project ${projectName}`;
            if (teamName)
                cmd += ` --team ${teamName}`;
            if (deploymentType === "cloud")
                cmd += " --dev-deployment cloud";
            const result = await execCommand(cmd, targetPath);
            if (result.code === 0) {
                // Ensure convex is installed
                ctx.ui.notify(`Installing convex dependency...`, "info");
                await execCommand("npm install convex --save", targetPath);
                ctx.ui.notify(`Project ${projectName} created!`, "info");
                project = { path: targetPath, name: projectName };
                saveProject(project);
                if (deploymentType === "cloud" && teamName) {
                    const deploymentUrl = `https://${projectName}.convex.cloud`;
                    config.connections[projectName] = {
                        url: deploymentUrl,
                        deployKey: "",
                        type: "cloud",
                        authType: null
                    };
                    config.active = projectName;
                    saveConfig();
                    ctx.ui.notify(`Connection saved: ${projectName}`, "info");
                }
                memory.updateProjectMemory(projectName, targetPath, config.active || "unknown", {});
                ctx.ui.notify(`Run /convex-status to verify`, "info");
            }
            else {
                ctx.ui.notify(`Error: ${result.stderr || result.stdout}`, "error");
            }
        },
    });
    // ===== CONNECTION COMMANDS =====
    pi.registerCommand("convex-connect", {
        description: "Add or switch to a Convex connection",
        async handler(_args, ctx) {
            if (!ctx.hasUI) {
                ctx.ui.notify("Interactive mode required", "error");
                return;
            }
            const existingNames = Object.keys(config.connections);
            if (existingNames.length > 0) {
                const addNew = await ctx.ui.confirm("Add new connection?", `Existing: ${existingNames.join(", ")}`);
                if (!addNew) {
                    // List existing for selection
                    ctx.ui.notify("Use /convex-connections to see all", "info");
                    return;
                }
            }
            const name = await ctx.ui.input("Connection name:", config.active || "");
            if (!name) {
                ctx.ui.notify("Name required", "error");
                return;
            }
            const type = await ctx.ui.confirm("Is this local development?", "Local (localhost) or Cloud/Self-hosted?");
            const url = await ctx.ui.input("URL:", type ? "http://127.0.0.1:3210" : "https://your-project.convex.cloud");
            if (!url) {
                ctx.ui.notify("URL required", "error");
                return;
            }
            let deployKey = "";
            let authType = null;
            if (!type) {
                // Cloud/Self-hosted - ask for auth type
                const useAnonymous = await ctx.ui.confirm("Use anonymous mode?", "Anonymous = no auth (CI agents). No = use deploy key.");
                if (useAnonymous) {
                    authType = "anonymous";
                }
                else {
                    authType = "deploy_key";
                    ctx.ui.notify("Get deploy key from: https://dashboard.convex.dev", "info");
                    const key = await ctx.ui.input("Deploy key:", "");
                    deployKey = key || "";
                }
            }
            config.connections[name] = {
                url,
                deployKey,
                type: type ? "local" : "cloud",
                authType,
            };
            config.active = name;
            saveConfig();
            ctx.ui.notify(`Connected: ${name} (${type ? "local" : "cloud"})`, "info");
        },
    });
    pi.registerCommand("convex-connections", {
        description: "List all saved Convex connections",
        async handler(_args, ctx) {
            const names = Object.keys(config.connections);
            if (names.length === 0) {
                ctx.ui.notify("No connections. Use /convex-connect", "info");
                return;
            }
            const list = names.map(name => {
                const conn = config.connections[name];
                if (!conn)
                    return `${name}: unknown`;
                const marker = name === config.active ? " *" : "";
                return `${name}${marker}: ${conn.url} (${conn.type})`;
            }).join("\n");
            const info = config.active
                ? `Active: ${config.active}\n\n${list}`
                : `No active connection.\n\n${list}`;
            ctx.ui.notify(info, "info");
        },
    });
    // ===== API TOOLS =====
    pi.registerTool({
        name: "convex_query",
        label: "Convex Query",
        description: "Execute a Convex query via REST API",
        parameters: Type.Object({
            path: Type.String({ description: "Path (e.g., tasks/list)" }),
            args: Type.Optional(Type.String({ description: "Args JSON (optional)" })),
        }),
        async execute(toolCallId, params, signal, onUpdate) {
            const conn = getActiveConnection();
            if (!conn) {
                return {
                    content: [{ type: "text", text: "No connection. Use /convex-connect" }],
                    details: { error: "No active connection" },
                };
            }
            const args = params.args ? JSON.parse(params.args) : {};
            const apiUrl = getApiUrl();
            const fetchOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: conn.deployKey ? `Convex ${conn.deployKey}` : "",
                },
                body: JSON.stringify({ path: params.path, args, format: "json" }),
            };
            if (signal)
                fetchOptions.signal = signal;
            const response = await fetch(`${apiUrl}/query`, fetchOptions);
            const result = await response.json();
            if (result.status === "error") {
                return {
                    content: [{ type: "text", text: `Error: ${result.error}` }],
                    details: { error: result.error },
                    isError: true,
                };
            }
            return {
                content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
                details: result.value,
            };
        },
    });
    pi.registerTool({
        name: "convex_mutation",
        label: "Convex Mutation",
        description: "Execute a Convex mutation via REST API",
        parameters: Type.Object({
            path: Type.String({ description: "Path (e.g., tasks/create)" }),
            args: Type.Optional(Type.String({ description: "Args JSON" })),
        }),
        async execute(toolCallId, params, signal, onUpdate) {
            const conn = getActiveConnection();
            if (!conn) {
                return {
                    content: [{ type: "text", text: "No connection. Use /convex-connect" }],
                    details: { error: "No active connection" },
                };
            }
            const args = params.args ? JSON.parse(params.args) : {};
            const apiUrl = getApiUrl();
            const fetchOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: conn.deployKey ? `Convex ${conn.deployKey}` : "",
                },
                body: JSON.stringify({ path: params.path, args, format: "json" }),
            };
            if (signal)
                fetchOptions.signal = signal;
            const response = await fetch(`${apiUrl}/mutation`, fetchOptions);
            const result = await response.json();
            if (result.status === "error") {
                return {
                    content: [{ type: "text", text: `Error: ${result.error}` }],
                    details: { error: result.error },
                    isError: true,
                };
            }
            return {
                content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
                details: result.value,
            };
        },
    });
    // ===== PROJECT TOOLS =====
    pi.registerTool({
        name: "convex_dev",
        label: "Convex Dev",
        description: "Run npx convex dev (use --once for single deploy)",
        parameters: Type.Object({
            once: Type.Optional(Type.Boolean({ description: "Use --once for single deploy" })),
        }),
        async execute(toolCallId, params, signal, onUpdate, ctx) {
            if (!project) {
                const detected = findProjectInCwd(ctx.cwd);
                if (detected)
                    project = detected;
            }
            if (!project) {
                return {
                    content: [{ type: "text", text: "No project. cd to a Convex project directory." }],
                    details: { error: "No project" },
                };
            }
            const cmd = params.once ? "npx convex dev --once" : "npx convex dev";
            onUpdate?.({ content: [{ type: "text", text: `Running: ${cmd} in ${project.path}` }], details: {} });
            const result = await execCommand(cmd, project.path, signal);
            return {
                content: [{ type: "text", text: result.stdout || result.stderr || "Completed" }],
                details: { code: result.code, stdout: result.stdout, stderr: result.stderr },
                isError: result.code !== 0,
            };
        },
    });
    pi.registerTool({
        name: "convex_deploy",
        label: "Convex Deploy",
        description: "Run npx convex deploy (auto-detects CI/non-interactive environments)",
        parameters: Type.Object({
            projectName: Type.Optional(Type.String({ description: "Project name for CI (optional)" })),
            teamName: Type.Optional(Type.String({ description: "Team name for CI (optional)" })),
        }),
        async execute(toolCallId, params, signal, onUpdate, ctx) {
            if (!project) {
                const detected = findProjectInCwd(ctx.cwd);
                if (detected)
                    project = detected;
            }
            if (!project) {
                return {
                    content: [{ type: "text", text: "No project. cd to a Convex project directory" }],
                    details: { error: "No project" },
                };
            }
            const isCI = !process.stdin.isTTY;
            const projectName = params.projectName || project.name;
            const teamName = params.teamName;
            if (isCI || !ctx.hasUI) {
                onUpdate?.({ content: [{ type: "text", text: `[CI] Deploying in ${project.path} (non-interactive mode)...` }], details: {} });
                let deployCmd = "npx convex deploy --typecheck=disable";
                if (teamName) {
                    deployCmd += ` --project ${projectName} --team ${teamName}`;
                }
                const env = {
                    ...(process.env.CONVEX_DEPLOYMENT ? { CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT } : {}),
                };
                const result = await execCommand(deployCmd, project.path, signal, env);
                return {
                    content: [{ type: "text", text: result.stdout || result.stderr || "Deploy completed" }],
                    details: { code: result.code, stdout: result.stdout, stderr: result.stderr },
                    isError: result.code !== 0,
                };
            }
            onUpdate?.({ content: [{ type: "text", text: `Deploying in ${project.path}...` }], details: {} });
            const result = await execCommand("npx convex deploy", project.path, signal);
            return {
                content: [{ type: "text", text: result.stdout || result.stderr || "Deploy completed" }],
                details: { code: result.code, stdout: result.stdout, stderr: result.stderr },
                isError: result.code !== 0,
            };
        },
    });
    pi.registerTool({
        name: "convex_functions",
        label: "Convex Functions",
        description: "List all functions and save to memory",
        parameters: Type.Object({}),
        async execute(toolCallId, params, signal, onUpdate, ctx) {
            if (!project) {
                const detected = findProjectInCwd(ctx.cwd);
                if (detected)
                    project = detected;
            }
            if (!project) {
                return {
                    content: [{ type: "text", text: "No project. cd to a Convex project directory" }],
                    details: { error: "No project" },
                };
            }
            const result = await execCommand("npx convex function-spec --json 2>/dev/null || npx convex function-spec 2>/dev/null || echo 'Run npx convex function-spec in project'", project.path, signal);
            // Save to memory
            try {
                const spec = JSON.parse(result.stdout);
                const functions = spec.functions?.map((f) => f.identifier) || [];
                const conn = getActiveConnection();
                memory.updateProjectMemory(project.name, project.path, config.active || "unknown", {
                    functions,
                });
                onUpdate?.({ content: [{ type: "text", text: `Found ${functions.length} functions, saved to memory` }], details: {} });
            }
            catch {
                // Not JSON, save raw output
            }
            return {
                content: [{ type: "text", text: result.stdout || "Run npx convex function-spec in project" }],
                details: { stdout: result.stdout, stderr: result.stderr },
                isError: result.code !== 0,
            };
        },
    });
    pi.registerTool({
        name: "convex_status",
        label: "Convex Status",
        description: "Show detailed configuration status",
        parameters: Type.Object({}),
        async execute(toolCallId, params, signal, onUpdate, ctx) {
            if (!project) {
                const detected = findProjectInCwd(ctx.cwd);
                if (detected)
                    project = detected;
            }
            const conn = getActiveConnection();
            const connInfo = conn
                ? `Name: ${config.active}\nURL: ${conn.url}\nType: ${conn.type}\nDeploy Key: ${conn.deployKey ? "Set" : "Not set"}`
                : "Not connected";
            const projectInfo = project
                ? `Name: ${project.name}\nPath: ${project.path}`
                : "Not configured";
            let tablesInfo = "";
            let functionsCount = "";
            if (project) {
                const fs = require("fs");
                const schemaPath = project.path + "/convex/schema.ts";
                if (fs.existsSync(schemaPath)) {
                    const schema = fs.readFileSync(schemaPath, "utf-8");
                    const tables = (schema.match(/defineTable\(/g) || []).length;
                    tablesInfo = `Tables: ${tables}`;
                }
                const convexDir = project.path + "/convex";
                if (fs.existsSync(convexDir)) {
                    const files = fs.readdirSync(convexDir).filter(f => f.endsWith(".ts") && f !== "schema.ts");
                    functionsCount = `Function files: ${files.length}`;
                }
            }
            const status = [
                "=== Convex Status ===",
                "",
                "Connection:",
                connInfo,
                "",
                "Project:",
                projectInfo,
                tablesInfo ? `\nSchema:\n${tablesInfo}` : "",
                functionsCount ? `\n${functionsCount}` : "",
                "",
                "Commands:",
                "/convex-init - Create new project",
                "/convex-connect - Add/switch connection",
                "/convex-connections - List all",
            ].filter(Boolean).join("\n");
            return {
                content: [{ type: "text", text: status }],
                details: { config: conn, project },
            };
        },
    });
    // ===== DASHBOARD =====
    pi.registerTool({
        name: "convex_dashboard",
        label: "Convex Dashboard",
        description: "Open Convex dashboard in browser",
        parameters: Type.Object({}),
        async execute(toolCallId, params, signal, onUpdate) {
            onUpdate?.({ content: [{ type: "text", text: "Opening dashboard..." }], details: {} });
            const conn = getActiveConnection();
            const url = conn?.type === "cloud"
                ? `https://dashboard.convex.dev/deployment/${conn.url.replace("https://", "")}`
                : "https://dashboard.convex.dev";
            require("child_process").spawn("open", [url]);
            return {
                content: [{ type: "text", text: `Opening: ${url}` }],
                details: { url },
            };
        },
    });
    // ===== SCHEMA TOOLS =====
    pi.registerTool({
        name: "convex_schema_validate",
        label: "Convex Schema Validate",
        description: "Analyze schema.ts for best practices",
        parameters: Type.Object({}),
        async execute(toolCallId, params, signal, onUpdate, ctx) {
            if (!project) {
                const detected = findProjectInCwd(ctx.cwd);
                if (detected)
                    project = detected;
            }
            if (!project) {
                return {
                    content: [{ type: "text", text: "No project. cd to a Convex project directory" }],
                    details: { error: "No project" },
                };
            }
            const schemaPath = project.path + "/convex/schema.ts";
            const fs = require("fs");
            if (!fs.existsSync(schemaPath)) {
                return {
                    content: [{ type: "text", text: `Not found: ${schemaPath}` }],
                    details: { error: "Schema not found" },
                    isError: true,
                };
            }
            const schema = fs.readFileSync(schemaPath, "utf-8");
            const issues = [];
            const suggestions = [];
            if (schema.includes(".filter(")) {
                issues.push("Uses .filter() - consider using .withIndex() for better performance");
                suggestions.push("Create indexes in schema: .index('by_field', ['field'])");
            }
            const tableMatches = schema.match(/defineTable\s*\([\s\S]*?\)(?!\s*\.)/g);
            if (tableMatches) {
                for (const _table of tableMatches) {
                    if (!schema.includes(".index(")) {
                        issues.push("Table without indexes defined");
                        break;
                    }
                }
            }
            const result = issues.length > 0 || suggestions.length > 0
                ? "Schema Analysis:\n\n" + issues.join("\n") + "\n\nSuggestions:\n" + suggestions.join("\n")
                : "Schema looks good! No obvious issues detected.";
            return {
                content: [{ type: "text", text: result }],
                details: { issues, suggestions, schemaPath },
            };
        },
    });
    pi.registerTool({
        name: "convex_lint",
        label: "Convex Lint",
        description: "Run ESLint on Convex code (auto-installs @convex-dev/eslint-plugin if needed)",
        parameters: Type.Object({
            path: Type.Optional(Type.String({ description: "Specific path (optional)" })),
        }),
        async execute(toolCallId, params, signal, onUpdate, ctx) {
            if (!project) {
                const detected = findProjectInCwd(ctx.cwd);
                if (detected)
                    project = detected;
            }
            if (!project) {
                return {
                    content: [{ type: "text", text: "No project. cd to a Convex project directory" }],
                    details: { error: "No project" },
                };
            }
            const fs = require("fs");
            const eslintConfig = project.path + "/eslint.convex.mjs";
            const targetPath = params.path
                ? project.path + "/" + params.path
                : project.path + "/convex";
            // Auto-install ESLint plugin if needed
            if (!fs.existsSync(eslintConfig)) {
                onUpdate?.({ content: [{ type: "text", text: "Installing @convex-dev/eslint-plugin..." }], details: {} });
                await execCommand("npm install @convex-dev/eslint-plugin --save-dev", project.path);
                const eslintContent = `import convexPlugin from "@convex-dev/eslint-plugin";

export default [
  {
    files: ["convex/**/*.ts"],
    plugins: { "@convex-dev": convexPlugin },
    rules: {
      "@convex-dev/no-old-registered-function-syntax": "error",
      "@convex-dev/require-args-validator": "error",
      "@convex-dev/explicit-table-ids": "error",
      "@convex-dev/import-wrong-runtime": "error",
      "@convex-dev/no-filter-in-query": "error",
      "@convex-dev/no-collect-in-query": "error",
    },
  },
];
`;
                fs.writeFileSync(eslintConfig, eslintContent);
                onUpdate?.({ content: [{ type: "text", text: "ESLint configured! Running lint..." }], details: {} });
            }
            onUpdate?.({ content: [{ type: "text", text: "Running lint..." }], details: {} });
            const result = await execCommand("npx eslint -c eslint.convex.mjs " + targetPath + " 2>&1", project.path, signal);
            return {
                content: [{ type: "text", text: result.stdout || "Lint completed without errors" }],
                details: { code: result.code, stdout: result.stdout, stderr: result.stderr },
                isError: result.code !== 0,
            };
        },
    });
    pi.registerTool({
        name: "convex_best_practices",
        label: "Convex Best Practices",
        description: "Show Convex best practices summary",
        parameters: Type.Object({}),
        async execute(toolCallId, params, signal, onUpdate) {
            const practices = [
                "=== Convex Best Practices ===",
                "",
                "SCHEMA:",
                "- Use indexes for frequently queried fields",
                "- Name indexes: by_field, by_field1_field2",
                "- Always include _creationTime",
                "",
                "QUERIES:",
                "- Use .withIndex() instead of .filter()",
                "- Use .take(n) to limit large result sets",
                "- Define return validators on all queries",
                "",
                "MUTATIONS:",
                "- Make mutations idempotent (check state before updating)",
                "- Use ConvexError for user-facing errors",
                "- Define args validators on all mutations",
                "",
                "TYPESCRIPT:",
                "- Use Id<\"table\"> for document references",
                "- Use Doc<\"table\"> for full documents",
                "- No Node imports (fs, path) in Convex runtime",
                "",
                "ESLINT:",
                "- npx @convex-dev/eslint-plugin for code validation",
                "- Rules: require-args-validator, no-filter-in-query, explicit-table-ids",
            ].join("\n");
            return {
                content: [{ type: "text", text: practices }],
                details: {},
            };
        },
    });
    // ===== RESOURCES DISCOVERY (Skills) =====
    pi.on("resources_discover", async (_event, _ctx) => {
        const extensionDir = `${process.env.HOME}/.pi/agent/extensions/pi-convex`;
        const skillPath = extensionDir + "/skills/convex";
        // Update skill template with current context
        const activeMemory = memory.getActiveProjectMemory();
        const conn = getActiveConnection();
        const fs = require("fs");
        const skillTemplate = fs.readFileSync(skillPath + "/SKILL.md", "utf-8");
        const updatedSkill = skillTemplate
            .replace("{ACTIVE_PROJECT}", activeMemory ? `${activeMemory.name} (${activeMemory.path})` : "Not set")
            .replace("{CONNECTION_INFO}", conn ? `${config.active} - ${conn.url} (${conn.type})` : "Not connected")
            .replace("{TABLES_INFO}", activeMemory?.tables.length
            ? activeMemory.tables.map((t) => `- ${t}`).join("\n")
            : "No tables discovered yet")
            .replace("{FUNCTIONS_INFO}", activeMemory?.functions.length
            ? activeMemory.functions.slice(0, 10).map((f) => `- ${f}`).join("\n")
            : "No functions discovered yet")
            .replace("{NOTES}", activeMemory?.patterns.length
            ? `Patterns learned:\n${activeMemory.patterns.map((p) => `- ${p}`).join("\n")}`
            : "No patterns learned yet. Run convex_lint to learn.");
        fs.writeFileSync(skillPath + "/SKILL.md", updatedSkill);
        return {
            skillPaths: [skillPath],
        };
    });
    // ===== NOTIFICATIONS ON START =====
    pi.on("session_start", async (_event, ctx) => {
        if (!project) {
            const detected = findProjectInCwd(ctx.cwd);
            if (detected) {
                project = detected;
            }
        }
        const conn = getActiveConnection();
        // Update memory with current project
        if (project && conn) {
            memory.updateProjectMemory(project.name, project.path, config.active || "unknown", {});
        }
        if (conn && project) {
            ctx.ui.notify(`Convex: ${config.active} | ${project.name}`, "info");
        }
        else if (conn) {
            ctx.ui.notify(`Convex: ${config.active}. cd to project dir`, "info");
        }
        else if (project) {
            ctx.ui.notify(`Project: ${project.name}. Run /convex-connect`, "info");
        }
        else {
            ctx.ui.notify("Convex: Run /convex-connect to start", "info");
        }
    });
}
//# sourceMappingURL=index.js.map