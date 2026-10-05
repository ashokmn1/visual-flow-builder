import type { Edge } from '@xyflow/react';
import type { FlowNode, NodeCategory } from '../types/nodes';

const CONNECTION_RULES: Record<
  NodeCategory,
  { canConnectTo: NodeCategory[]; maxOutgoing: number }
> = {
  message: {
    canConnectTo: ['message', 'condition', 'input', 'apiCall', 'end'],
    maxOutgoing: 1,
  },
  condition: {
    canConnectTo: ['message', 'condition', 'input', 'apiCall', 'end'],
    maxOutgoing: 2,
  },
  input: {
    canConnectTo: ['message', 'condition', 'input', 'apiCall', 'end'],
    maxOutgoing: 1,
  },
  apiCall: {
    canConnectTo: ['message', 'condition', 'input', 'apiCall', 'end'],
    maxOutgoing: 2,
  },
  end: {
    canConnectTo: [],
    maxOutgoing: 0,
  },
};

export const isValidConnection = (
  sourceId: string,
  targetId: string,
  sourceHandleId: string | null,
  nodes: FlowNode[],
  edges: Edge[]
): boolean => {
  // No self-connections
  if (sourceId === targetId) return false;

  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);

  if (!sourceNode || !targetNode) return false;

  const sourceType = sourceNode.data.type;
  const targetType = targetNode.data.type;

  const rules = CONNECTION_RULES[sourceType];

  // Check if target type is allowed
  if (!rules.canConnectTo.includes(targetType)) return false;

  // Check max outgoing from this specific handle
  const existingFromHandle = edges.filter(
    (e) => e.source === sourceId && e.sourceHandle === sourceHandleId
  );
  if (existingFromHandle.length > 0) return false;

  // Check total outgoing
  const totalOutgoing = edges.filter((e) => e.source === sourceId);
  if (totalOutgoing.length >= rules.maxOutgoing) return false;

  // No duplicate edges between same source and target
  const duplicate = edges.find(
    (e) => e.source === sourceId && e.target === targetId
  );
  if (duplicate) return false;

  return true;
};
