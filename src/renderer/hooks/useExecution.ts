import { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, ProjectNodeData } from '../types';

export interface PortNotification {
  nodeId: string;
  port: number;
  timestamp: number;
}

export interface ErrorNotification {
  nodeId: string;
  message: string;
  timestamp: number;
}

export function useExecution() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, ProjectNodeData['status']>>(new Map());
  const [running, setRunning] = useState(false);
  const [portNotifications, setPortNotifications] = useState<PortNotification[]>([]);
  const [nodePorts, setNodePorts] = useState<Map<string, number[]>>(new Map());
  const [errorNotifications, setErrorNotifications] = useState<ErrorNotification[]>([]);
  const cleanupRefs = useRef<(() => void)[]>([]);
  const logsRef = useRef<LogEntry[]>([]);

  const errorCooldownRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const ERROR_PATTERNS = /EADDRINUSE|EACCES|ENOENT|FATAL|app crashed|ERR!|Error:/i;
    const ERROR_COOLDOWN_MS = 10000;

    const unsub1 = window.electronAPI.onExecLog((log) => {
      const entry = log as LogEntry;
      setLogs((prev) => {
        const next = [...prev, entry];
        logsRef.current = next;
        return next;
      });

      if (entry.stream === 'stderr' && ERROR_PATTERNS.test(entry.data)) {
        const lastTime = errorCooldownRef.current.get(entry.nodeId) ?? 0;
        const now = Date.now();
        if (now - lastTime > ERROR_COOLDOWN_MS) {
          errorCooldownRef.current.set(entry.nodeId, now);
          const message = entry.data.trim().split('\n').slice(0, 3).join('\n');
          setErrorNotifications((prev) => [...prev, { nodeId: entry.nodeId, message, timestamp: now }]);
        }
      }
    });

    const unsub2 = window.electronAPI.onNodeStatus((data) => {
      const { nodeId, status } = data as { nodeId: string; status: ProjectNodeData['status'] };
      setNodeStatuses((prev) => {
        const next = new Map(prev);
        next.set(nodeId, status);
        return next;
      });
      if (status === 'running') setRunning(true);
      if (status === 'error') {
        const stderrLines = logsRef.current
          .filter((l) => l.nodeId === nodeId && l.stream === 'stderr')
          .map((l) => l.data.trim())
          .filter(Boolean)
          .slice(-3);
        const message = stderrLines.length > 0
          ? stderrLines.join('\n')
          : 'Script exited with an error';
        setErrorNotifications((prev) => [...prev, { nodeId, message, timestamp: Date.now() }]);
      }
    });

    const unsub3 = window.electronAPI.onExecComplete(() => {
      setRunning(false);
    });

    const unsub4 = window.electronAPI.onPortDetected((data) => {
      const { nodeId, port } = data as { nodeId: string; port: number };
      setPortNotifications((prev) => [...prev, { nodeId, port, timestamp: Date.now() }]);
      setNodePorts((prev) => {
        const next = new Map(prev);
        const ports = next.get(nodeId) ?? [];
        if (!ports.includes(port)) {
          next.set(nodeId, [...ports, port]);
        }
        return next;
      });
    });

    cleanupRefs.current = [unsub1, unsub2, unsub3, unsub4];

    return () => {
      cleanupRefs.current.forEach((fn) => fn());
    };
  }, []);

  const dismissPortNotification = useCallback((timestamp: number) => {
    setPortNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  }, []);

  const dismissErrorNotification = useCallback((timestamp: number) => {
    setErrorNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  }, []);

  const startWorkflow = useCallback(async (workflowId: string) => {
    setLogs([]);
    logsRef.current = [];
    setNodeStatuses(new Map());
    setPortNotifications([]);
    setNodePorts(new Map());
    setErrorNotifications([]);
    setRunning(true);
    await window.electronAPI.execStart(workflowId);
  }, []);

  const stopWorkflow = useCallback(async () => {
    await window.electronAPI.execStop();
    setRunning(false);
    setPortNotifications([]);
    setNodePorts(new Map());
  }, []);

  const runNode = useCallback(async (workflowId: string, nodeId: string) => {
    setRunning(true);
    await window.electronAPI.execRunNode(workflowId, nodeId);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    nodeStatuses,
    running,
    portNotifications,
    nodePorts,
    errorNotifications,
    startWorkflow,
    stopWorkflow,
    runNode,
    clearLogs,
    dismissPortNotification,
    dismissErrorNotification,
  };
}
