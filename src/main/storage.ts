import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';

const STORAGE_DIR = path.join(app.getPath('home'), '.workflow-runner');

function ensureDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function readJSON<T>(filename: string, fallback: T): T {
  ensureDir();
  const filePath = path.join(STORAGE_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJSON(filename: string, data: unknown) {
  ensureDir();
  const filePath = path.join(STORAGE_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export interface Settings {
  rootFolder: string | null;
}

export function getSettings(): Settings {
  return readJSON<Settings>('settings.json', { rootFolder: null });
}

export function saveSettings(settings: Settings) {
  writeJSON('settings.json', settings);
}

export interface StoredWorkflow {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
  createdAt: string;
  updatedAt: string;
}

export function getAllWorkflows(): StoredWorkflow[] {
  return readJSON<StoredWorkflow[]>('workflows.json', []);
}

export function getWorkflow(id: string): StoredWorkflow | null {
  const workflows = getAllWorkflows();
  return workflows.find((w) => w.id === id) ?? null;
}

export function createWorkflow(data: Omit<StoredWorkflow, 'id' | 'createdAt' | 'updatedAt'>): StoredWorkflow {
  const workflows = getAllWorkflows();
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
}

export function updateWorkflow(workflow: StoredWorkflow): StoredWorkflow {
  const workflows = getAllWorkflows();
  const idx = workflows.findIndex((w) => w.id === workflow.id);
  if (idx === -1) throw new Error(`Workflow ${workflow.id} not found`);
  workflow.updatedAt = new Date().toISOString();
  workflows[idx] = workflow;
  writeJSON('workflows.json', workflows);
  return workflow;
}

export function deleteWorkflow(id: string) {
  const workflows = getAllWorkflows().filter((w) => w.id !== id);
  writeJSON('workflows.json', workflows);
}
