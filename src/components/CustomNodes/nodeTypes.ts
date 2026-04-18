import type { NodeTypes } from '@xyflow/react';
import StartNode from './StartNode';
import MessageNode from './MessageNode';
import ConditionNode from './ConditionNode';
import InputNode from './InputNode';
import ApiCallNode from './ApiCallNode';
import EndNode from './EndNode';

export const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  condition: ConditionNode,
  input: InputNode,
  apiCall: ApiCallNode,
  end: EndNode,
};
