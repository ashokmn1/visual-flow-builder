import { Stack, TextField, MenuItem } from '@mui/material';
import { useFlowStore } from '../../store/flowStore';
import type { FlowNode, InputNodeData } from '../../types/nodes';

interface Props {
  node: FlowNode;
}

const INPUT_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

const InputConfig = ({ node }: Props) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const data = node.data as InputNodeData;

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
        label="Prompt"
        value={data.prompt}
        onChange={(e) => updateNodeData(node.id, { prompt: e.target.value })}
        fullWidth
        size="small"
        multiline
        rows={3}
        placeholder="What to ask the user..."
      />
      <TextField
        label="Variable Name"
        value={data.variableName}
        onChange={(e) => updateNodeData(node.id, { variableName: e.target.value })}
        fullWidth
        size="small"
        placeholder="e.g. user_email"
      />
      <TextField
        label="Input Type"
        select
        value={data.inputType}
        onChange={(e) => updateNodeData(node.id, { inputType: e.target.value as InputNodeData['inputType'] })}
        fullWidth
        size="small"
      >
        {INPUT_TYPES.map((t) => (
          <MenuItem key={t.value} value={t.value}>
            {t.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
};

export default InputConfig;
