import { useState, useEffect, useCallback } from 'react';
import type { Edge } from '@xyflow/react';
import type { Workflow, ProjectNodeType } from '../types';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    window.electronAPI.getAllWorkflows().then(async (all) => {
      if (all.length > 0) {
        setWorkflows(all);
        setActiveWorkflow(all[0] as Workflow);
      } else {
        const wf = await window.electronAPI.createWorkflow({ name: 'Workflow 1', nodes: [], edges: [] });
        setWorkflows([wf as Workflow]);
        setActiveWorkflow(wf as Workflow);
      }
    });
  }, []);

  const createWorkflow = useCallback(async (name: string) => {
    const wf = await window.electronAPI.createWorkflow({ name, nodes: [], edges: [] });
    setWorkflows((prev) => [...prev, wf as Workflow]);
    setActiveWorkflow(wf as Workflow);
    return wf as Workflow;
  }, []);

  const openWorkflow = useCallback(async (id: string) => {
    const wf = await window.electronAPI.getWorkflow(id);
    if (wf) setActiveWorkflow(wf as Workflow);
  }, []);

  const saveWorkflow = useCallback(
    async (nodes: ProjectNodeType[], edges: Edge[]) => {
      if (!activeWorkflow) return;
      const updated = {
        ...activeWorkflow,
        nodes,
        edges,
      };
      const result = await window.electronAPI.updateWorkflow(updated);
      setActiveWorkflow(result as Workflow);
      setWorkflows((prev) => prev.map((w) => (w.id === result.id ? (result as Workflow) : w)));
    },
    [activeWorkflow]
  );

  const deleteWorkflow = useCallback(
    async (id: string) => {
      await window.electronAPI.deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      if (activeWorkflow?.id === id) setActiveWorkflow(null);
    },
    [activeWorkflow]
  );

  const renameWorkflow = useCallback(
    async (id: string, name: string) => {
      const wf = workflows.find((w) => w.id === id);
      if (!wf) return;
      const updated = { ...wf, name };
      const result = await window.electronAPI.updateWorkflow(updated);
      setWorkflows((prev) => prev.map((w) => (w.id === id ? (result as Workflow) : w)));
      if (activeWorkflow?.id === id) setActiveWorkflow(result as Workflow);
    },
    [workflows, activeWorkflow]
  );

  const exportWorkflow = useCallback(
    async (name: string, wfNodes: unknown[], wfEdges: unknown[]) => {
      return window.electronAPI.exportWorkflow({ name, nodes: wfNodes, edges: wfEdges });
    },
    []
  );

  const importWorkflow = useCallback(async () => {
    const result = await window.electronAPI.importWorkflow();
    if (!result) return null;
    const wf = result.workflow as Workflow;
    setWorkflows((prev) => [...prev, wf]);
    setActiveWorkflow(wf);
    return result.warnings;
  }, []);

  return { workflows, activeWorkflow, createWorkflow, openWorkflow, saveWorkflow, deleteWorkflow, renameWorkflow, exportWorkflow, importWorkflow };
}
