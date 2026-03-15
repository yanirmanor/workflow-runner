import { spawn, ChildProcess, execFileSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { StageEntry } from './topological-sort';

function getShellEnv(): NodeJS.ProcessEnv {
  if (process.platform !== 'darwin') return process.env;
  try {
    const shell = process.env.SHELL || '/bin/zsh';
    const path = execFileSync(shell, ['-ilc', 'echo $PATH'], {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return { ...process.env, PATH: path };
  } catch {
    return process.env;
  }
}

const shellEnv = getShellEnv();

const PORT_REGEX = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|Local:\s*https?:\/\/[^:]+):(\d{3,5})|(?:port\s+)(\d{3,5})/gi;

export function killProcessTree(pid: number) {
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

export function killPort(port: number) {
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

interface RunningProcess {
  process: ChildProcess;
  nodeId: string;
}

export class ExecutionEngine extends EventEmitter {
  private processes: Map<string, RunningProcess[]> = new Map();
  private nodePorts: Map<string, Set<number>> = new Map();
  private stoppedNodes: Set<string> = new Set();
  private aborted = false;

  private setNodeStatus(nodeId: string, status: 'idle' | 'running' | 'success' | 'error') {
    this.emit('nodeStatus', { nodeId, status });
  }

  private log(nodeId: string, stream: 'stdout' | 'stderr', data: string) {
    this.emit('log', { nodeId, stream, data, timestamp: Date.now() });
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
        this.emit('portDetected', { nodeId, port });
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
      if (this.aborted || this.stoppedNodes.has(nodeId)) {
        if (!this.stoppedNodes.has(nodeId)) {
          this.setNodeStatus(nodeId, 'error');
        }
        return false;
      }

      this.log(nodeId, 'stdout', `\n> npm run ${script}\n`);

      const success = await new Promise<boolean>((resolve) => {
        const child = spawn('npm', ['run', script], {
          cwd: projectPath,
          shell: true,
          detached: true,
          env: { ...shellEnv, FORCE_COLOR: '1' },
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
        if (!this.aborted && !this.stoppedNodes.has(nodeId)) {
          this.setNodeStatus(nodeId, 'error');
        }
        return false;
      }
    }

    this.setNodeStatus(nodeId, 'success');
    return true;
  }

  async runStages(stages: StageEntry[][]): Promise<boolean> {
    this.aborted = false;

    for (let i = 0; i < stages.length; i++) {
      if (this.aborted) return false;

      this.emit('stageStart', { stageIndex: i, totalStages: stages.length, nodes: stages[i] });

      const results = await Promise.all(
        stages[i].map((node) => this.runNodeScripts(node.nodeId, node.projectPath, node.scripts))
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
    this.stoppedNodes.add(nodeId);
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
