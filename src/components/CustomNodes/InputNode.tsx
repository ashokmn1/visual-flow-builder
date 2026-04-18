import type { NodeProps } from '@xyflow/react';
import InputIcon from '@mui/icons-material/Input';
import { Chip } from '@mui/material';
import BaseNode from './BaseNode';
import type { FlowNode, InputNodeData } from '../../types/nodes';

const InputNode = ({ id, data, selected }: NodeProps<FlowNode>) => {
  const nodeData = data as InputNodeData;

  return (
    <BaseNode
      id={id}
      nodeType="input"
      label={data.label}
      icon={<InputIcon sx={{ fontSize: 16 }} />}
      selected={selected}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ opacity: nodeData.prompt ? 1 : 0.5, fontSize: 12 }}>
          {nodeData.prompt || 'No prompt set'}
        </span>
        <Chip
          label={nodeData.inputType}
          size="small"
          sx={{ alignSelf: 'flex-start', fontSize: 10, height: 20 }}
        />
      </div>
    </BaseNode>
  );
};

export default InputNode;
