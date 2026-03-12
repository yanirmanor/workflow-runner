import { useCallback, useEffect, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type NodeChange,
  type EdgeChange,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { ProjectNode } from './ProjectNode';
import type { ProjectNodeType, ProjectInfo } from '../../types';

const nodeTypes = { project: ProjectNode };

interface WorkflowCanvasProps {
  nodes: ProjectNodeType[];
  edges: Edge[];
  onNodesChange: (nodes: ProjectNodeType[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onDropProject: (project: ProjectInfo, position: { x: number; y: number }) => void;
  onScriptToggle: (nodeId: string, scriptName: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onRunNode: (nodeId: string) => void;
  onStopNode: (nodeId: string) => void;
}

function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onDropProject,
  onScriptToggle,
  onDeleteNode,
  onRunNode,
  onStopNode,
}: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const handleNodesChange = useCallback(
    (changes: NodeChange<ProjectNodeType>[]) => {
      onNodesChange(applyNodeChanges(changes, nodes));
    },
    [nodes, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      onEdgesChange(applyEdgeChanges(changes, edges));
    },
    [edges, onEdgesChange]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      onEdgesChange(addEdge({ ...connection, animated: true }, edges));
    },
    [edges, onEdgesChange]
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/workflow-project');
      if (!raw) return;

      try {
        const project: ProjectInfo = JSON.parse(raw);
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        onDropProject(project, position);
      } catch {
        // invalid data
      }
    },
    [screenToFlowPosition, onDropProject]
  );

  // Custom events from ProjectNode
  useEffect(() => {
    const handleScriptToggle = (e: Event) => {
      const { nodeId, scriptName } = (e as CustomEvent).detail;
      onScriptToggle(nodeId, scriptName);
    };
    const handleDeleteNode = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      onDeleteNode(nodeId);
    };
    const handleRunNode = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      onRunNode(nodeId);
    };
    const handleStopNode = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      onStopNode(nodeId);
    };

    window.addEventListener('workflow:scriptToggle', handleScriptToggle);
    window.addEventListener('workflow:deleteNode', handleDeleteNode);
    window.addEventListener('workflow:runNode', handleRunNode);
    window.addEventListener('workflow:stopNode', handleStopNode);

    return () => {
      window.removeEventListener('workflow:scriptToggle', handleScriptToggle);
      window.removeEventListener('workflow:deleteNode', handleDeleteNode);
      window.removeEventListener('workflow:runNode', handleRunNode);
      window.removeEventListener('workflow:stopNode', handleStopNode);
    };
  }, [onScriptToggle, onDeleteNode, onRunNode, onStopNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      minZoom={0.2}
      maxZoom={2}
      deleteKeyCode="Delete"
      className="bg-gray-950"
    >
      <Background color="#374151" gap={20} />
      <Controls className="!bg-gray-800 !border-gray-700 !rounded-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700" />
      <MiniMap
        className="!bg-gray-900 !border-gray-700 !rounded-lg"
        nodeColor="#4b5563"
        maskColor="rgba(0,0,0,0.5)"
      />
    </ReactFlow>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
