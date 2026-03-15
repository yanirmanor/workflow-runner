#!/usr/bin/env node

import { listCommand } from './commands/list';
import { viewCommand } from './commands/view';
import { runCommand } from './commands/run';

const args = process.argv.slice(2);
const command = args[0];
const nameArg = args.slice(1).join(' ') || undefined;

function showHelp() {
  console.log(`
workflow-runner CLI

Usage:
  workflow-runner list              List all saved workflows
  workflow-runner view [name]       Show workflow details and execution plan
  workflow-runner run [name]        Run a workflow
  workflow-runner help              Show this help message

If no name is provided to view/run, an interactive picker is shown.
`);
}

async function main() {
  switch (command) {
    case 'list':
      listCommand();
      break;
    case 'view':
      await viewCommand(nameArg);
      break;
    case 'run':
      await runCommand(nameArg);
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      showHelp();
      break;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
