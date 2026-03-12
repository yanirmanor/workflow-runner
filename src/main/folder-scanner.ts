import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ScannedProject {
  projectPath: string;
  projectName: string;
  scripts: Record<string, string>;
}

export function scanFolder(folderPath: string): ScannedProject[] {
  const projects: ScannedProject[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(folderPath, { withFileTypes: true });
  } catch {
    return projects;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const childDir = path.join(folderPath, entry.name);
    const pkgPath = path.join(childDir, 'package.json');

    if (!fs.existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      projects.push({
        projectPath: childDir,
        projectName: pkg.name || entry.name,
        scripts: pkg.scripts || {},
      });
    } catch {
      // skip malformed package.json
    }
  }

  return projects.sort((a, b) => a.projectName.localeCompare(b.projectName));
}
