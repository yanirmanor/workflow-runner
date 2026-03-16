import { useState, useEffect, useCallback } from 'react';
import type { ProjectInfo } from '../types';

export function useProjects() {
  const [rootFolders, setRootFolders] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const scanAllFolders = async (folders: string[]) => {
    if (folders.length === 0) {
      setProjects([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(folders.map((f) => window.electronAPI.scanFolder(f)));
      setProjects(results.flat());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.electronAPI.getRootFolders().then((folders) => {
      if (folders.length > 0) {
        setRootFolders(folders);
        scanAllFolders(folders);
      }
    });
  }, []);

  const addFolder = useCallback(async () => {
    const folder = await window.electronAPI.pickFolder();
    if (folder && !rootFolders.includes(folder)) {
      const updated = [...rootFolders, folder];
      setRootFolders(updated);
      await window.electronAPI.addRootFolder(folder);
      await scanAllFolders(updated);
    }
  }, [rootFolders]);

  const removeFolder = useCallback(
    async (folder: string) => {
      const updated = rootFolders.filter((f) => f !== folder);
      setRootFolders(updated);
      await window.electronAPI.removeRootFolder(folder);
      await scanAllFolders(updated);
    },
    [rootFolders]
  );

  const rescan = useCallback(() => {
    scanAllFolders(rootFolders);
  }, [rootFolders]);

  return { rootFolders, projects, loading, addFolder, removeFolder, rescan };
}
