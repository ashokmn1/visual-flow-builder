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

const VALID_NODE_TYPES = ['start', 'message', 'condition', 'input', 'apiCall', 'end'];

const validateFlow = (data: unknown): data is FlowJSON => {
  if (!data || typeof data !== 'object') return false;
  const flow = data as FlowJSON;
  if (!Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) return false;

  for (const node of flow.nodes) {
    if (!node.id || !node.type || !VALID_NODE_TYPES.includes(node.type)) return false;
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false;
    if (!node.data || !node.data.type || !node.data.label) return false;
  }

  for (const edge of flow.edges) {
    if (!edge.id || !edge.source || !edge.target) return false;
  }

  return true;
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
          if (validateFlow(data)) {
            setFlow(data.nodes, data.edges);
          } else {
            alert('Invalid flow file. Please check the JSON format.');
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
