import { Play, Square, Save, Terminal, AlertTriangle } from 'lucide-react';
import type { Workflow } from '../../types';

interface ToolbarProps {
  activeWorkflow: Workflow | null;
  running: boolean;
  cycleWarning: boolean;
  onSave: () => void;
  onRun: () => void;
  onStop: () => void;
  onToggleConsole: () => void;
  consoleOpen: boolean;
}

export function Toolbar({
  activeWorkflow,
  running,
  cycleWarning,
  onSave,
  onRun,
  onStop,
  onToggleConsole,
  consoleOpen,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
      <span className="text-sm font-medium text-gray-300 mr-2">
        {activeWorkflow?.name || 'No workflow'}
      </span>

      {cycleWarning && (
        <span className="flex items-center gap-1 text-xs text-yellow-400 mr-2">
          <AlertTriangle size={14} />
          Cycle detected
        </span>
      )}

      <div className="flex-1" />

      <button
        onClick={onSave}
        disabled={!activeWorkflow}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded transition-colors"
        title="Save (Cmd+S)"
      >
        <Save size={14} />
        Save
      </button>

      {running ? (
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900/60 hover:bg-red-800/60 text-red-300 rounded transition-colors"
        >
          <Square size={14} />
          Stop
        </button>
      ) : (
        <button
          onClick={onRun}
          disabled={!activeWorkflow || cycleWarning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-900/60 hover:bg-green-800/60 text-green-300 disabled:opacity-40 rounded transition-colors"
        >
          <Play size={14} />
          Run
        </button>
      )}

      <button
        onClick={onToggleConsole}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
          consoleOpen ? 'bg-blue-900/40 text-blue-300' : 'bg-gray-800 hover:bg-gray-700'
        }`}
      >
        <Terminal size={14} />
        Console
      </button>
    </div>
  );
}
