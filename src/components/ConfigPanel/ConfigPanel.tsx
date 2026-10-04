import { lazy, Suspense } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useFlowStore } from '../../store/flowStore';
import { NODE_COLORS } from '../../constants/nodeDefaults';
import type { NodeCategory } from '../../types/nodes';

// Only one config panel is visible at a time, so each one is split into its
// own chunk and fetched on first use.
const StartConfig = lazy(() => import('./StartConfig'));
const MessageConfig = lazy(() => import('./MessageConfig'));
const ConditionConfig = lazy(() => import('./ConditionConfig'));
const InputConfig = lazy(() => import('./InputConfig'));
const ApiCallConfig = lazy(() => import('./ApiCallConfig'));
const EndConfig = lazy(() => import('./EndConfig'));

const ConfigFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
    <CircularProgress size={24} />
  </Box>
);

const DRAWER_WIDTH = 300;

const ConfigPanel = () => {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!selectedNode;

  const renderConfig = () => {
    if (!selectedNode) return null;

    switch (selectedNode.data.type) {
      case 'start':
        return <StartConfig node={selectedNode} />;
      case 'message':
        return <MessageConfig node={selectedNode} />;
      case 'condition':
        return <ConditionConfig node={selectedNode} />;
      case 'input':
        return <InputConfig node={selectedNode} />;
      case 'apiCall':
        return <ApiCallConfig node={selectedNode} />;
      case 'end':
        return <EndConfig node={selectedNode} />;
      default:
        return null;
    }
  };

  const nodeColor = selectedNode
    ? NODE_COLORS[selectedNode.data.type as NodeCategory]
    : '#3b82f6';

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      variant="persistent"
      sx={{
        width: isOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          position: 'relative',
          border: 'none',
          borderLeft: (t) => `1px solid ${t.palette.divider}`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: nodeColor,
            }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {selectedNode?.data.type
              ? selectedNode.data.type.charAt(0).toUpperCase() +
                selectedNode.data.type.slice(1)
              : ''}
            Node
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setSelectedNode(null)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        <Suspense fallback={<ConfigFallback />}>{renderConfig()}</Suspense>
      </Box>
    </Drawer>
  );
};

export default ConfigPanel;
