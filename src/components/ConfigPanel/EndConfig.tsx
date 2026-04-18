import { Stack, TextField } from '@mui/material';
import { useFlowStore } from '../../store/flowStore';
import type { FlowNode, EndNodeData } from '../../types/nodes';

interface Props {
  node: FlowNode;
}

const EndConfig = ({ node }: Props) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const data = node.data as EndNodeData;

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
        label="End Message"
        value={data.endMessage}
        onChange={(e) => updateNodeData(node.id, { endMessage: e.target.value })}
        fullWidth
        size="small"
        multiline
        rows={3}
        placeholder="Goodbye message..."
      />
    </Stack>
  );
};

export default EndConfig;
