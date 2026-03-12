import { FolderOpen, RefreshCw } from 'lucide-react';

interface FolderPickerProps {
  rootFolder: string | null;
  loading: boolean;
  onPickFolder: () => void;
  onRescan: () => void;
}

export function FolderPicker({ rootFolder, loading, onPickFolder, onRescan }: FolderPickerProps) {
  const folderName = rootFolder ? rootFolder.split('/').pop() : null;

  return (
    <div className="p-3 border-b border-gray-800">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Root Folder</label>
      <div className="mt-1 flex items-center gap-1">
        <button
          onClick={onPickFolder}
          className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors text-left truncate"
          title={rootFolder || 'Select a folder'}
        >
          <FolderOpen size={14} className="shrink-0 text-blue-400" />
          <span className="truncate">{folderName || 'Select folder...'}</span>
        </button>
        {rootFolder && (
          <button
            onClick={onRescan}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            title="Rescan"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}
