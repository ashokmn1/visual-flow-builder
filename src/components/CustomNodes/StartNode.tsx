import type { NodeProps } from '@xyflow/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BaseNode from './BaseNode';
import type { FlowNode } from '../../types/nodes';

const StartNode = ({ id, data, selected }: NodeProps<FlowNode>) => {
  return (
    <BaseNode
      id={id}
      nodeType="start"
      label={data.label}
      icon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
      selected={selected}
      targetHandle={false}
      sourceHandles={[{ id: 'default', label: '' }]}
    >
      <span style={{ opacity: 0.7, fontSize: 12 }}>Conversation begins here</span>
    </BaseNode>
  );
};

export default StartNode;
