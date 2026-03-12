import { useRef, useCallback, useEffect, useState } from 'react';
import { FolderPicker } from './FolderPicker';
import { ProjectList } from './ProjectList';
import { WorkflowList } from './WorkflowList';
import type { ProjectInfo, Workflow } from '../../types';

interface SidebarProps {
  width: number;
  onResizeHandle: React.MouseEventHandler;
  rootFolder: string | null;
  projects: ProjectInfo[];
  loading: boolean;
  onPickFolder: () => void;
  onRescan: () => void;
  onAddProject: (project: ProjectInfo) => void;
  workflows: Workflow[];
  activeWorkflowId: string | null;
  onCreateWorkflow: (name: string) => void;
  onOpenWorkflow: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
  onRenameWorkflow: (id: string, name: string) => void;
  onImportWorkflow: () => void;
}

export function Sidebar({
  width,
  onResizeHandle,
  rootFolder,
  projects,
  loading,
  onPickFolder,
  onRescan,
  onAddProject,
  workflows,
  activeWorkflowId,
  onCreateWorkflow,
  onOpenWorkflow,
  onDeleteWorkflow,
  onRenameWorkflow,
  onImportWorkflow,
}: SidebarProps) {
  const [workflowsHeight, setWorkflowsHeight] = useState(160);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startY.current = e.clientY;
      startHeight.current = workflowsHeight;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [workflowsHeight]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientY - startY.current;
      const containerHeight = containerRef.current?.clientHeight || 600;
      const maxH = containerHeight - 100;
      setWorkflowsHeight(Math.min(maxH, Math.max(60, startHeight.current + delta)));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <aside className="relative flex-shrink-0 bg-gray-900 flex flex-col overflow-hidden" style={{ width }}>
      <div className="p-3 border-b border-gray-800">
        <h1 className="text-sm font-bold text-gray-200 tracking-wide">Workflow Runner</h1>
      </div>
      <FolderPicker rootFolder={rootFolder} loading={loading} onPickFolder={onPickFolder} onRescan={onRescan} />

      <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
        {/* Workflows section */}
        <div className="overflow-y-auto flex-shrink-0" style={{ height: workflowsHeight }}>
          <WorkflowList
            workflows={workflows}
            activeWorkflowId={activeWorkflowId}
            onCreateWorkflow={onCreateWorkflow}
            onOpenWorkflow={onOpenWorkflow}
            onDeleteWorkflow={onDeleteWorkflow}
            onRenameWorkflow={onRenameWorkflow}
            onImportWorkflow={onImportWorkflow}
          />
        </div>

        {/* Horizontal divider handle */}
        <div
          onMouseDown={onDividerMouseDown}
          className="h-1 flex-shrink-0 cursor-row-resize hover:bg-blue-500/50 active:bg-blue-500/70 bg-gray-800 transition-colors"
        />

        {/* Projects section */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <ProjectList projects={projects} loading={loading} onAddProject={onAddProject} />
        </div>
      </div>

      {/* Width resize handle */}
      <div
        onMouseDown={onResizeHandle}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors"
      />
    </aside>
  );
}
