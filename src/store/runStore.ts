import { create } from 'zustand';
import { FlowInterpreter, type RunEvent, type RunStatus, type SystemTone } from '../engine/interpreter';
import type { Variables } from '../engine/variables';
import type { InputNodeData } from '../types/nodes';
import { useFlowStore } from './flowStore';
import { generateId } from '../utils/idGenerator';

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user' | 'system';
  text: string;
  nodeId?: string;
  tone?: SystemTone;
}

interface PendingInput {
  nodeId: string;
  inputType: InputNodeData['inputType'];
  variableName: string;
}

interface RunState {
  /** Whether the chat preview panel is open. */
  isRunMode: boolean;
  status: RunStatus;
  messages: ChatMessage[];
  variables: Variables;
  activeNodeId: string | null;
  visitedNodeIds: string[];
  traversedEdgeIds: string[];
  pendingInput: PendingInput | null;
  /** True when the canvas changed after the run started. */
  isStale: boolean;

  openRunMode: () => void;
  closeRunMode: () => void;
  startRun: () => void;
  stopRun: () => void;
  submitInput: (text: string) => void;
}

/** Visual pause between node transitions so the highlight visibly moves. */
const STEP_DELAY_MS = 450;

let interpreter: FlowInterpreter | null = null;
let unsubscribeFlow: (() => void) | null = null;

const initialRunFields = {
  status: 'idle' as RunStatus,
  messages: [] as ChatMessage[],
  variables: {} as Variables,
  activeNodeId: null as string | null,
  visitedNodeIds: [] as string[],
  traversedEdgeIds: [] as string[],
  pendingInput: null as PendingInput | null,
  isStale: false,
};

export const useRunStore = create<RunState>()((set, get) => {
  const push = (message: Omit<ChatMessage, 'id'>) =>
    set((s) => ({ messages: [...s.messages, { id: generateId(), ...message }] }));

  const handleEvent = (event: RunEvent) => {
    switch (event.type) {
      case 'status':
        set({ status: event.status });
        if (event.status !== 'waitingForInput') set({ pendingInput: null });
        break;
      case 'enterNode':
        set((s) => ({
          activeNodeId: event.nodeId,
          visitedNodeIds: s.visitedNodeIds.includes(event.nodeId)
            ? s.visitedNodeIds
            : [...s.visitedNodeIds, event.nodeId],
        }));
        break;
      case 'traverseEdge':
        set((s) => ({
          traversedEdgeIds: s.traversedEdgeIds.includes(event.edgeId)
            ? s.traversedEdgeIds
            : [...s.traversedEdgeIds, event.edgeId],
        }));
        break;
      case 'botMessage':
        push({ role: 'bot', text: event.text, nodeId: event.nodeId });
        break;
      case 'userMessage':
        push({ role: 'user', text: event.text, nodeId: event.nodeId });
        break;
      case 'system':
        push({ role: 'system', text: event.text, nodeId: event.nodeId, tone: event.tone });
        break;
      case 'variables':
        set({ variables: event.variables });
        break;
      case 'waitingForInput':
        set({
          pendingInput: {
            nodeId: event.nodeId,
            inputType: event.inputType,
            variableName: event.variableName,
          },
        });
        break;
      case 'finished':
        push({ role: 'system', text: `Flow finished: ${event.reason}`, nodeId: event.nodeId, tone: 'success' });
        break;
      case 'error':
        push({ role: 'system', text: event.message, nodeId: event.nodeId, tone: 'error' });
        break;
    }
  };

  const teardown = () => {
    interpreter?.stop();
    interpreter = null;
    unsubscribeFlow?.();
    unsubscribeFlow = null;
  };

  return {
    isRunMode: false,
    ...initialRunFields,

    openRunMode: () => {
      if (get().isRunMode) return;
      set({ isRunMode: true });
      // Give the canvas the whole right edge to the preview while running.
      useFlowStore.getState().setSelectedNode(null);
      get().startRun();
    },

    closeRunMode: () => {
      teardown();
      set({ isRunMode: false, ...initialRunFields });
    },

    startRun: () => {
      teardown();
      const { nodes, edges } = useFlowStore.getState();
      set({ ...initialRunFields, isRunMode: true });

      interpreter = new FlowInterpreter(nodes, edges, { stepDelayMs: STEP_DELAY_MS });
      interpreter.subscribe(handleEvent);

      // The run executes a snapshot; flag edits made on the canvas meanwhile.
      unsubscribeFlow = useFlowStore.subscribe((state, prev) => {
        if (state.nodes !== prev.nodes || state.edges !== prev.edges) {
          if (!get().isStale) set({ isStale: true });
        }
      });

      void interpreter.start();
    },

    stopRun: () => {
      const { status } = get();
      if (status !== 'running' && status !== 'waitingForInput') return;
      interpreter?.stop();
      set({ status: 'idle', pendingInput: null });
      push({ role: 'system', text: 'Run stopped.', tone: 'warning' });
    },

    submitInput: (text) => {
      if (!interpreter || get().status !== 'waitingForInput') return;
      void interpreter.submitInput(text);
    },
  };
});
