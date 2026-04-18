import type { NodeProps } from '@xyflow/react';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import BaseNode from './BaseNode';
import type { FlowNode, MessageNodeData } from '../../types/nodes';

const MessageNode = ({ id, data, selected }: NodeProps<FlowNode>) => {
  const nodeData = data as MessageNodeData;

  return (
    <BaseNode
      id={id}
      nodeType="message"
      label={data.label}
      icon={<ChatBubbleOutlinedIcon sx={{ fontSize: 16 }} />}
      selected={selected}
    >
      <span style={{ opacity: nodeData.message ? 1 : 0.5, fontSize: 12 }}>
        {nodeData.message || 'No message set'}
      </span>
    </BaseNode>
  );
};

export default MessageNode;
