import { useState } from 'react';
import { Search } from 'lucide-react';
import { ProjectItem } from './ProjectItem';
import type { ProjectInfo } from '../../types';

interface ProjectListProps {
  projects: ProjectInfo[];
  loading: boolean;
  onAddProject: (project: ProjectInfo) => void;
}

export function ProjectList({ projects, loading, onAddProject }: ProjectListProps) {
  const [filter, setFilter] = useState('');

  if (loading) {
    return <div className="px-3 py-2 text-xs text-gray-500">Scanning...</div>;
  }

  if (projects.length === 0) {
    return <div className="px-3 py-2 text-xs text-gray-500">No projects found</div>;
  }

  const filtered = filter
    ? projects.filter((p) => p.projectName.toLowerCase().includes(filter.toLowerCase()))
    : projects;

  return (
    <div className="py-1">
      <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
        Projects ({projects.length})
      </div>
      <div className="px-2 py-1">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded text-sm">
          <Search size={12} className="text-gray-500 shrink-0" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter projects..."
            className="bg-transparent outline-none text-gray-300 placeholder-gray-600 text-xs w-full"
          />
        </div>
      </div>
      {filtered.map((project) => (
        <ProjectItem key={project.projectPath} project={project} onAdd={onAddProject} />
      ))}
      {filter && filtered.length === 0 && (
        <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
      )}
    </div>
  );
}
