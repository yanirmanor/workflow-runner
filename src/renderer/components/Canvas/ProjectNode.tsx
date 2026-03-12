import { memo } from 'react';
import { Handle, Position, NodeResizeControl } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Play, Square, Trash2, GripVertical, GitBranch, Globe } from 'lucide-react';
import type { ProjectNodeData } from '../../types';

const statusColors: Record<ProjectNodeData['status'], string> = {
  idle: 'border-gray-600',
  running: 'border-blue-500 node-running',
  success: 'border-green-500',
  error: 'border-red-500',
};

const statusDots: Record<ProjectNodeData['status'], string> = {
  idle: 'bg-gray-500',
  running: 'bg-blue-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

function ProjectNodeComponent({ id, data }: NodeProps & { data: ProjectNodeData }) {
  const scripts = Object.keys(data.scripts);
  const borderColor = statusColors[data.status];
  const dotColor = statusDots[data.status];

  const handleScriptToggle = (scriptName: string) => {
    const event = new CustomEvent('workflow:scriptToggle', { detail: { nodeId: id, scriptName } });
    window.dispatchEvent(event);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('workflow:deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  const handleRunNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('workflow:runNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  const handleStopNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const event = new CustomEvent('workflow:stopNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Bottom-right corner resize grip */}
      <NodeResizeControl
        minWidth={180}
        minHeight={80}
        position="bottom-right"
        style={{
          background: 'transparent',
          border: 'none',
          width: 14,
          height: 14,
          right: 2,
          bottom: 2,
          cursor: 'nwse-resize',
        }}
      >
        <GripVertical size={12} className="text-gray-500 rotate-[-45deg]" />
      </NodeResizeControl>

      <div className={`bg-gray-800 rounded-lg border-2 ${borderColor} shadow-lg w-full h-full flex flex-col overflow-hidden`}>
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-400 !border-gray-700" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-400 !border-gray-700" />

        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 shrink-0">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-semibold text-gray-100 truncate flex-1">{data.projectName}</span>
          <div className="flex items-center gap-0.5 nodrag nopan">
            {data.status === 'running' ? (
              <button onClick={handleStopNode} className="p-0.5 text-red-400 hover:text-red-300" title="Stop">
                <Square size={12} />
              </button>
            ) : (
              <button
                onClick={handleRunNode}
                className="p-0.5 text-green-400 hover:text-green-300"
                title="Run this node"
              >
                <Play size={12} />
              </button>
            )}
            <button onClick={handleDelete} className="p-0.5 text-gray-400 hover:text-red-400" title="Remove">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className="px-3 py-2 space-y-1 nodrag overflow-y-auto flex-1 min-h-0">
          {scripts.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No scripts</p>
          ) : (
            scripts.map((script) => (
              <label key={script} className="flex items-center gap-2 text-xs cursor-pointer hover:text-gray-200">
                <input
                  type="checkbox"
                  checked={data.selectedScripts.includes(script)}
                  onChange={() => handleScriptToggle(script)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="truncate text-gray-300">{script}</span>
              </label>
            ))
          )}
        </div>

        <div className="px-3 py-1.5 border-t border-gray-700 shrink-0 space-y-1">
          {data.ports && data.ports.length > 0 && (
            <span
              className="inline-flex items-center gap-1 max-w-full px-1.5 py-0.5 rounded-full bg-green-900/40 text-green-300 text-[10px]"
              title={data.ports.map((p) => `:${p}`).join(', ')}
            >
              <Globe size={10} className="shrink-0" />
              <span className="truncate">
                {data.ports.length <= 3
                  ? data.ports.map((p) => `:${p}`).join(', ')
                  : `${data.ports.slice(0, 2).map((p) => `:${p}`).join(', ')} +${data.ports.length - 2}`}
              </span>
            </span>
          )}
          {data.gitBranch && (
            <span
              className="inline-flex items-center gap-1 max-w-full px-1.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 text-[10px]"
              title={data.gitBranch}
            >
              <GitBranch size={10} className="shrink-0" />
              <span className="truncate">{data.gitBranch}</span>
            </span>
          )}
          <p className="text-[10px] text-gray-500 truncate" title={data.projectPath}>
            {data.projectPath}
          </p>
        </div>
      </div>
    </>
  );
}

export const ProjectNode = memo(ProjectNodeComponent);
