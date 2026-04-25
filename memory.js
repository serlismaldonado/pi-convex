// Memory module for pi-convex extension
// Stores learned information about Convex projects
const MEMORY_PATH = `${process.env.HOME}/.pi/agent/extensions/pi-convex/memory.json`;
export function loadMemory() {
    try {
        const fs = require("fs");
        if (!fs.existsSync(MEMORY_PATH)) {
            return { projects: {}, activeProject: null };
        }
        const content = fs.readFileSync(MEMORY_PATH, "utf-8");
        return JSON.parse(content);
    }
    catch {
        return { projects: {}, activeProject: null };
    }
}
export function saveMemory(memory) {
    const fs = require("fs");
    const fsPromises = fs.promises;
    const dir = `${process.env.HOME}/.pi/agent/extensions/pi-convex`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fsPromises.writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2), "utf-8");
}
export function updateProjectMemory(projectName, projectPath, connection, updates) {
    const memory = loadMemory();
    if (!memory.projects[projectName]) {
        memory.projects[projectName] = {
            name: projectName,
            path: projectPath,
            connection,
            tables: [],
            functions: [],
            patterns: [],
            lastUpdated: new Date().toISOString(),
        };
    }
    if (updates.tables) {
        memory.projects[projectName].tables = updates.tables;
    }
    if (updates.functions) {
        memory.projects[projectName].functions = updates.functions;
    }
    if (updates.patterns) {
        memory.projects[projectName].patterns = updates.patterns;
    }
    memory.projects[projectName].lastUpdated = new Date().toISOString();
    memory.activeProject = projectName;
    saveMemory(memory);
}
export function getProjectContext(projectName) {
    const memory = loadMemory();
    const project = memory.projects[projectName];
    if (!project) {
        return "No memory for this project yet.";
    }
    let context = `# ${project.name}\n`;
    context += `Path: ${project.path}\n`;
    context += `Connection: ${project.connection}\n`;
    context += `Last updated: ${project.lastUpdated}\n\n`;
    if (project.tables.length > 0) {
        context += `## Tables\n${project.tables.map(t => `- ${t}`).join("\n")}\n\n`;
    }
    if (project.functions.length > 0) {
        context += `## Functions\n${project.functions.slice(0, 20).map(f => `- ${f}`).join("\n")}\n`;
        if (project.functions.length > 20) {
            context += `... and ${project.functions.length - 20} more\n`;
        }
        context += "\n";
    }
    if (project.patterns.length > 0) {
        context += `## Learned Patterns\n${project.patterns.map(p => `- ${p}`).join("\n")}\n`;
    }
    return context;
}
export function getActiveProjectMemory() {
    const memory = loadMemory();
    if (!memory.activeProject)
        return null;
    return memory.projects[memory.activeProject] || null;
}
export function addPattern(projectName, pattern) {
    const memory = loadMemory();
    if (!memory.projects[projectName])
        return;
    if (!memory.projects[projectName].patterns.includes(pattern)) {
        memory.projects[projectName].patterns.push(pattern);
        saveMemory(memory);
    }
}
//# sourceMappingURL=memory.js.map