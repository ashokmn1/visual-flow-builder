import type { NodeProps } from '@xyflow/react';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BaseNode from './BaseNode';
import type { FlowNode, ConditionNodeData } from '../../types/nodes';

const ConditionNode = ({ id, data, selected }: NodeProps<FlowNode>) => {
  const nodeData = data as ConditionNodeData;

  return (
    <BaseNode
      id={id}
      nodeType="condition"
      label={data.label}
      icon={<AccountTreeIcon sx={{ fontSize: 16 }} />}
      selected={selected}
      sourceHandles={[
        { id: 'true', label: 'True', position: 'left' },
        { id: 'false', label: 'False', position: 'right' },
      ]}
    >
      <span style={{ opacity: nodeData.variable ? 1 : 0.5, fontSize: 12 }}>
        {nodeData.variable
          ? `${nodeData.variable} ${nodeData.operator} ${nodeData.value}`
          : 'No condition set'}
      </span>
    </BaseNode>
  );
};

export default ConditionNode;
