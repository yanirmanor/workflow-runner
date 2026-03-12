import { Package } from 'lucide-react';
import type { ProjectInfo } from '../../types';

interface ProjectItemProps {
  project: ProjectInfo;
  onAdd: (project: ProjectInfo) => void;
}

export function ProjectItem({ project, onAdd }: ProjectItemProps) {
  const scriptCount = Object.keys(project.scripts).length;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/workflow-project', JSON.stringify(project));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAdd(project)}
      className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-800 rounded mx-1 transition-colors"
      title={`${project.projectPath}\n${scriptCount} script(s)\nClick to add to canvas`}
    >
      <Package size={14} className="shrink-0 text-green-400" />
      <span className="truncate">{project.projectName}</span>
      <span className="ml-auto text-xs text-gray-500">{scriptCount}</span>
    </div>
  );
}
