import type { Edge } from '@xyflow/react';
import type { ProjectNodeType } from '../types';

export interface ExecutionStage {
  nodeId: string;
  projectPath: string;
  scripts: string[];
}

export function topologicalSort(nodes: ProjectNodeType[], edges: Edge[]): ExecutionStage[][] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const stages: ExecutionStage[][] = [];
  const remaining = new Set(nodes.map((n) => n.id));

  while (remaining.size > 0) {
    const stage = Array.from(remaining).filter((id) => (inDegree.get(id) || 0) === 0);
    if (stage.length === 0) throw new Error('Cycle detected in workflow graph');

    stages.push(
      stage.map((id) => {
        const node = nodes.find((n) => n.id === id)!;
        return {
          nodeId: id,
          projectPath: node.data.projectPath,
          scripts: node.data.selectedScripts,
        };
      })
    );

    for (const id of stage) {
      remaining.delete(id);
      for (const target of adj.get(id) || []) {
        inDegree.set(target, (inDegree.get(target) || 0) - 1);
      }
    }
  }

  return stages;
}

export function hasCycle(nodes: ProjectNodeType[], edges: Edge[]): boolean {
  try {
    topologicalSort(nodes, edges);
    return false;
  } catch {
    return true;
  }
}
