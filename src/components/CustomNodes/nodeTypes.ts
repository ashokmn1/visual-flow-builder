import type { NodeTypes } from '@xyflow/react';
import MessageNode from './MessageNode';
import ConditionNode from './ConditionNode';
import InputNode from './InputNode';
import ApiCallNode from './ApiCallNode';
import EndNode from './EndNode';

export const nodeTypes: NodeTypes = {
  message: MessageNode,
  condition: ConditionNode,
  input: InputNode,
  apiCall: ApiCallNode,
  end: EndNode,
};
