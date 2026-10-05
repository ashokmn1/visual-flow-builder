import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  type Edge,
  type Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type { FlowNode, FlowNodeData } from '../types/nodes';

export const isStartNode = (node: FlowNode) => node.data.isStart === true;

const normalizeStart = (nodes: FlowNode[], preferredId?: string): FlowNode[] => {
  if (nodes.length === 0) return nodes;
  const startId =
    (preferredId && nodes.some((n) => n.id === preferredId) && preferredId) ||
    nodes.find(isStartNode)?.id ||
    nodes[0].id;

  return nodes.map((node) => {
    const isStart = node.id === startId;
    const deletable = !isStart;
    if ((node.data.isStart ?? false) === isStart && (node.deletable ?? true) === deletable) {
      return node;
    }
    return {
      ...node,
      deletable,
      data: { ...node.data, isStart } as FlowNodeData,
    };
  });
};

interface FlowState {
  nodes: FlowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  themeMode: 'light' | 'dark';

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: FlowNode) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void;
  /** Move the "Start here" chip to the given node. */
  setStartNode: (nodeId: string) => void;

  setSelectedNode: (nodeId: string | null) => void;
  toggleTheme: () => void;
  setFlow: (nodes: FlowNode[], edges: Edge[]) => void;
}

export const useFlowStore = create<FlowState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      themeMode:
        (localStorage.getItem('theme') as 'light' | 'dark') || 'light',

      onNodesChange: (changes) => {
        const { nodes } = get();
        const startIds = new Set(nodes.filter(isStartNode).map((n) => n.id));
        // Backspace/Delete on the selected start node must not remove it.
        const safeChanges = changes.filter(
          (change) => !(change.type === 'remove' && startIds.has(change.id))
        );
        set({
          nodes: applyNodeChanges(safeChanges, nodes) as FlowNode[],
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection) => {
        set({
          edges: addEdge(
            { ...connection, type: 'animated' },
            get().edges
          ),
        });
      },

      addNode: (node) => {
        // The first node dropped on an empty canvas becomes the start.
        set({ nodes: normalizeStart([...get().nodes, node]) });
      },

      deleteNode: (nodeId) => {
        const target = get().nodes.find((n) => n.id === nodeId);
        if (!target || isStartNode(target)) return;
        set({
          nodes: get().nodes.filter((n) => n.id !== nodeId),
          edges: get().edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
          selectedNodeId:
            get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        });
      },

      updateNodeData: (nodeId, data) => {
        // `isStart` is managed exclusively through setStartNode.
        const { isStart: _ignored, ...rest } = data;
        void _ignored;
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...rest } as FlowNodeData }
              : node
          ),
        });
      },

      setStartNode: (nodeId) => {
        set({ nodes: normalizeStart(get().nodes, nodeId) });
      },

      setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      toggleTheme: () => {
        const next = get().themeMode === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', next);
        set({ themeMode: next });
      },

      setFlow: (nodes, edges) => {
        set({ nodes: normalizeStart(nodes), edges, selectedNodeId: null });
      },
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      limit: 50,
    }
  )
);
