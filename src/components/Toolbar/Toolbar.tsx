import { useRef } from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Tooltip,
  Typography,
  Divider,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useFlowStore } from '../../store/flowStore';
import { useTemporalStore } from '../../hooks/useUndoRedo';
import { useExportImport } from '../../hooks/useExportImport';

const Toolbar = () => {
  const themeMode = useFlowStore((s) => s.themeMode);
  const toggleTheme = useFlowStore((s) => s.toggleTheme);
  const { undo, redo, pastStates, futureStates } = useTemporalStore();
  const { exportFlow, importFlow } = useExportImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFlow(file);
      e.target.value = '';
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: (t) => t.palette.background.paper,
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        color: (t) => t.palette.text.primary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: '6px 16px',
        gap: 1,
        minHeight: 48,
      }}
    >
      <AccountTreeIcon color="primary" sx={{ fontSize: 22, mr: 0.5 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 2 }}>
        Flow Builder
      </Typography>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Undo (Ctrl+Z)">
        <span>
          <IconButton size="small" onClick={() => undo()} disabled={!canUndo}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo (Ctrl+Shift+Z)">
        <span>
          <IconButton size="small" onClick={() => redo()} disabled={!canRedo}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Export flow as JSON">
        <IconButton size="small" onClick={exportFlow}>
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Import flow from JSON">
        <IconButton size="small" onClick={handleImportClick}>
          <FileUploadIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Box sx={{ flex: 1 }} />

      <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
        <IconButton size="small" onClick={toggleTheme}>
          {themeMode === 'light' ? (
            <DarkModeIcon fontSize="small" />
          ) : (
            <LightModeIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </AppBar>
  );
};

export default Toolbar;
