import type { Edge } from '@xyflow/react';
import type { FlowNode } from '../types/nodes';

export const sampleNodes: FlowNode[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 300, y: 0 },
    data: { type: 'start', label: 'Start' },
  },
  {
    id: 'msg-1',
    type: 'message',
    position: { x: 270, y: 130 },
    data: {
      type: 'message',
      label: 'Welcome',
      message: 'Hi! Welcome to our support. How can I help you today?',
    },
  },
  {
    id: 'input-1',
    type: 'input',
    position: { x: 270, y: 290 },
    data: {
      type: 'input',
      label: 'Get Query',
      variableName: 'user_query',
      inputType: 'text' as const,
      prompt: 'Please describe your issue:',
    },
  },
  {
    id: 'cond-1',
    type: 'condition',
    position: { x: 270, y: 460 },
    data: {
      type: 'condition',
      label: 'Check Query',
      variable: 'user_query',
      operator: 'contains' as const,
      value: 'billing',
    },
  },
  {
    id: 'api-1',
    type: 'apiCall',
    position: { x: 80, y: 640 },
    data: {
      type: 'apiCall',
      label: 'Fetch Account',
      url: 'https://api.example.com/billing',
      method: 'GET' as const,
      headers: '',
      body: '',
      responseVariable: 'billing_info',
    },
  },
  {
    id: 'msg-2',
    type: 'message',
    position: { x: 460, y: 640 },
    data: {
      type: 'message',
      label: 'General Help',
      message: 'Let me connect you with a support agent for further assistance.',
    },
  },
  {
    id: 'end-1',
    type: 'end',
    position: { x: 300, y: 830 },
    data: {
      type: 'end',
      label: 'End',
      endMessage: 'Thank you for contacting us. Have a great day!',
    },
  },
];

export const sampleEdges: Edge[] = [
  {
    id: 'e-start-msg',
    source: 'start-1',
    target: 'msg-1',
    sourceHandle: 'default',
    type: 'animated',
  },
  {
    id: 'e-msg-input',
    source: 'msg-1',
    target: 'input-1',
    sourceHandle: 'default',
    type: 'animated',
  },
  {
    id: 'e-input-cond',
    source: 'input-1',
    target: 'cond-1',
    sourceHandle: 'default',
    type: 'animated',
  },
  {
    id: 'e-cond-api',
    source: 'cond-1',
    target: 'api-1',
    sourceHandle: 'true',
    type: 'animated',
  },
  {
    id: 'e-cond-msg2',
    source: 'cond-1',
    target: 'msg-2',
    sourceHandle: 'false',
    type: 'animated',
  },
  {
    id: 'e-api-end',
    source: 'api-1',
    target: 'end-1',
    sourceHandle: 'success',
    type: 'animated',
  },
  {
    id: 'e-msg2-end',
    source: 'msg-2',
    target: 'end-1',
    sourceHandle: 'default',
    type: 'animated',
  },
];
