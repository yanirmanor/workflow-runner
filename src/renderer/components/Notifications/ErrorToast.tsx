import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { ErrorNotification } from '../../hooks/useExecution';
import type { ProjectNodeType } from '../../types';

interface ErrorToastProps {
  notifications: ErrorNotification[];
  nodes: ProjectNodeType[];
  onDismiss: (timestamp: number) => void;
}

export function ErrorToast({ notifications, nodes, onDismiss }: ErrorToastProps) {
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) =>
      setTimeout(() => onDismiss(n.timestamp), 12000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  const getNodeName = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.data.projectName || nodeId;
  };

  return (
    <div className="absolute top-3 left-3 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.timestamp}
          className="flex items-start gap-2 px-3 py-2 bg-red-900/90 border border-red-700 rounded-lg shadow-lg text-sm text-red-100 animate-[slideIn_0.2s_ease-out]"
        >
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{getNodeName(n.nodeId)}</p>
            <pre className="text-red-300 text-[11px] mt-1 whitespace-pre-wrap break-words leading-tight font-mono max-h-20 overflow-y-auto">
              {n.message}
            </pre>
          </div>
          <button
            onClick={() => onDismiss(n.timestamp)}
            className="shrink-0 p-0.5 text-red-400 hover:text-red-200"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
