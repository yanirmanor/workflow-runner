import { BrowserWindow } from 'electron';
import { IPC } from '../shared/ipc-channels';
import { ExecutionEngine } from '../shared/execution-engine';
import type { StageEntry } from '../shared/topological-sort';

export class ScriptExecutor {
  private engine: ExecutionEngine;

  constructor(private window: BrowserWindow) {
    this.engine = new ExecutionEngine();

    this.engine.on('log', (data) => {
      if (!this.window.isDestroyed()) {
        this.window.webContents.send(IPC.EXEC_LOG, data);
      }
    });

    this.engine.on('nodeStatus', (data) => {
      if (!this.window.isDestroyed()) {
        this.window.webContents.send(IPC.EXEC_NODE_STATUS, data);
      }
    });

    this.engine.on('portDetected', (data) => {
      if (!this.window.isDestroyed()) {
        this.window.webContents.send(IPC.EXEC_PORT_DETECTED, data);
      }
    });
  }

  async runNodeScripts(nodeId: string, projectPath: string, scripts: string[]): Promise<boolean> {
    return this.engine.runNodeScripts(nodeId, projectPath, scripts);
  }

  async runStages(stages: StageEntry[][]): Promise<boolean> {
    return this.engine.runStages(stages);
  }

  stop() {
    this.engine.stop();
  }

  stopNode(nodeId: string) {
    this.engine.stopNode(nodeId);
  }
}
