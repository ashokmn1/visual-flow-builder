import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useFlowStore } from '../../store/flowStore';

const AnimatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) => {
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });

  const handleDelete = () => {
    onEdgesChange([{ id, type: 'remove' }]);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#94a3b8',
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                background: '#ef4444',
                color: '#fff',
                width: 22,
                height: 22,
                '&:hover': { background: '#dc2626' },
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default AnimatedEdge;
