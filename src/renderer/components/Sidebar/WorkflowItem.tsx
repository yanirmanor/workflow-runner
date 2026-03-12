import { useState } from 'react';
import { FileText, Trash2, Pencil, Check, X } from 'lucide-react';

interface WorkflowItemProps {
  id: string;
  name: string;
  active: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function WorkflowItem({ id, name, active, onOpen, onDelete, onRename }: WorkflowItemProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleRename = () => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete workflow "${name}"?`)) {
      onDelete(id);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 mx-1">
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="flex-1 text-sm bg-gray-700 text-gray-100 px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        <button onClick={handleRename} className="p-0.5 text-green-400 hover:text-green-300">
          <Check size={12} />
        </button>
        <button onClick={() => setEditing(false)} className="p-0.5 text-gray-400 hover:text-gray-300">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpen(id)}
      className={`group flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded mx-1 transition-colors ${
        active ? 'bg-blue-900/40 text-blue-300' : 'hover:bg-gray-800'
      }`}
    >
      <FileText size={14} className="shrink-0" />
      <span className="truncate flex-1">{name}</span>
      <div className="hidden group-hover:flex items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditName(name);
            setEditing(true);
          }}
          className="p-0.5 text-gray-400 hover:text-gray-200"
        >
          <Pencil size={12} />
        </button>
        <button onClick={handleDelete} className="p-0.5 text-gray-400 hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
