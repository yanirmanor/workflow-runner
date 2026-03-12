import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

export interface ScannedProject {
  projectPath: string;
  projectName: string;
  scripts: Record<string, string>;
  gitBranch: string | null;
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
      let gitBranch: string | null = null;
      try {
        gitBranch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
          cwd: childDir,
          encoding: 'utf-8',
          timeout: 3000,
        }).trim();
      } catch {
        // not a git repo or git not available
      }

      projects.push({
        projectPath: childDir,
        projectName: pkg.name || entry.name,
        scripts: pkg.scripts || {},
        gitBranch,
      });
    } catch {
      // skip malformed package.json
    }
  }

  return projects.sort((a, b) => a.projectName.localeCompare(b.projectName));
}
