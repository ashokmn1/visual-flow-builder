import { Stack, TextField, MenuItem } from '@mui/material';
import { useFlowStore } from '../../store/flowStore';
import type { FlowNode, ApiCallNodeData } from '../../types/nodes';

interface Props {
  node: FlowNode;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const ApiCallConfig = ({ node }: Props) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const data = node.data as ApiCallNodeData;

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
        label="Method"
        select
        value={data.method}
        onChange={(e) => updateNodeData(node.id, { method: e.target.value as ApiCallNodeData['method'] })}
        fullWidth
        size="small"
      >
        {METHODS.map((m) => (
          <MenuItem key={m} value={m}>
            {m}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="URL"
        value={data.url}
        onChange={(e) => updateNodeData(node.id, { url: e.target.value })}
        fullWidth
        size="small"
        placeholder="https://api.example.com/endpoint"
      />
      <TextField
        label="Headers (JSON)"
        value={data.headers}
        onChange={(e) => updateNodeData(node.id, { headers: e.target.value })}
        fullWidth
        size="small"
        multiline
        rows={2}
        placeholder='{"Authorization": "Bearer ..."}'
      />
      <TextField
        label="Body (JSON)"
        value={data.body}
        onChange={(e) => updateNodeData(node.id, { body: e.target.value })}
        fullWidth
        size="small"
        multiline
        rows={3}
        placeholder='{"key": "value"}'
      />
      <TextField
        label="Response Variable"
        value={data.responseVariable}
        onChange={(e) =>
          updateNodeData(node.id, { responseVariable: e.target.value })
        }
        fullWidth
        size="small"
        placeholder="e.g. api_response"
      />
    </Stack>
  );
};

export default ApiCallConfig;
