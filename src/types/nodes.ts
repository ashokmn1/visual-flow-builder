import type { Node } from '@xyflow/react';

export type NodeCategory =
  | 'message'
  | 'condition'
  | 'input'
  | 'apiCall'
  | 'end';

interface BaseNodeData extends Record<string, unknown> {
  label: string;
  /** Exactly one node in a flow carries the "Start here" chip. */
  isStart?: boolean;
}

export interface MessageNodeData extends BaseNodeData {
  type: 'message';
  message: string;
}

export interface ConditionNodeData extends BaseNodeData {
  type: 'condition';
  variable: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty';
  value: string;
}

export interface InputNodeData extends BaseNodeData {
  type: 'input';
  variableName: string;
  inputType: 'text' | 'number' | 'email' | 'phone';
  prompt: string;
}

export interface ApiCallNodeData extends BaseNodeData {
  type: 'apiCall';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: string;
  body: string;
  responseVariable: string;
}

export interface EndNodeData extends BaseNodeData {
  type: 'end';
  endMessage: string;
}

export type FlowNodeData =
  | MessageNodeData
  | ConditionNodeData
  | InputNodeData
  | ApiCallNodeData
  | EndNodeData;

export type FlowNode = Node<FlowNodeData>;
