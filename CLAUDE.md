# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A drag-and-drop visual editor for conversational/logic flows (React 19 + TypeScript + Vite + `@xyflow/react`), deployed as a static site on Vercel. The repo is portfolio-facing: keep the existing bar of tests, docs, and explicit limits when adding features.

## Commands

```bash
npm run dev            # Vite dev server with HMR
npm run build          # tsc -b then vite build → dist/
npm run preview        # serve the production build
npm run lint           # ESLint (flat config)
npm test               # vitest run
npx vitest run src/engine/interpreter.test.ts        # one file
npx vitest run -t "resolves dotted paths"            # one test by name
```

There is no vitest config file; tests are discovered by the default `**/*.test.ts` glob and run in a Node environment (no jsdom). Keep tested code UI-free.

## Architecture

[ARCHITECTURE.md](ARCHITECTURE.md) is the authoritative walkthrough (store design, interaction flows, and a step-by-step "Adding a new node type" checklist). Read it before structural changes. The points below are the ones most likely to trip up edits.

- **Two Zustand stores, different history rules.** `store/flowStore.ts` holds `nodes`/`edges`/selection/theme and is wrapped in zundo `temporal()` with `partialize` limited to `{ nodes, edges }` (50 entries). `store/runStore.ts` holds Run-mode state (transcript, variables, active/visited ids, stale flag) and is deliberately not undoable.
- **Start node is a flag, not a node type.** Exactly one node carries `data.isStart === true`; it is set only through `setStartNode`, and `updateNodeData` strips `isStart` from incoming partials. The start node is non-deletable and nothing may connect into it.
- **Node data is a discriminated union on `data.type`** (`types/nodes.ts`). `NODE_DEFAULTS` / `NODE_COLORS` / `NODE_LABELS` in `constants/nodeDefaults.ts`, the `nodeTypes` map, the ConfigPanel switch, `connectionRules.ts`, and `VALID_NODE_TYPES` in `useExportImport.ts` must all be updated together when a type is added.
- **Connection validation is pure.** `utils/connectionRules.ts` takes `nodes`/`edges` as arguments and is called twice by `FlowCanvas` (live drag feedback and the commit guard). Per-type `canConnectTo` / `maxOutgoing` live there.
- **The interpreter is UI-free.** `engine/interpreter.ts` (`FlowInterpreter`: `start`, `submitInput`, `stop`, `subscribe`) and `engine/variables.ts` import nothing from React or the stores, so they are unit-tested directly. `runStore.startRun` snapshots the flow store, builds an interpreter, and reduces its events into state. API Call nodes do a real browser `fetch`; runaway loops stop after 200 steps.

## Deployment

Static Vite build on Vercel; `vercel.json` sets the SPA rewrite (everything except `/assets/*` → `index.html`), immutable caching for hashed assets, and security headers. Pushes to `main` deploy to production; PRs get preview URLs.
