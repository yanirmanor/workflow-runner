import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { IPC } from '../shared/ipc-channels';
import * as storage from './storage';
import { scanFolder } from './folder-scanner';
import { ScriptExecutor } from './script-executor';

function topologicalSort(
  nodes: { id: string; data: { projectPath: string; selectedScripts: string[] } }[],
  edges: { source: string; target: string }[]
): { nodeId: string; projectPath: string; scripts: string[] }[][] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const stages: { nodeId: string; projectPath: string; scripts: string[] }[][] = [];
  const remaining = new Set(nodes.map((n) => n.id));

  while (remaining.size > 0) {
    const stage = Array.from(remaining).filter((id) => (inDegree.get(id) || 0) === 0);
    if (stage.length === 0) throw new Error('Cycle detected in workflow graph');

    stages.push(
      stage.map((id) => {
        const node = nodes.find((n) => n.id === id)!;
        return {
          nodeId: id,
          projectPath: node.data.projectPath,
          scripts: node.data.selectedScripts || [],
        };
      })
    );

    for (const id of stage) {
      remaining.delete(id);
      for (const target of adj.get(id) || []) {
        inDegree.set(target, (inDegree.get(target) || 0) - 1);
      }
    }
  }

  return stages;
}

let executor: ScriptExecutor | null = null;

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle(IPC.FOLDER_PICK, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(IPC.FOLDER_SCAN, (_event, folderPath: string) => {
    return scanFolder(folderPath);
  });

  ipcMain.handle(IPC.FOLDER_GET_ROOT, () => {
    return storage.getSettings().rootFolder;
  });

  ipcMain.handle(IPC.FOLDER_SET_ROOT, (_event, folderPath: string) => {
    const settings = storage.getSettings();
    settings.rootFolder = folderPath;
    storage.saveSettings(settings);
  });

  ipcMain.handle(IPC.WORKFLOW_GET_ALL, () => {
    return storage.getAllWorkflows();
  });

  ipcMain.handle(IPC.WORKFLOW_GET, (_event, id: string) => {
    return storage.getWorkflow(id);
  });

  ipcMain.handle(IPC.WORKFLOW_CREATE, (_event, data: { name: string; nodes: unknown[]; edges: unknown[] }) => {
    return storage.createWorkflow(data);
  });

  ipcMain.handle(IPC.WORKFLOW_UPDATE, (_event, workflow: storage.StoredWorkflow) => {
    return storage.updateWorkflow(workflow);
  });

  ipcMain.handle(IPC.WORKFLOW_DELETE, (_event, id: string) => {
    storage.deleteWorkflow(id);
  });

  ipcMain.handle(IPC.WORKFLOW_EXPORT, async (_event, data: { name: string; nodes: unknown[]; edges: unknown[] }) => {
    const sanitizedNodes = (data.nodes as Record<string, unknown>[]).map((node) => {
      const n = { ...node, data: { ...(node.data as Record<string, unknown>) } };
      delete n.data.status;
      delete n.data.ports;
      return n;
    });

    const exportData = {
      formatVersion: 1,
      name: data.name,
      nodes: sanitizedNodes,
      edges: data.edges,
    };

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${data.name}.workflow.json`,
      filters: [{ name: 'Workflow', extensions: ['workflow.json'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return { success: true, filePath: result.filePath };
  });

  ipcMain.handle(IPC.WORKFLOW_IMPORT, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'Workflow', extensions: ['workflow.json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Invalid workflow file: nodes and edges must be arrays');
    }

    const warnings: string[] = [];
    const nodes = (parsed.nodes as Record<string, unknown>[]).map((node) => {
      const data = node.data as Record<string, unknown>;
      if (data.projectPath && !fs.existsSync(data.projectPath as string)) {
        warnings.push(`Project path not found: ${data.projectPath}`);
      }
      return {
        ...node,
        data: {
          ...data,
          status: 'idle',
          ports: undefined,
        },
      };
    });

    const name = (parsed.name || 'Untitled') + ' (imported)';
    const workflow = storage.createWorkflow({ name, nodes, edges: parsed.edges });

    return { workflow, warnings };
  });

  ipcMain.handle(IPC.EXEC_START, async (_event, workflowId: string) => {
    const workflow = storage.getWorkflow(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    executor = new ScriptExecutor(mainWindow);

    try {
      const stages = topologicalSort(
        workflow.nodes as { id: string; data: { projectPath: string; selectedScripts: string[] } }[],
        workflow.edges as { source: string; target: string }[]
      );

      const success = await executor.runStages(stages);
      mainWindow.webContents.send(IPC.EXEC_COMPLETE, { workflowId, success });
    } catch (err) {
      mainWindow.webContents.send(IPC.EXEC_COMPLETE, {
        workflowId,
        success: false,
        error: (err as Error).message,
      });
    }
  });

  ipcMain.handle(IPC.EXEC_STOP, (_event, nodeId?: string) => {
    if (nodeId) {
      executor?.stopNode(nodeId);
    } else {
      executor?.stop();
    }
  });

  ipcMain.handle(IPC.EXEC_RUN_NODE, async (_event, workflowId: string, nodeId: string) => {
    const workflow = storage.getWorkflow(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const node = (workflow.nodes as { id: string; data: { projectPath: string; selectedScripts: string[] } }[]).find(
      (n) => n.id === nodeId
    );
    if (!node) throw new Error(`Node ${nodeId} not found`);

    executor = new ScriptExecutor(mainWindow);
    const success = await executor.runNodeScripts(nodeId, node.data.projectPath, node.data.selectedScripts || []);
    mainWindow.webContents.send(IPC.EXEC_COMPLETE, { workflowId, success });
  });
}
