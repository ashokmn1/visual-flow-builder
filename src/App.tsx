import { useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { ReactFlowProvider } from '@xyflow/react';
import { lightTheme, darkTheme } from './theme';
import { useFlowStore } from './store/flowStore';
import { useUndoRedoKeyboard } from './hooks/useUndoRedo';
import { sampleNodes, sampleEdges } from './utils/sampleFlow';
import Toolbar from './components/Toolbar/Toolbar';
import NodePalette from './components/NodePalette/NodePalette';
import FlowCanvas from './components/FlowCanvas/FlowCanvas';
import ConfigPanel from './components/ConfigPanel/ConfigPanel';
import RunPanel from './components/RunPanel/RunPanel';
import { useRunStore } from './store/runStore';

const AppContent = () => {
  useUndoRedoKeyboard();

  const nodes = useFlowStore((s) => s.nodes);
  const setFlow = useFlowStore((s) => s.setFlow);
  const isRunMode = useRunStore((s) => s.isRunMode);

  useEffect(() => {
    if (nodes.length === 0) {
      setFlow(sampleNodes, sampleEdges);
      // The initial load is not an undoable action; otherwise Undo could
      // roll back to an empty canvas with no Start node.
      useFlowStore.temporal.getState().clear();
    }
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Toolbar />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NodePalette />
        <Box sx={{ flex: 1, position: 'relative' }}>
          <FlowCanvas />
        </Box>
        {isRunMode && <RunPanel />}
        <ConfigPanel />
      </Box>
    </Box>
  );
};

const App = () => {
  const themeMode = useFlowStore((s) => s.themeMode);
  const theme = useMemo(
    () => (themeMode === 'dark' ? darkTheme : lightTheme),
    [themeMode]
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReactFlowProvider>
        <AppContent />
      </ReactFlowProvider>
    </ThemeProvider>
  );
};

export default App;
