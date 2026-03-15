import { createStorage } from '../../shared/storage';
import { topologicalSort, type WorkflowNode, type WorkflowEdge } from '../../shared/topological-sort';
import { ExecutionEngine } from '../../shared/execution-engine';
import { bold, dim, red, green, yellow, getNodeColor, colorize } from '../ui/format';
import { selectWorkflow } from '../ui/select';
import * as os from 'node:os';
import * as path from 'node:path';

export async function runCommand(name?: string) {
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

  console.log(bold(`\nRunning: ${workflow.name}\n`));

  const nodeColorMap = new Map<string, string>();
  const nodeNameMap = new Map<string, string>();
  let colorIdx = 0;
  for (const stage of stages) {
    for (const entry of stage) {
      const projectName = path.basename(entry.projectPath);
      nodeColorMap.set(entry.nodeId, getNodeColor(colorIdx++));
      nodeNameMap.set(entry.nodeId, projectName);
    }
  }

  const engine = new ExecutionEngine();

  engine.on('stageStart', ({ stageIndex, totalStages }) => {
    console.log(bold(`\n--- Stage ${stageIndex + 1}/${totalStages} ---\n`));
  });

  engine.on('log', ({ nodeId, stream, data }) => {
    const color = nodeColorMap.get(nodeId) || '';
    const name = nodeNameMap.get(nodeId) || nodeId;
    const prefix = colorize(`[${name}]`, color);
    const lines = data.replace(/\n$/, '').split('\n');
    for (const line of lines) {
      if (stream === 'stderr') {
        console.error(`${prefix} ${line}`);
      } else {
        console.log(`${prefix} ${line}`);
      }
    }
  });

  engine.on('nodeStatus', ({ nodeId, status }) => {
    const name = nodeNameMap.get(nodeId) || nodeId;
    const color = nodeColorMap.get(nodeId) || '';
    if (status === 'success') {
      console.log(colorize(`[${name}]`, color) + ' ' + green('completed'));
    } else if (status === 'error') {
      console.log(colorize(`[${name}]`, color) + ' ' + red('failed'));
    }
  });

  engine.on('portDetected', ({ nodeId, port }) => {
    const name = nodeNameMap.get(nodeId) || nodeId;
    const color = nodeColorMap.get(nodeId) || '';
    console.log(colorize(`[${name}]`, color) + ' ' + yellow(`port ${port} detected`));
  });

  process.on('SIGINT', () => {
    console.log(yellow('\n\nStopping workflow...'));
    engine.stop();
    process.exit(130);
  });

  const success = await engine.runStages(stages);

  console.log('');
  if (success) {
    console.log(green(bold('Workflow completed successfully.')));
  } else {
    console.log(red(bold('Workflow failed.')));
    process.exit(1);
  }
}
