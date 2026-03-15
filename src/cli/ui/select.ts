import type { StoredWorkflow } from '../../shared/storage';

export async function selectWorkflow(workflows: StoredWorkflow[]): Promise<StoredWorkflow | null> {
  const { select } = await import('@clack/prompts');

  const result = await select({
    message: 'Select a workflow',
    options: workflows.map((w) => ({
      value: w.id,
      label: w.name,
      hint: `${(w.nodes as unknown[]).length} nodes`,
    })),
  });

  if (typeof result === 'symbol') return null; // cancelled

  return workflows.find((w) => w.id === result) ?? null;
}
