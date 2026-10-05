import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useFlowStore, isStartNode } from '../../store/flowStore';
import { START_COLOR } from '../../constants/nodeDefaults';
import type { FlowNode } from '../../types/nodes';

interface Props {
  node: FlowNode;
}

/**
 * Lets the user move the flow's single "Start here" chip onto this node.
 * The current start node cannot be switched off directly; the chip moves
 * when another node is marked as the start.
 */
const StartHereToggle = ({ node }: Props) => {
  const setStartNode = useFlowStore((s) => s.setStartNode);
  const isStart = isStartNode(node);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${isStart ? START_COLOR : 'transparent'}`,
        background: `${START_COLOR}14`,
      }}
    >
      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Switch
            size="small"
            checked={isStart}
            disabled={isStart}
            onChange={() => setStartNode(node.id)}
            sx={{
              '& .Mui-checked': { color: START_COLOR },
              '& .Mui-checked + .MuiSwitch-track': { backgroundColor: START_COLOR },
            }}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
            <PlayArrowIcon sx={{ fontSize: 16, color: START_COLOR }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Start here
            </Typography>
          </Box>
        }
      />
      <Typography variant="caption" color="text.secondary">
        {isStart
          ? 'This node is the entry point. Mark another node to move the start.'
          : 'Make this node the entry point of the flow.'}
      </Typography>
    </Box>
  );
};

export default StartHereToggle;
