# Architecture

This document describes how Visual Flow Builder is organized and how data moves through the system.

## High-level overview

The app is a single-page React application. All flow state lives in one Zustand store; every component reads from and writes to that store. [@xyflow/react](https://reactflow.dev/) renders the canvas and emits node/edge change events; the store translates those events into state updates. Temporal history (undo/redo) is provided by a `zundo` middleware wrapped around the store.

```
┌───────────────────────────────────────────────────────────────┐
│                            App.tsx                            │
│   ThemeProvider ─ ReactFlowProvider ─ useUndoRedoKeyboard     │
└───────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
   ┌─────────┐           ┌─────────────┐          ┌─────────────┐
   │ Toolbar │           │ NodePalette │          │ ConfigPanel │
   └─────────┘           └─────────────┘          └─────────────┘
        │                       │                        │
        │                  ┌─────────────┐               │
        └─────────────────▶│ FlowCanvas  │◀──────────────┘
                           │ (@xyflow)   │
                           └─────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   useFlowStore        │
                    │   (zustand + zundo)   │
                    └───────────┬───────────┘
                                │
                        ┌───────┴────────┐
                        │  connectionRules│
                        │  idGenerator    │
                        │  sampleFlow     │
                        └────────────────┘
```

## Module responsibilities

### [src/store/flowStore.ts](src/store/flowStore.ts)

The single source of truth. Holds `nodes`, `edges`, `selectedNodeId`, and `themeMode`. Exposes:

- `onNodesChange` / `onEdgesChange` — React Flow change reducers (wrap `applyNodeChanges` / `applyEdgeChanges`)
- `onConnect` — appends a new edge with `type: 'animated'`
- `addNode`, `deleteNode`, `updateNodeData` — structural mutations
- `setSelectedNode`, `toggleTheme`, `setFlow` — UI / bulk updates

Wrapped in `temporal()` with `partialize` limited to `{ nodes, edges }` and a 50-entry history. Only structural flow changes are undoable; selection and theme are not.

### [src/types/nodes.ts](src/types/nodes.ts)

A discriminated union of node data interfaces keyed by the `type` field. Every node data shape extends `Record<string, unknown>` to satisfy @xyflow/react's generic constraint, and `FlowNode = Node<FlowNodeData>` threads the typed data back through the React Flow API.

### [src/constants/nodeDefaults.ts](src/constants/nodeDefaults.ts)

Three parallel maps keyed by `NodeCategory`:

- `NODE_DEFAULTS` — factory functions that return the initial data payload for a new node
- `NODE_COLORS` — brand color per node type (used in headers, handles, palette, minimap)
- `NODE_LABELS` — display labels for the palette

Adding a new node type starts here.

### [src/utils/connectionRules.ts](src/utils/connectionRules.ts)

Pure function `isValidConnection(sourceId, targetId, sourceHandleId, nodes, edges)` that enforces:

1. No self-connections
2. Target type must be in the source's `canConnectTo` set
3. Each source handle may only emit one edge
4. Total outgoing edges must not exceed `maxOutgoing`
5. No duplicate edges between the same source and target
6. Nothing may connect into a Start node

Called in two places by `FlowCanvas`: `isValidConnection` (live feedback while dragging) and `handleConnect` (final guard before committing).

### [src/components/FlowCanvas/FlowCanvas.tsx](src/components/FlowCanvas/FlowCanvas.tsx)

Renders the `<ReactFlow>` surface plus `Background`, `Controls`, and `MiniMap`. Wires store actions to React Flow props, handles drag-drop from the palette (reads `application/reactflow` from `dataTransfer`, converts screen coordinates via `screenToFlowPosition`, creates a node from `NODE_DEFAULTS`), and manages selection on click.

### [src/components/CustomNodes/](src/components/CustomNodes/)

One component per node type, all built on top of [BaseNode.tsx](src/components/CustomNodes/BaseNode.tsx). `BaseNode` owns the visual shell (header, body, delete button) and handle rendering — it accepts a `sourceHandles` array so condition / apiCall nodes can render two labeled outputs. The `nodeTypes` map in [nodeTypes.ts](src/components/CustomNodes/nodeTypes.ts) registers each component with React Flow.

### [src/components/CustomEdges/](src/components/CustomEdges/)

`AnimatedEdge` — a styled bezier path with a moving gradient. Registered via `edgeTypes` and attached to every new edge by `onConnect`.

### [src/components/NodePalette/NodePalette.tsx](src/components/NodePalette/NodePalette.tsx)

Renders draggable items for each `NodeCategory`. The only data it writes is the node type string set on `event.dataTransfer` — `FlowCanvas` reads it on drop.

### [src/components/ConfigPanel/](src/components/ConfigPanel/)

A right-side drawer that opens when `selectedNodeId` is set. `ConfigPanel.tsx` switches on `selectedNode.data.type` and delegates to a per-type form. Every form dispatches `updateNodeData(nodeId, partial)` on change — field-level updates are merged into the node's `data` by the store.

### [src/components/Toolbar/Toolbar.tsx](src/components/Toolbar/Toolbar.tsx)

App bar with undo/redo, import/export, and theme toggle. Reads temporal state via `useTemporalStore` to enable/disable undo/redo buttons.

### [src/hooks/useUndoRedo.ts](src/hooks/useUndoRedo.ts)

- `useTemporalStore` — typed accessor for the `zundo` temporal store attached to `useFlowStore.temporal`
- `useUndoRedoKeyboard` — global keydown listener for `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl/Cmd+Y`

### [src/hooks/useExportImport.ts](src/hooks/useExportImport.ts)

- `exportFlow` — serializes `{ version, exportedAt, nodes, edges }` and triggers a browser download
- `importFlow` — reads a file, validates shape (node types, positions, edge endpoints), and replaces the flow via `setFlow`

## Key interaction flows

### Creating a node (drag-and-drop)

```
NodePalette                FlowCanvas                   Store
    │                          │                          │
    │ dragstart                │                          │
    │ dataTransfer['application/reactflow'] = type        │
    │─────────────────────────▶│                          │
    │                          │ dragover (preventDefault)│
    │                          │ drop:                    │
    │                          │   - read type            │
    │                          │   - screenToFlowPosition │
    │                          │   - NODE_DEFAULTS[type]()│
    │                          │   - generateId()         │
    │                          │─────── addNode ─────────▶│
    │                          │                          │ nodes: [...prev, new]
    │                          │◀──── re-render ──────────│
```

### Connecting two nodes

```
User drags from source handle to target handle
    │
    ▼
ReactFlow.isValidConnection(conn)  ──▶  connectionRules.isValidConnection(...)
    │                                       │ live visual feedback (red/green)
    ▼
ReactFlow.onConnect(conn)  ──▶  FlowCanvas.handleConnect
    │                                │
    │                                │ re-checks isValidConnection
    │                                ▼
    │                          store.onConnect(conn)
    │                                │
    │                                ▼
    │                          addEdge({...conn, type: 'animated'}, edges)
    ▼
AnimatedEdge renders between the two handles
```

### Editing node data

```
User clicks a node ──▶ FlowCanvas.handleNodeClick ──▶ setSelectedNode(id)
                                                          │
                                                          ▼
ConfigPanel re-renders, finds node by id, mounts typed form (e.g. MessageConfig)
    │
    │ user types in TextField
    ▼
updateNodeData(nodeId, { message: '...' })
    │
    ▼
store merges: nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...partial } } : n)
    │
    ▼
CustomNode re-renders with new data
```

### Undo / redo

```
Any mutation (addNode, deleteNode, updateNodeData, onConnect, ...)
    │
    ▼
zundo middleware snapshots { nodes, edges } into pastStates (partialize filter)
    │
    ▼
useUndoRedoKeyboard catches Ctrl/Cmd+Z
    │
    ▼
temporal.undo() pops pastStates → applies to store → pushes onto futureStates
    │
    ▼
All subscribers re-render with the previous nodes/edges
```

Only `nodes` and `edges` are tracked — selection and theme toggles don't create history entries, so undo never "steals" the user's current selection.

### Export / import

```
Export:  nodes, edges  ──▶  { version, exportedAt, nodes, edges }
                                │
                                ▼
                       JSON.stringify ──▶ Blob ──▶ <a download> click

Import:  File  ──▶  FileReader.readAsText  ──▶  JSON.parse
                                                  │
                                                  ▼
                                          validateFlow(data)
                                                  │
                                       ┌──────────┴──────────┐
                                       ▼ valid               ▼ invalid
                              setFlow(nodes, edges)       alert(...)
```

`setFlow` also clears `selectedNodeId`, so the config panel closes on import.

## Adding a new node type

1. Extend `NodeCategory` and add a `*NodeData` interface in [src/types/nodes.ts](src/types/nodes.ts); include it in the `FlowNodeData` union.
2. Add entries to `NODE_DEFAULTS`, `NODE_COLORS`, and `NODE_LABELS` in [src/constants/nodeDefaults.ts](src/constants/nodeDefaults.ts).
3. Create a component in [src/components/CustomNodes/](src/components/CustomNodes/) that wraps `BaseNode`, and register it in [nodeTypes.ts](src/components/CustomNodes/nodeTypes.ts).
4. Add a connection rule entry in [src/utils/connectionRules.ts](src/utils/connectionRules.ts) (`canConnectTo` + `maxOutgoing`).
5. Create a config form in [src/components/ConfigPanel/](src/components/ConfigPanel/) and add a `case` to the switch in [ConfigPanel.tsx](src/components/ConfigPanel/ConfigPanel.tsx).
6. Add an icon mapping in [NodePalette.tsx](src/components/NodePalette/NodePalette.tsx) and include the new type in `VALID_NODE_TYPES` in [useExportImport.ts](src/hooks/useExportImport.ts).

## Design notes

- **One store, many selectors.** Components subscribe to narrow slices (`s => s.nodes`, `s => s.selectedNodeId`) so unrelated updates don't re-render them.
- **Pure validation.** `isValidConnection` takes `nodes` and `edges` as arguments rather than reading the store, which makes it trivial to test and safe to call from both `isValidConnection` (hover) and `onConnect` (commit).
- **Partialized history.** `zundo`'s `partialize` scopes undo to flow structure only, avoiding surprise reverts of selection or theme.
- **Type-discriminated data.** `FlowNodeData` is a discriminated union on `type`, so the config panel's switch, the node renderer map, and the default factory all stay in lockstep with the TypeScript compiler.
