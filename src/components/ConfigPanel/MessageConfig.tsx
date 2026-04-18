import { Stack, TextField } from '@mui/material';
import { useFlowStore } from '../../store/flowStore';
import type { FlowNode, MessageNodeData } from '../../types/nodes';

interface Props {
  node: FlowNode;
}

const MessageConfig = ({ node }: Props) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const data = node.data as MessageNodeData;

  return (
    <Stack spacing={2}>
      <TextField
        label="Label"
        value={data.label}
        onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
        fullWidth
        size="small"
      />
      <TextField
        label="Message"
        value={data.message}
        onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
        fullWidth
        size="small"
        multiline
        rows={4}
        placeholder="Enter the bot message..."
      />
    </Stack>
  );
};

export default MessageConfig;
