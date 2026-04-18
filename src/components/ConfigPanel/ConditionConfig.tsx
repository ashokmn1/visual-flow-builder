import { Stack, TextField, MenuItem } from '@mui/material';
import { useFlowStore } from '../../store/flowStore';
import type { FlowNode, ConditionNodeData } from '../../types/nodes';

interface Props {
  node: FlowNode;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'isEmpty', label: 'Is Empty' },
];

const ConditionConfig = ({ node }: Props) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const data = node.data as ConditionNodeData;

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
        label="Variable"
        value={data.variable}
        onChange={(e) => updateNodeData(node.id, { variable: e.target.value })}
        fullWidth
        size="small"
        placeholder="e.g. user_input"
      />
      <TextField
        label="Operator"
        select
        value={data.operator}
        onChange={(e) => updateNodeData(node.id, { operator: e.target.value as ConditionNodeData['operator'] })}
        fullWidth
        size="small"
      >
        {OPERATORS.map((op) => (
          <MenuItem key={op.value} value={op.value}>
            {op.label}
          </MenuItem>
        ))}
      </TextField>
      {data.operator !== 'isEmpty' && (
        <TextField
          label="Value"
          value={data.value}
          onChange={(e) => updateNodeData(node.id, { value: e.target.value })}
          fullWidth
          size="small"
          placeholder="Compare value"
        />
      )}
    </Stack>
  );
};

export default ConditionConfig;
