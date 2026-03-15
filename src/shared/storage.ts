import * as fs from 'node:fs';
import * as path from 'node:path';

export interface Settings {
  rootFolder: string | null;
}

export interface StoredWorkflow {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
  createdAt: string;
  updatedAt: string;
}

export function createStorage(homeDir: string) {
  const storageDir = path.join(homeDir, '.workflow-runner');

  function ensureDir() {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  function readJSON<T>(filename: string, fallback: T): T {
    ensureDir();
    const filePath = path.join(storageDir, filename);
    if (!fs.existsSync(filePath)) return fallback;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return fallback;
    }
  }

  function writeJSON(filename: string, data: unknown) {
    ensureDir();
    const filePath = path.join(storageDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  return {
    getSettings(): Settings {
      return readJSON<Settings>('settings.json', { rootFolder: null });
    },

    saveSettings(settings: Settings) {
      writeJSON('settings.json', settings);
    },

    getAllWorkflows(): StoredWorkflow[] {
      return readJSON<StoredWorkflow[]>('workflows.json', []);
    },

    getWorkflow(id: string): StoredWorkflow | null {
      const workflows = this.getAllWorkflows();
      return workflows.find((w) => w.id === id) ?? null;
    },

    createWorkflow(data: Omit<StoredWorkflow, 'id' | 'createdAt' | 'updatedAt'>): StoredWorkflow {
      const workflows = this.getAllWorkflows();
      const now = new Date().toISOString();
      const workflow: StoredWorkflow = {
        ...data,
        id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
      };
      workflows.push(workflow);
      writeJSON('workflows.json', workflows);
      return workflow;
    },

    updateWorkflow(workflow: StoredWorkflow): StoredWorkflow {
      const workflows = this.getAllWorkflows();
      const idx = workflows.findIndex((w) => w.id === workflow.id);
      if (idx === -1) throw new Error(`Workflow ${workflow.id} not found`);
      workflow.updatedAt = new Date().toISOString();
      workflows[idx] = workflow;
      writeJSON('workflows.json', workflows);
      return workflow;
    },

    deleteWorkflow(id: string) {
      const workflows = this.getAllWorkflows().filter((w) => w.id !== id);
      writeJSON('workflows.json', workflows);
    },
  };
}
