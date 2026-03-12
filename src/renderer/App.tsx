import { useState, useCallback, useEffect } from 'react';
import type { Edge } from '@xyflow/react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { Toolbar } from './components/Toolbar/Toolbar';
import { ConsolePanel } from './components/Console/ConsolePanel';
import { PortToast } from './components/Notifications/PortToast';
import { ErrorToast } from './components/Notifications/ErrorToast';
import { useProjects } from './hooks/useProjects';
import { useWorkflows } from './hooks/useWorkflows';
import { useExecution } from './hooks/useExecution';
import { useResizable } from './hooks/useResizable';
import type { ProjectNodeType, ProjectInfo } from './types';
import { hasCycle } from './lib/topological-sort';

export default function App() {
  const { rootFolder, projects, loading, pickFolder, rescan } = useProjects();
  const { workflows, activeWorkflow, createWorkflow, openWorkflow, saveWorkflow, deleteWorkflow, renameWorkflow } =
    useWorkflows();
  const { logs, nodeStatuses, running, portNotifications, nodePorts, errorNotifications, startWorkflow, stopWorkflow, runNode, clearLogs, dismissPortNotification, dismissErrorNotification } = useExecution();

  const sidebar = useResizable({ direction: 'horizontal', initialSize: 260, minSize: 180, maxSize: 500 });
  const console_ = useResizable({ direction: 'vertical', initialSize: 200, minSize: 80, maxSize: 600, reverse: true });

  const [nodes, setNodes] = useState<ProjectNodeType[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [cycleWarning, setCycleWarning] = useState(false);

  const handleOpenWorkflow = useCallback(
    async (id: string) => {
      if (activeWorkflow && (nodes.length > 0 || edges.length > 0)) {
        await saveWorkflow(nodes, edges);
      }
      await openWorkflow(id);
    },
    [activeWorkflow, nodes, edges, saveWorkflow, openWorkflow]
  );

  useEffect(() => {
    if (activeWorkflow) {
      setNodes(activeWorkflow.nodes || []);
      setEdges(activeWorkflow.edges || []);
    }
  }, [activeWorkflow]);

  const handleNodesChange = useCallback((newNodes: ProjectNodeType[]) => {
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback(
    (newEdges: Edge[]) => {
      setEdges(newEdges);
      setCycleWarning(hasCycle(nodes, newEdges));
    },
    [nodes]
  );

  const handleSave = useCallback(async () => {
    await saveWorkflow(nodes, edges);
  }, [saveWorkflow, nodes, edges]);

  const handleRun = useCallback(async () => {
    if (!activeWorkflow) return;
    await saveWorkflow(nodes, edges);
    await startWorkflow(activeWorkflow.id);
  }, [activeWorkflow, saveWorkflow, nodes, edges, startWorkflow]);

  const handleRunNode = useCallback(
    async (nodeId: string) => {
      if (!activeWorkflow) return;
      await saveWorkflow(nodes, edges);
      await runNode(activeWorkflow.id, nodeId);
    },
    [activeWorkflow, saveWorkflow, nodes, edges, runNode]
  );

  const handleStopNode = useCallback(async (nodeId: string) => {
    await window.electronAPI.execStop(nodeId);
  }, []);

  const handleDropProject = useCallback(
    (project: ProjectInfo, position: { x: number; y: number }) => {
      setNodes((prev) => {
        if (prev.some((n) => n.data.projectPath === project.projectPath)) return prev;
        const newNode: ProjectNodeType = {
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'project',
          position,
          style: { width: 240 },
          data: {
            ...project,
            selectedScripts: [],
            status: 'idle',
          },
        };
        return [...prev, newNode];
      });
    },
    []
  );

  const handleAddProject = useCallback((project: ProjectInfo) => {
    setNodes((prev) => {
      if (prev.some((n) => n.data.projectPath === project.projectPath)) return prev;
      const count = prev.length;
      const newNode: ProjectNodeType = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'project',
        position: { x: 100 + (count % 3) * 300, y: 100 + Math.floor(count / 3) * 200 },
        style: { width: 240 },
        data: {
          ...project,
          selectedScripts: [],
          status: 'idle',
        },
      };
      return [...prev, newNode];
    });
  }, []);

  const handleScriptToggle = useCallback((nodeId: string, scriptName: string) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;
        const selected = node.data.selectedScripts.includes(scriptName)
          ? node.data.selectedScripts.filter((s) => s !== scriptName)
          : [...node.data.selectedScripts, scriptName];
        return { ...node, data: { ...node.data, selectedScripts: selected } };
      })
    );
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    []
  );

  // Merge execution statuses and fresh git branch info into nodes
  const projectBranchMap = new Map(projects.map((p) => [p.projectPath, p.gitBranch]));
  const nodesWithStatus = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      status: nodeStatuses.get(node.id) || node.data.status,
      gitBranch: projectBranchMap.get(node.data.projectPath) ?? node.data.gitBranch ?? null,
      ports: nodePorts.get(node.id) ?? [],
    },
  }));

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          width={sidebar.size}
          onResizeHandle={sidebar.onMouseDown}
          rootFolder={rootFolder}
          projects={projects}
          loading={loading}
          onPickFolder={pickFolder}
          onRescan={rescan}
          onAddProject={handleAddProject}
          workflows={workflows}
          activeWorkflowId={activeWorkflow?.id ?? null}
          onCreateWorkflow={createWorkflow}
          onOpenWorkflow={handleOpenWorkflow}
          onDeleteWorkflow={deleteWorkflow}
          onRenameWorkflow={renameWorkflow}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Toolbar
            activeWorkflow={activeWorkflow}
            running={running}
            cycleWarning={cycleWarning}
            onSave={handleSave}
            onRun={handleRun}
            onStop={stopWorkflow}
            onToggleConsole={() => setConsoleOpen((o) => !o)}
            consoleOpen={consoleOpen}
          />
          <div className="flex-1 relative min-h-0">
            <PortToast notifications={portNotifications} nodes={nodes} onDismiss={dismissPortNotification} />
            <ErrorToast notifications={errorNotifications} nodes={nodes} onDismiss={dismissErrorNotification} />
            {activeWorkflow ? (
              <WorkflowCanvas
                nodes={nodesWithStatus}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onDropProject={handleDropProject}
                onScriptToggle={handleScriptToggle}
                onDeleteNode={handleDeleteNode}
                onRunNode={handleRunNode}
                onStopNode={handleStopNode}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-xl mb-2">No workflow open</p>
                  <p className="text-sm">Create or select a workflow from the sidebar</p>
                </div>
              </div>
            )}
          </div>
          {consoleOpen && (
            <ConsolePanel
              height={console_.size}
              onResizeHandle={console_.onMouseDown}
              logs={logs}
              nodes={nodes}
              onClear={clearLogs}
            />
          )}
        </div>
      </div>
    </div>
  );
}
