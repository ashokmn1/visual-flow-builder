import { useCallback } from 'react';
import { useFlowStore } from '../store/flowStore';
import type { FlowNode } from '../types/nodes';
import type { Edge } from '@xyflow/react';

interface FlowJSON {
  version: string;
  exportedAt: string;
  nodes: FlowNode[];
  edges: Edge[];
}

const VALID_NODE_TYPES = ['message', 'condition', 'input', 'apiCall', 'end'];
const LEGACY_START_TYPE = 'start';

type ValidationResult = { ok: true; flow: FlowJSON } | { ok: false; error: string };

const validateFlow = (data: unknown): ValidationResult => {
  const invalid = { ok: false as const, error: 'Invalid flow file. Please check the JSON format.' };
  if (!data || typeof data !== 'object') return invalid;
  const flow = data as FlowJSON;
  if (!Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) return invalid;

  for (const node of flow.nodes) {
    if (!node.id || !node.type) return invalid;
    if (node.type !== LEGACY_START_TYPE && !VALID_NODE_TYPES.includes(node.type)) return invalid;
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return invalid;
    if (!node.data || !node.data.type || !node.data.label) return invalid;
  }

  for (const edge of flow.edges) {
    if (!edge.id || !edge.source || !edge.target) return invalid;
  }

  const migrated = migrateLegacyStartNodes(flow);
  if (migrated.nodes.length === 0) {
    return { ok: false, error: 'Invalid flow: a flow must contain at least one node.' };
  }

  return { ok: true, flow: migrated };
};

/**
 * Older exports had a dedicated Start node. Replace it with the "Start here"
 * flag on the node it pointed to and drop the node and its edges.
 */
const migrateLegacyStartNodes = (flow: FlowJSON): FlowJSON => {
  const legacyIds = new Set(
    flow.nodes.filter((n) => n.type === LEGACY_START_TYPE).map((n) => n.id)
  );
  if (legacyIds.size === 0) return flow;

  const firstTarget = flow.edges.find((e) => legacyIds.has(e.source))?.target;
  const nodes = flow.nodes
    .filter((n) => !legacyIds.has(n.id))
    .map((n) =>
      n.id === firstTarget ? { ...n, data: { ...n.data, isStart: true } } : n
    );
  const edges = flow.edges.filter(
    (e) => !legacyIds.has(e.source) && !legacyIds.has(e.target)
  );
  return { ...flow, nodes, edges };
};

export const useExportImport = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const setFlow = useFlowStore((s) => s.setFlow);

  const exportFlow = useCallback(() => {
    const flowData: FlowJSON = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    };

    const blob = new Blob([JSON.stringify(flowData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const importFlow = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const result = validateFlow(data);
          if (result.ok) {
            setFlow(result.flow.nodes, result.flow.edges);
          } else {
            alert(result.error);
          }
        } catch {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    },
    [setFlow]
  );

  return { exportFlow, importFlow };
};
