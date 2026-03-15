import { createStorage } from '../../shared/storage';
import { topologicalSort, type WorkflowNode, type WorkflowEdge } from '../../shared/topological-sort';
import { bold, dim, getNodeColor, colorize } from '../ui/format';
import { selectWorkflow } from '../ui/select';
import * as os from 'node:os';
import * as path from 'node:path';

export async function viewCommand(name?: string) {
  const storage = createStorage(os.homedir());
  const workflows = storage.getAllWorkflows();

  if (workflows.length === 0) {
    console.log(dim('No saved workflows found.'));
    return;
  }

  let workflow;
  if (name) {
    workflow = workflows.find((w) => w.name.toLowerCase() === name.toLowerCase());
    if (!workflow) {
      console.error(`Workflow "${name}" not found.`);
      process.exit(1);
    }
  } else {
    workflow = await selectWorkflow(workflows);
    if (!workflow) return;
  }

  const nodes = workflow.nodes as WorkflowNode[];
  const edges = workflow.edges as WorkflowEdge[];

  let stages;
  try {
    stages = topologicalSort(nodes, edges);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }

  console.log(bold(`\n${workflow.name}\n`));
  console.log(dim(`ID: ${workflow.id}`));
  console.log(dim(`Created: ${new Date(workflow.createdAt).toLocaleString()}`));
  console.log(dim(`Updated: ${new Date(workflow.updatedAt).toLocaleString()}`));
  console.log('');

  let colorIdx = 0;
  for (let i = 0; i < stages.length; i++) {
    console.log(bold(`Stage ${i + 1}/${stages.length}`));
    for (const entry of stages[i]) {
      const color = getNodeColor(colorIdx++);
      const projectName = path.basename(entry.projectPath);
      console.log(colorize(`  ${projectName}`, color));
      console.log(dim(`    Path: ${entry.projectPath}`));
      if (entry.scripts.length > 0) {
        console.log(dim(`    Scripts: ${entry.scripts.join(', ')}`));
      } else {
        console.log(dim('    Scripts: (none)'));
      }
    }
    console.log('');
  }
}
