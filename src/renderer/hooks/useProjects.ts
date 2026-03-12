import { useState, useEffect, useCallback } from 'react';
import type { ProjectInfo } from '../types';

export function useProjects() {
  const [rootFolder, setRootFolder] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.electronAPI.getRootFolder().then((folder) => {
      if (folder) {
        setRootFolder(folder);
        scanProjects(folder);
      }
    });
  }, []);

  const scanProjects = async (folder: string) => {
    setLoading(true);
    try {
      const results = await window.electronAPI.scanFolder(folder);
      setProjects(results);
    } finally {
      setLoading(false);
    }
  };

  const pickFolder = useCallback(async () => {
    const folder = await window.electronAPI.pickFolder();
    if (folder) {
      setRootFolder(folder);
      await window.electronAPI.setRootFolder(folder);
      await scanProjects(folder);
    }
  }, []);

  const rescan = useCallback(() => {
    if (rootFolder) scanProjects(rootFolder);
  }, [rootFolder]);

  return { rootFolder, projects, loading, pickFolder, rescan };
}
