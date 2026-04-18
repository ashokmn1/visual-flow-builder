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
        set({
          nodes: applyNodeChanges(changes, get().nodes) as FlowNode[],
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
        set({ nodes: [...get().nodes, node] });
      },

      deleteNode: (nodeId) => {
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
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } as FlowNodeData }
              : node
          ),
        });
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
        set({ nodes, edges, selectedNodeId: null });
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
