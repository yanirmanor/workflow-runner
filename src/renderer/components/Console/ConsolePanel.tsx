import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { LogEntry, ProjectNodeType } from '../../types';
import { parseAnsi } from '../../lib/ansi-parse';

interface ConsolePanelProps {
  height: number;
  onResizeHandle: React.MouseEventHandler;
  logs: LogEntry[];
  nodes: ProjectNodeType[];
  onClear: () => void;
}

export function ConsolePanel({ height, onResizeHandle, logs, nodes, onClear }: ConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nodeIds = [...new Set(logs.map((l) => l.nodeId))];

  const filteredLogs = activeTab ? logs.filter((l) => l.nodeId === activeTab) : logs;

  const getNodeName = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.data.projectName || nodeId;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs.length]);

  return (
    <div className="relative bg-gray-900 border-t border-gray-800 flex flex-col flex-shrink-0" style={{ height }}>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeHandle}
        className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors z-10"
      />
      <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab(null)}
          className={`px-2 py-0.5 text-xs rounded whitespace-nowrap transition-colors ${
            activeTab === null ? 'bg-gray-700 text-gray-200' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          All
        </button>
        {nodeIds.map((nodeId) => (
          <button
            key={nodeId}
            onClick={() => setActiveTab(nodeId)}
            className={`px-2 py-0.5 text-xs rounded whitespace-nowrap transition-colors ${
              activeTab === nodeId ? 'bg-gray-700 text-gray-200' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {getNodeName(nodeId)}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={onClear} className="p-1 text-gray-500 hover:text-gray-300" title="Clear">
          <Trash2 size={12} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs leading-relaxed">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-600 italic">No output yet</p>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className={log.stream === 'stderr' ? 'text-red-400' : 'text-gray-300'}>
              {activeTab === null && (
                <span className="text-gray-500 mr-2">[{getNodeName(log.nodeId)}]</span>
              )}
              <span className="whitespace-pre-wrap">
                {parseAnsi(log.data).map((span, j) =>
                  Object.keys(span.style).length > 0 ? (
                    <span key={j} style={span.style}>{span.text}</span>
                  ) : (
                    span.text
                  )
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
