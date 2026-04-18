import type { NodeProps } from '@xyflow/react';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import BaseNode from './BaseNode';
import type { FlowNode, EndNodeData } from '../../types/nodes';

const EndNode = ({ id, data, selected }: NodeProps<FlowNode>) => {
  const nodeData = data as EndNodeData;

  return (
    <BaseNode
      id={id}
      nodeType="end"
      label={data.label}
      icon={<StopCircleIcon sx={{ fontSize: 16 }} />}
      selected={selected}
      sourceHandles={[]}
    >
      <span style={{ opacity: nodeData.endMessage ? 1 : 0.5, fontSize: 12 }}>
        {nodeData.endMessage || 'Conversation ends'}
      </span>
    </BaseNode>
  );
};

export default EndNode;
