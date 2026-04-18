import type { NodeProps } from '@xyflow/react';
import HttpIcon from '@mui/icons-material/Http';
import { Chip } from '@mui/material';
import BaseNode from './BaseNode';
import type { FlowNode, ApiCallNodeData } from '../../types/nodes';

const ApiCallNode = ({ id, data, selected }: NodeProps<FlowNode>) => {
  const nodeData = data as ApiCallNodeData;

  return (
    <BaseNode
      id={id}
      nodeType="apiCall"
      label={data.label}
      icon={<HttpIcon sx={{ fontSize: 16 }} />}
      selected={selected}
      sourceHandles={[
        { id: 'success', label: 'Success', position: 'left' },
        { id: 'failure', label: 'Failure', position: 'right' },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Chip
            label={nodeData.method}
            size="small"
            color="primary"
            sx={{ fontSize: 10, height: 20, fontWeight: 600 }}
          />
          <span
            style={{
              opacity: nodeData.url ? 1 : 0.5,
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 140,
            }}
          >
            {nodeData.url || 'No URL set'}
          </span>
        </div>
      </div>
    </BaseNode>
  );
};

export default ApiCallNode;
