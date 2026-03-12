import type { Node, Edge } from '@xyflow/react';

export interface ProjectInfo {
  projectPath: string;
  projectName: string;
  scripts: Record<string, string>;
}

export interface ProjectNodeData extends ProjectInfo {
  selectedScripts: string[];
  status: 'idle' | 'running' | 'success' | 'error';
  [key: string]: unknown;
}

export type ProjectNodeType = Node<ProjectNodeData, 'project'>;

export interface Workflow {
  id: string;
  name: string;
  nodes: ProjectNodeType[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  nodeId: string;
  stream: 'stdout' | 'stderr';
  data: string;
  timestamp: number;
}

export interface ElectronAPI {
  pickFolder: () => Promise<string | null>;
  scanFolder: (folderPath: string) => Promise<ProjectInfo[]>;
  getRootFolder: () => Promise<string | null>;
  setRootFolder: (folderPath: string) => Promise<void>;

  getAllWorkflows: () => Promise<Workflow[]>;
  getWorkflow: (id: string) => Promise<Workflow | null>;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Workflow>;
  updateWorkflow: (workflow: Workflow) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;

  execStart: (workflowId: string) => Promise<void>;
  execStop: (nodeId?: string) => Promise<void>;
  execRunNode: (workflowId: string, nodeId: string) => Promise<void>;

  onExecLog: (callback: (log: LogEntry) => void) => () => void;
  onNodeStatus: (callback: (data: { nodeId: string; status: ProjectNodeData['status'] }) => void) => () => void;
  onPortDetected: (callback: (data: { nodeId: string; port: number }) => void) => () => void;
  onExecComplete: (callback: (data: { workflowId: string; success: boolean }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
