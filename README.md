# Visual Flow Builder

A drag-and-drop visual editor for designing conversational and logic flows, built with React, TypeScript, and [@xyflow/react](https://reactflow.dev/).

## Features

- **Six node types** — Start, Message, Condition, Input, API Call, and End
- **Drag-and-drop** node creation from a side palette onto the canvas
- **Configurable nodes** — each node type exposes its own configuration panel
- **Connection validation** — rules enforce valid edges (e.g., no connections into Start, branch limits per node type, no self-connections, no duplicates)
- **Animated edges** between connected nodes
- **Undo / redo** with keyboard shortcuts (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`), backed by [zundo](https://github.com/charkour/zundo)
- **Export / import** flows as JSON
- **Light / dark theme** toggle, persisted to `localStorage`
- **Sample flow** loaded on first launch

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev server and build
- [@xyflow/react](https://reactflow.dev/) for the flow canvas
- [Zustand](https://github.com/pmndrs/zustand) for state, [zundo](https://github.com/charkour/zundo) for temporal history
- [MUI](https://mui.com/) for UI components and theming
- [nanoid](https://github.com/ai/nanoid) for node IDs

## Getting Started

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (typically http://localhost:5173).

### Scripts

- `npm run dev` — start the dev server with HMR
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Project Structure

```
src/
  components/
    ConfigPanel/      Per-node configuration forms
    CustomEdges/      Animated edge component
    CustomNodes/      Node components (Start, Message, Condition, Input, ApiCall, End)
    FlowCanvas/       Main @xyflow/react canvas
    NodePalette/      Draggable node source list
    Toolbar/          App toolbar (undo/redo, import/export, theme)
  constants/          Node default data
  hooks/              useUndoRedo, useExportImport
  store/              Zustand + zundo flow store
  types/              Node data types
  utils/              Connection rules, ID generation, sample flow
```

## Node Types

| Node        | Purpose                              | Max outgoing |
| ----------- | ------------------------------------ | ------------ |
| Start       | Entry point of the flow              | 1            |
| Message     | Display a message to the user        | 1            |
| Condition   | Branch based on a variable check     | 2            |
| Input       | Collect user input into a variable   | 1            |
| API Call    | Perform an HTTP request              | 2            |
| End         | Terminates the flow                  | 0            |

Connection rules are defined in [src/utils/connectionRules.ts](src/utils/connectionRules.ts).

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for a walkthrough of the module layout, store design, and the main interaction flows (drag-drop, connect, edit, undo/redo, export/import).
