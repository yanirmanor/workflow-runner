import { createStorage, type StoredWorkflow } from '../../shared/storage';
import { bold, dim, formatTable } from '../ui/format';
import * as os from 'node:os';

export function listCommand() {
  const storage = createStorage(os.homedir());
  const workflows = storage.getAllWorkflows();

  if (workflows.length === 0) {
    console.log(dim('No saved workflows found.'));
    console.log(dim('Create workflows using the Workflow Runner desktop app.'));
    return;
  }

  console.log(bold(`\nSaved Workflows (${workflows.length})\n`));

  const rows = workflows.map((w: StoredWorkflow) => {
    const nodes = w.nodes as { data?: { selectedScripts?: string[] } }[];
    const nodeCount = nodes.length;
    const scriptCount = nodes.reduce(
      (sum, n) => sum + (n.data?.selectedScripts?.length || 0),
      0
    );
    const updated = new Date(w.updatedAt).toLocaleDateString();
    return [w.name, String(nodeCount), String(scriptCount), updated];
  });

  console.log(formatTable(['Name', 'Nodes', 'Scripts', 'Updated'], rows));
  console.log('');
}
