import { type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import styled from 'styled-components';
import { IconButton, Tooltip } from '@mui/material';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { NODE_COLORS } from '../../constants/nodeDefaults';
import type { NodeCategory } from '../../types/nodes';
import { useFlowStore } from '../../store/flowStore';

interface BaseNodeProps {
  id: string;
  nodeType: NodeCategory;
  label: string;
  icon: ReactNode;
  children?: ReactNode;
  selected?: boolean;
  targetHandle?: boolean;
  sourceHandles?: { id: string; label: string; position?: 'left' | 'right' | 'center' }[];
}

const NodeWrapper = styled.div<{ $color: string; $selected: boolean }>`
  background: var(--node-bg, #ffffff);
  border: 2px solid ${(p) => (p.$selected ? p.$color : 'var(--node-border, #e2e8f0)')};
  border-radius: 10px;
  min-width: 200px;
  max-width: 240px;
  box-shadow: ${(p) =>
    p.$selected
      ? `0 0 0 2px ${p.$color}33, 0 4px 12px rgba(0,0,0,0.15)`
      : '0 2px 8px rgba(0,0,0,0.08)'};
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

const NodeHeader = styled.div<{ $color: string }>`
  background: ${(p) => p.$color};
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const HeaderLabel = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NodeBody = styled.div`
  padding: 10px 12px;
  font-size: 13px;
  color: var(--node-text, #334155);
`;

const HandleLabel = styled.div`
  position: absolute;
  font-size: 9px;
  color: var(--node-text-secondary, #94a3b8);
  white-space: nowrap;
  pointer-events: none;
`;

const BaseNode = ({
  id,
  nodeType,
  label,
  icon,
  children,
  selected = false,
  targetHandle = true,
  sourceHandles = [{ id: 'default', label: '', position: 'center' }],
}: BaseNodeProps) => {
  const color = NODE_COLORS[nodeType];
  const deleteNode = useFlowStore((s) => s.deleteNode);

  const getHandleLeft = (position?: string, index?: number, total?: number) => {
    if (total && total > 1 && index !== undefined) {
      return `${((index + 1) / (total + 1)) * 100}%`;
    }
    switch (position) {
      case 'left':
        return '25%';
      case 'right':
        return '75%';
      default:
        return '50%';
    }
  };

  return (
    <NodeWrapper $color={color} $selected={selected}>
      {targetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: color,
            width: 10,
            height: 10,
            border: '2px solid #fff',
          }}
        />
      )}

      <NodeHeader $color={color}>
        {icon}
        <HeaderLabel>{label}</HeaderLabel>
        {nodeType !== 'start' && (
          <Tooltip title="Delete node" placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(id);
              }}
              sx={{ color: '#fff', padding: '2px', '&:hover': { background: 'rgba(255,255,255,0.2)' } }}
            >
              <DeleteOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </NodeHeader>

      {children && <NodeBody>{children}</NodeBody>}

      {sourceHandles.map((handle, index) => (
        <div key={handle.id}>
          <Handle
            type="source"
            position={Position.Bottom}
            id={handle.id}
            style={{
              background: color,
              width: 10,
              height: 10,
              border: '2px solid #fff',
              left: getHandleLeft(handle.position, index, sourceHandles.length),
            }}
          />
          {handle.label && (
            <HandleLabel
              style={{
                bottom: -18,
                left: getHandleLeft(handle.position, index, sourceHandles.length),
                transform: 'translateX(-50%)',
              }}
            >
              {handle.label}
            </HandleLabel>
          )}
        </div>
      ))}
    </NodeWrapper>
  );
};

export default BaseNode;
