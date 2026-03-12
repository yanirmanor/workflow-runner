import { spawn, ChildProcess, execFileSync } from 'node:child_process';
import { BrowserWindow } from 'electron';
import { IPC } from '../shared/ipc-channels';

interface RunningProcess {
  process: ChildProcess;
  nodeId: string;
}

// Matches common dev server port output patterns
const PORT_REGEX = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|Local:\s*https?:\/\/[^:]+):(\d{3,5})|(?:port\s+)(\d{3,5})/gi;

function killProcessTree(pid: number) {
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      execFileSync('pkill', ['-KILL', '-P', String(pid)], { stdio: 'ignore' });
    } catch { /* no children or already dead */ }
    try {
      execFileSync('kill', ['-9', String(pid)], { stdio: 'ignore' });
    } catch { /* already dead */ }
  }
}

function killPort(port: number) {
  try {
    const output = execFileSync('lsof', ['-ti', `:${port}`], { encoding: 'utf-8' }).trim();
    if (output) {
      const pids = output.split('\n').map((p) => p.trim()).filter(Boolean);
      for (const pid of pids) {
        try {
          execFileSync('kill', ['-9', pid], { stdio: 'ignore' });
        } catch { /* already dead */ }
      }
    }
  } catch { /* nothing on that port */ }
}

export class ScriptExecutor {
  private processes: Map<string, RunningProcess[]> = new Map();
  private nodePorts: Map<string, Set<number>> = new Map();
  private aborted = false;

  constructor(private window: BrowserWindow) {}

  private send(channel: string, data: unknown) {
    if (!this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  private setNodeStatus(nodeId: string, status: 'idle' | 'running' | 'success' | 'error') {
    this.send(IPC.EXEC_NODE_STATUS, { nodeId, status });
  }

  private log(nodeId: string, stream: 'stdout' | 'stderr', data: string) {
    this.send(IPC.EXEC_LOG, { nodeId, stream, data, timestamp: Date.now() });
  }

  private detectPorts(nodeId: string, text: string) {
    let match: RegExpExecArray | null;
    PORT_REGEX.lastIndex = 0;
    while ((match = PORT_REGEX.exec(text)) !== null) {
      const port = parseInt(match[1] || match[2], 10);
      if (port < 1024 || port > 65535) continue;

      if (!this.nodePorts.has(nodeId)) this.nodePorts.set(nodeId, new Set());
      const ports = this.nodePorts.get(nodeId)!;
      if (!ports.has(port)) {
        ports.add(port);
        this.send(IPC.EXEC_PORT_DETECTED, { nodeId, port });
      }
    }
  }

  private killNodePorts(nodeId: string) {
    const ports = this.nodePorts.get(nodeId);
    if (!ports) return;
    for (const port of ports) {
      killPort(port);
    }
    this.nodePorts.delete(nodeId);
  }

  async runNodeScripts(nodeId: string, projectPath: string, scripts: string[]): Promise<boolean> {
    this.setNodeStatus(nodeId, 'running');

    for (const script of scripts) {
      if (this.aborted) {
        this.setNodeStatus(nodeId, 'error');
        return false;
      }

      this.log(nodeId, 'stdout', `\n> npm run ${script}\n`);

      const success = await new Promise<boolean>((resolve) => {
        const child = spawn('npm', ['run', script], {
          cwd: projectPath,
          shell: true,
          detached: true,
          env: { ...process.env, FORCE_COLOR: '1' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        if (!this.processes.has(nodeId)) this.processes.set(nodeId, []);
        this.processes.get(nodeId)!.push({ process: child, nodeId });

        child.stdout?.on('data', (data: Buffer) => {
          const text = data.toString();
          this.log(nodeId, 'stdout', text);
          this.detectPorts(nodeId, text);
        });

        child.stderr?.on('data', (data: Buffer) => {
          const text = data.toString();
          this.log(nodeId, 'stderr', text);
          this.detectPorts(nodeId, text);
        });

        child.on('close', (code) => {
          const procs = this.processes.get(nodeId);
          if (procs) {
            const idx = procs.findIndex((p) => p.process === child);
            if (idx >= 0) procs.splice(idx, 1);
          }
          resolve(code === 0);
        });

        child.on('error', (err) => {
          this.log(nodeId, 'stderr', `Error: ${err.message}\n`);
          resolve(false);
        });
      });

      if (!success) {
        if (!this.aborted) {
          this.setNodeStatus(nodeId, 'error');
        }
        return false;
      }
    }

    this.setNodeStatus(nodeId, 'success');
    return true;
  }

  async runStages(stages: { nodeId: string; projectPath: string; scripts: string[] }[][]): Promise<boolean> {
    this.aborted = false;

    for (const stage of stages) {
      if (this.aborted) return false;

      const results = await Promise.all(
        stage.map((node) => this.runNodeScripts(node.nodeId, node.projectPath, node.scripts))
      );

      if (results.some((r) => !r)) {
        this.aborted = true;
        return false;
      }
    }

    return true;
  }

  stop() {
    this.aborted = true;
    for (const [nodeId, procs] of this.processes) {
      for (const { process: child } of procs) {
        if (child.pid) {
          killProcessTree(child.pid);
        }
      }
      this.killNodePorts(nodeId);
      this.log(nodeId, 'stderr', '\n[Stopped]\n');
      this.setNodeStatus(nodeId, 'idle');
    }
    this.processes.clear();
  }

  stopNode(nodeId: string) {
    const procs = this.processes.get(nodeId);
    if (!procs) return;
    for (const { process: child } of procs) {
      if (child.pid) {
        killProcessTree(child.pid);
      }
    }
    this.killNodePorts(nodeId);
    this.log(nodeId, 'stderr', '\n[Stopped]\n');
    this.processes.delete(nodeId);
    this.setNodeStatus(nodeId, 'idle');
  }
}
