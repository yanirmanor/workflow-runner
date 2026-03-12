import { useEffect } from 'react';
import { Globe, X } from 'lucide-react';
import type { PortNotification } from '../../hooks/useExecution';
import type { ProjectNodeType } from '../../types';

interface PortToastProps {
  notifications: PortNotification[];
  nodes: ProjectNodeType[];
  onDismiss: (timestamp: number) => void;
}

export function PortToast({ notifications, nodes, onDismiss }: PortToastProps) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) =>
      setTimeout(() => onDismiss(n.timestamp), 8000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  const getNodeName = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.data.projectName || nodeId;
  };

  return (
    <div className="absolute top-3 right-3 z-50 flex flex-col gap-2 max-w-xs">
      {notifications.map((n) => (
        <div
          key={n.timestamp}
          className="flex items-start gap-2 px-3 py-2 bg-green-900/90 border border-green-700 rounded-lg shadow-lg text-sm text-green-100 animate-[slideIn_0.2s_ease-out]"
        >
          <Globe size={16} className="text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{getNodeName(n.nodeId)}</p>
            <p className="text-green-300 text-xs">Running on port {n.port}</p>
          </div>
          <button
            onClick={() => onDismiss(n.timestamp)}
            className="shrink-0 p-0.5 text-green-400 hover:text-green-200"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
