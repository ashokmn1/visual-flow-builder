import { useCallback, useEffect, type DragEvent } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  useStore,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "@mui/material/styles";
import { nodeTypes } from "../CustomNodes/nodeTypes";
import { edgeTypes } from "../CustomEdges/edgeTypes";
import { useFlowStore } from "../../store/flowStore";
import { useRunStore } from "../../store/runStore";
import { NODE_DEFAULTS, NODE_COLORS } from "../../constants/nodeDefaults";
import { isValidConnection } from "../../utils/connectionRules";
import { generateId } from "../../utils/idGenerator";
import type { Node, Edge } from "@xyflow/react";
import type { FlowNode, NodeCategory } from "../../types/nodes";

const FlowCanvas = () => {
  const theme = useTheme();
  const { screenToFlowPosition, getInternalNode, getViewport, setCenter } =
    useReactFlow();
  const viewportWidth = useStore((s) => s.width);
  const viewportHeight = useStore((s) => s.height);
  const activeNodeId = useRunStore((s) => s.activeNodeId);

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);

  // Keep the executing node in view during a run without fighting the user:
  // only pan when the node has left the visible area.
  useEffect(() => {
    if (!activeNodeId) return;
    const node = getInternalNode(activeNodeId);
    if (!node) return;
    const { x, y, zoom } = getViewport();
    const width = node.measured.width ?? 220;
    const height = node.measured.height ?? 100;
    const left = node.internals.positionAbsolute.x * zoom + x;
    const top = node.internals.positionAbsolute.y * zoom + y;
    const margin = 24;
    const inView =
      left >= margin &&
      top >= margin &&
      left + width * zoom <= viewportWidth - margin &&
      top + height * zoom <= viewportHeight - margin;
    if (inView) return;
    void setCenter(
      node.internals.positionAbsolute.x + width / 2,
      node.internals.positionAbsolute.y + height / 2,
      { zoom, duration: 500 },
    );
  }, [activeNodeId, getInternalNode, getViewport, setCenter, viewportWidth, viewportHeight]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      const valid = isValidConnection(
        connection.source,
        connection.target,
        connection.sourceHandle,
        nodes,
        edges,
      );
      if (valid) {
        onConnect(connection);
      }
    },
    [nodes, edges, onConnect],
  );

  const handleIsValidConnection = useCallback(
    (connection: Connection | Edge) => {
      return isValidConnection(
        connection.source,
        connection.target,
        connection.sourceHandle ?? null,
        nodes,
        edges,
      );
    },
    [nodes, edges],
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        "application/reactflow",
      ) as NodeCategory;

      if (!nodeType || !NODE_DEFAULTS[nodeType]) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: FlowNode = {
        id: generateId(),
        type: nodeType,
        position,
        data: NODE_DEFAULTS[nodeType](),
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const isDark = theme.palette.mode === "dark";

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      isValidConnection={handleIsValidConnection}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      fitView
      deleteKeyCode={["Backspace", "Delete"]}
      style={{
        background: isDark ? "#0f172a" : "#f8fafc",
      }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color={isDark ? "#334155" : "#cbd5e1"}
      />
      <Controls
        style={{
          background: isDark ? "#1e293b" : "#f3f3f3ff",
          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          display: "flex",
          gap: "4px",
          borderRadius: 8,
        }}
      />
      <MiniMap
        nodeColor={(node) => {
          const type = node.data?.type as NodeCategory;
          return NODE_COLORS[type] || "#94a3b8";
        }}
        style={{
          background: isDark ? "#1e293b" : "#ffffff",
          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          borderRadius: 8,
        }}
        maskColor={
          isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(248, 250, 252, 0.7)"
        }
      />
    </ReactFlow>
  );
};

export default FlowCanvas;
