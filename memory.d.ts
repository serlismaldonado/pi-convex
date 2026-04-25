interface ProjectMemory {
    name: string;
    path: string;
    connection: string;
    tables: string[];
    functions: string[];
    patterns: string[];
    lastUpdated: string;
}
interface MemoryStore {
    projects: Record<string, ProjectMemory>;
    activeProject: string | null;
}
export declare function loadMemory(): MemoryStore;
export declare function saveMemory(memory: MemoryStore): void;
export declare function updateProjectMemory(projectName: string, projectPath: string, connection: string, updates: Partial<Pick<ProjectMemory, "tables" | "functions" | "patterns">>): void;
export declare function getProjectContext(projectName: string): string;
export declare function getActiveProjectMemory(): ProjectMemory | null;
export declare function addPattern(projectName: string, pattern: string): void;
export {};
//# sourceMappingURL=memory.d.ts.map