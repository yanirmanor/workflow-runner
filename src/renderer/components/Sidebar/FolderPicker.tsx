import { FolderOpen, Plus, RefreshCw, X } from 'lucide-react';

interface FolderPickerProps {
  rootFolders: string[];
  loading: boolean;
  onAddFolder: () => void;
  onRemoveFolder: (folder: string) => void;
  onRescan: () => void;
}

export function FolderPicker({ rootFolders, loading, onAddFolder, onRemoveFolder, onRescan }: FolderPickerProps) {
  return (
    <div className="p-3 border-b border-gray-800">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Folders</label>
        <div className="flex items-center gap-1">
          {rootFolders.length > 0 && (
            <button
              onClick={onRescan}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Rescan all folders"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            onClick={onAddFolder}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
            title="Add folder"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      {rootFolders.length === 0 ? (
        <button
          onClick={onAddFolder}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors text-left"
        >
          <FolderOpen size={14} className="shrink-0 text-blue-400" />
          <span className="text-gray-400">Select folder...</span>
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          {rootFolders.map((folder) => (
            <div
              key={folder}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 rounded group"
              title={folder}
            >
              <FolderOpen size={14} className="shrink-0 text-blue-400" />
              <span className="truncate flex-1">{folder.split('/').pop()}</span>
              <button
                onClick={() => onRemoveFolder(folder)}
                className="p-0.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove folder"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
