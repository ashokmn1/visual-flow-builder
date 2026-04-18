import type {
  StartNodeData,
  MessageNodeData,
  ConditionNodeData,
  InputNodeData,
  ApiCallNodeData,
  EndNodeData,
  NodeCategory,
} from '../types/nodes';

export const NODE_DEFAULTS: Record<NodeCategory, () => StartNodeData | MessageNodeData | ConditionNodeData | InputNodeData | ApiCallNodeData | EndNodeData> = {
  start: () => ({
    type: 'start' as const,
    label: 'Start',
  }),
  message: () => ({
    type: 'message' as const,
    label: 'Message',
    message: '',
  }),
  condition: () => ({
    type: 'condition' as const,
    label: 'Condition',
    variable: '',
    operator: 'equals' as const,
    value: '',
  }),
  input: () => ({
    type: 'input' as const,
    label: 'User Input',
    variableName: '',
    inputType: 'text' as const,
    prompt: '',
  }),
  apiCall: () => ({
    type: 'apiCall' as const,
    label: 'API Call',
    url: '',
    method: 'GET' as const,
    headers: '',
    body: '',
    responseVariable: '',
  }),
  end: () => ({
    type: 'end' as const,
    label: 'End',
    endMessage: '',
  }),
};

export const NODE_COLORS: Record<NodeCategory, string> = {
  start: '#22c55e',
  message: '#3b82f6',
  condition: '#f59e0b',
  input: '#8b5cf6',
  apiCall: '#06b6d4',
  end: '#ef4444',
};

export const NODE_LABELS: Record<NodeCategory, string> = {
  start: 'Start',
  message: 'Message',
  condition: 'Condition',
  input: 'User Input',
  apiCall: 'API Call',
  end: 'End',
};
