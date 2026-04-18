import { TextField } from '@mui/material';
import { useFlowStore } from '../../store/flowStore';
import type { FlowNode } from '../../types/nodes';

interface Props {
  node: FlowNode;
}

const StartConfig = ({ node }: Props) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  return (
    <TextField
      label="Label"
      value={node.data.label}
      onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
      fullWidth
      size="small"
    />
  );
};

export default StartConfig;
