import type { Node } from '@xyflow/react';

export type NodeCategory =
  | 'start'
  | 'message'
  | 'condition'
  | 'input'
  | 'apiCall'
  | 'end';

export interface StartNodeData extends Record<string, unknown> {
  type: 'start';
  label: string;
}

export interface MessageNodeData extends Record<string, unknown> {
  type: 'message';
  label: string;
  message: string;
}

export interface ConditionNodeData extends Record<string, unknown> {
  type: 'condition';
  label: string;
  variable: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty';
  value: string;
}

export interface InputNodeData extends Record<string, unknown> {
  type: 'input';
  label: string;
  variableName: string;
  inputType: 'text' | 'number' | 'email' | 'phone';
  prompt: string;
}

export interface ApiCallNodeData extends Record<string, unknown> {
  type: 'apiCall';
  label: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: string;
  body: string;
  responseVariable: string;
}

export interface EndNodeData extends Record<string, unknown> {
  type: 'end';
  label: string;
  endMessage: string;
}

export type FlowNodeData =
  | StartNodeData
  | MessageNodeData
  | ConditionNodeData
  | InputNodeData
  | ApiCallNodeData
  | EndNodeData;

export type FlowNode = Node<FlowNodeData>;
