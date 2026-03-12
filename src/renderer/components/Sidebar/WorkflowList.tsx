import { Plus } from 'lucide-react';
import { WorkflowItem } from './WorkflowItem';
import type { Workflow } from '../../types';

interface WorkflowListProps {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  onCreateWorkflow: (name: string) => void;
  onOpenWorkflow: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
  onRenameWorkflow: (id: string, name: string) => void;
}

export function WorkflowList({
  workflows,
  activeWorkflowId,
  onCreateWorkflow,
  onOpenWorkflow,
  onDeleteWorkflow,
  onRenameWorkflow,
}: WorkflowListProps) {
  const handleCreate = () => {
    const name = `Workflow ${workflows.length + 1}`;
    onCreateWorkflow(name);
  };

  return (
    <div className="py-1 border-t border-gray-800">
      <div className="px-3 py-1 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Workflows</span>
        <button
          onClick={handleCreate}
          className="p-0.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
          title="New workflow"
        >
          <Plus size={14} />
        </button>
      </div>
      {workflows.length === 0 ? (
        <div className="px-3 py-2 text-xs text-gray-500">No workflows yet</div>
      ) : (
        workflows.map((wf) => (
          <WorkflowItem
            key={wf.id}
            id={wf.id}
            name={wf.name}
            active={wf.id === activeWorkflowId}
            onOpen={onOpenWorkflow}
            onDelete={onDeleteWorkflow}
            onRename={onRenameWorkflow}
          />
        ))
      )}
    </div>
  );
}
