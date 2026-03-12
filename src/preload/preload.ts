import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';

contextBridge.exposeInMainWorld('electronAPI', {
  pickFolder: () => ipcRenderer.invoke(IPC.FOLDER_PICK),
  scanFolder: (folderPath: string) => ipcRenderer.invoke(IPC.FOLDER_SCAN, folderPath),
  getRootFolder: () => ipcRenderer.invoke(IPC.FOLDER_GET_ROOT),
  setRootFolder: (folderPath: string) => ipcRenderer.invoke(IPC.FOLDER_SET_ROOT, folderPath),

  getAllWorkflows: () => ipcRenderer.invoke(IPC.WORKFLOW_GET_ALL),
  getWorkflow: (id: string) => ipcRenderer.invoke(IPC.WORKFLOW_GET, id),
  createWorkflow: (workflow: { name: string; nodes: unknown[]; edges: unknown[] }) =>
    ipcRenderer.invoke(IPC.WORKFLOW_CREATE, workflow),
  updateWorkflow: (workflow: unknown) => ipcRenderer.invoke(IPC.WORKFLOW_UPDATE, workflow),
  deleteWorkflow: (id: string) => ipcRenderer.invoke(IPC.WORKFLOW_DELETE, id),

  exportWorkflow: (data: { name: string; nodes: unknown[]; edges: unknown[] }) =>
    ipcRenderer.invoke(IPC.WORKFLOW_EXPORT, data),
  importWorkflow: () => ipcRenderer.invoke(IPC.WORKFLOW_IMPORT),

  execStart: (workflowId: string) => ipcRenderer.invoke(IPC.EXEC_START, workflowId),
  execStop: (nodeId?: string) => ipcRenderer.invoke(IPC.EXEC_STOP, nodeId),
  execRunNode: (workflowId: string, nodeId: string) =>
    ipcRenderer.invoke(IPC.EXEC_RUN_NODE, workflowId, nodeId),

  onExecLog: (callback: (log: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, log: unknown) => callback(log);
    ipcRenderer.on(IPC.EXEC_LOG, handler);
    return () => ipcRenderer.removeListener(IPC.EXEC_LOG, handler);
  },
  onNodeStatus: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(IPC.EXEC_NODE_STATUS, handler);
    return () => ipcRenderer.removeListener(IPC.EXEC_NODE_STATUS, handler);
  },
  onPortDetected: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(IPC.EXEC_PORT_DETECTED, handler);
    return () => ipcRenderer.removeListener(IPC.EXEC_PORT_DETECTED, handler);
  },
  onExecComplete: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(IPC.EXEC_COMPLETE, handler);
    return () => ipcRenderer.removeListener(IPC.EXEC_COMPLETE, handler);
  },
});
