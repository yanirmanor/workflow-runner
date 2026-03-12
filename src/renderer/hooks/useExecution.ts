import { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, ProjectNodeData } from '../types';

export interface PortNotification {
  nodeId: string;
  port: number;
  timestamp: number;
}

export function useExecution() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, ProjectNodeData['status']>>(new Map());
  const [running, setRunning] = useState(false);
  const [portNotifications, setPortNotifications] = useState<PortNotification[]>([]);
  const cleanupRefs = useRef<(() => void)[]>([]);

  useEffect(() => {
    const unsub1 = window.electronAPI.onExecLog((log) => {
      setLogs((prev) => [...prev, log as LogEntry]);
    });

    const unsub2 = window.electronAPI.onNodeStatus((data) => {
      const { nodeId, status } = data as { nodeId: string; status: ProjectNodeData['status'] };
      setNodeStatuses((prev) => {
        const next = new Map(prev);
        next.set(nodeId, status);
        return next;
      });
      if (status === 'running') setRunning(true);
    });

    const unsub3 = window.electronAPI.onExecComplete(() => {
      setRunning(false);
    });

    const unsub4 = window.electronAPI.onPortDetected((data) => {
      const { nodeId, port } = data as { nodeId: string; port: number };
      setPortNotifications((prev) => [...prev, { nodeId, port, timestamp: Date.now() }]);
    });

    cleanupRefs.current = [unsub1, unsub2, unsub3, unsub4];

    return () => {
      cleanupRefs.current.forEach((fn) => fn());
    };
  }, []);

  const dismissPortNotification = useCallback((timestamp: number) => {
    setPortNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  }, []);

  const startWorkflow = useCallback(async (workflowId: string) => {
    setLogs([]);
    setNodeStatuses(new Map());
    setPortNotifications([]);
    setRunning(true);
    await window.electronAPI.execStart(workflowId);
  }, []);

  const stopWorkflow = useCallback(async () => {
    await window.electronAPI.execStop();
    setRunning(false);
    setPortNotifications([]);
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
    startWorkflow,
    stopWorkflow,
    runNode,
    clearLogs,
    dismissPortNotification,
  };
}
