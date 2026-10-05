import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  Alert,
  Box,
  Chip,
  Collapse,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import SendIcon from '@mui/icons-material/Send';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { useRunStore, type ChatMessage } from '../../store/runStore';
import { useFlowStore } from '../../store/flowStore';
import { START_COLOR } from '../../constants/nodeDefaults';
import type { RunStatus, SystemTone } from '../../engine/interpreter';

export const RUN_PANEL_WIDTH = 360;

const STATUS_META: Record<RunStatus, { label: string; color: string }> = {
  idle: { label: 'Stopped', color: '#94a3b8' },
  running: { label: 'Running', color: START_COLOR },
  waitingForInput: { label: 'Waiting for you', color: '#8b5cf6' },
  finished: { label: 'Finished', color: '#3b82f6' },
  error: { label: 'Error', color: '#ef4444' },
};

const TONE_COLORS: Record<SystemTone, string> = {
  info: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
};

const INPUT_HINTS: Record<string, string> = {
  text: 'Type your reply…',
  number: 'Enter a number…',
  email: 'Enter an email address…',
  phone: 'Enter a phone number…',
};

const Bubble = ({ message }: { message: ChatMessage }) => {
  const theme = useTheme();
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);
  const isDark = theme.palette.mode === 'dark';
  const focusNode = () => message.nodeId && setSelectedNode(message.nodeId);

  if (message.role === 'system') {
    const color = TONE_COLORS[message.tone ?? 'info'];
    return (
      <Box
        onClick={focusNode}
        sx={{
          display: 'flex',
          gap: 0.75,
          alignItems: 'flex-start',
          px: 1,
          py: 0.25,
          cursor: message.nodeId ? 'pointer' : 'default',
          '&:hover': { opacity: 0.8 },
        }}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: color, mt: '7px', flexShrink: 0 }} />
        <Typography
          variant="caption"
          sx={{ color: isDark ? theme.palette.text.secondary : color, lineHeight: 1.5, wordBreak: 'break-word' }}
        >
          {message.text}
        </Typography>
      </Box>
    );
  }

  const isUser = message.role === 'user';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 1,
        px: 0.5,
      }}
    >
      {!isUser && (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: `${theme.palette.primary.main}22`,
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SmartToyOutlinedIcon sx={{ fontSize: 14 }} />
        </Box>
      )}
      <Box
        onClick={focusNode}
        sx={{
          maxWidth: '78%',
          px: 1.5,
          py: 1,
          borderRadius: 2.5,
          borderBottomLeftRadius: isUser ? 10 : 4,
          borderBottomRightRadius: isUser ? 4 : 10,
          background: isUser
            ? theme.palette.primary.main
            : isDark
              ? theme.palette.background.default
              : '#f1f5f9',
          color: isUser ? '#fff' : theme.palette.text.primary,
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          cursor: message.nodeId ? 'pointer' : 'default',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        {message.text}
      </Box>
    </Box>
  );
};

const RunPanel = () => {
  const status = useRunStore((s) => s.status);
  const messages = useRunStore((s) => s.messages);
  const variables = useRunStore((s) => s.variables);
  const pendingInput = useRunStore((s) => s.pendingInput);
  const isStale = useRunStore((s) => s.isStale);
  const startRun = useRunStore((s) => s.startRun);
  const stopRun = useRunStore((s) => s.stopRun);
  const submitInput = useRunStore((s) => s.submitInput);
  const closeRunMode = useRunStore((s) => s.closeRunMode);

  const [draft, setDraft] = useState('');
  const [showVariables, setShowVariables] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWaiting = status === 'waitingForInput';
  const isActive = status === 'running' || isWaiting;
  const meta = STATUS_META[status];
  const variableCount = Object.keys(variables).length;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, status]);

  useEffect(() => {
    if (isWaiting) inputRef.current?.focus();
  }, [isWaiting]);

  const send = () => {
    if (!isWaiting || !draft.trim()) return;
    submitInput(draft);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const placeholder = isWaiting
    ? INPUT_HINTS[pendingInput?.inputType ?? 'text']
    : status === 'running'
      ? 'The bot is working…'
      : status === 'finished'
        ? 'Flow finished. Restart to try again.'
        : status === 'error'
          ? 'Run ended with an error.'
          : 'Run stopped.';

  return (
    <Box
      sx={{
        width: RUN_PANEL_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: (t) => `1px solid ${t.palette.divider}`,
        background: (t) => t.palette.background.paper,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
          Preview
        </Typography>
        <Chip
          size="small"
          label={meta.label}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            background: meta.color,
            '& .MuiChip-label': { px: 1 },
          }}
        />
        {isActive ? (
          <Tooltip title="Stop run">
            <IconButton size="small" onClick={stopRun}>
              <StopRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Restart from the beginning">
            <IconButton size="small" onClick={startRun}>
              <ReplayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Close preview">
          <IconButton size="small" onClick={closeRunMode}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {isStale && (
        <Alert
          severity="info"
          icon={false}
          action={
            <IconButton size="small" color="inherit" onClick={startRun} aria-label="Restart run">
              <ReplayIcon fontSize="small" />
            </IconButton>
          }
          sx={{ borderRadius: 0, py: 0, fontSize: 12, alignItems: 'center' }}
        >
          The flow changed. Restart to run the latest version.
        </Alert>
      )}

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
        }}
      >
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            Starting from the “Start here” node…
          </Typography>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        {status === 'running' && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontStyle: 'italic' }}>
            Bot is typing…
          </Typography>
        )}
      </Box>

      <Box sx={{ borderTop: (t) => `1px solid ${t.palette.divider}` }}>
        <Box
          onClick={() => setShowVariables((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 2,
            py: 0.75,
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { background: (t) => t.palette.action.hover },
          }}
        >
          <DataObjectIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
            Variables ({variableCount})
          </Typography>
          {showVariables ? (
            <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          ) : (
            <ExpandLessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          )}
        </Box>
        <Collapse in={showVariables}>
          <Box
            component="pre"
            sx={{
              m: 0,
              px: 2,
              pb: 1.5,
              maxHeight: 180,
              overflow: 'auto',
              fontSize: 11,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: 'text.secondary',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {variableCount === 0 ? 'No variables set yet.' : JSON.stringify(variables, null, 2)}
          </Box>
        </Collapse>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 1.5,
          borderTop: (t) => `1px solid ${t.palette.divider}`,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          inputRef={inputRef}
          size="small"
          fullWidth
          multiline
          maxRows={4}
          value={draft}
          disabled={!isWaiting}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          slotProps={{
            htmlInput: {
              inputMode: pendingInput?.inputType === 'number' ? 'decimal' : undefined,
              'aria-label': 'Your reply',
            },
          }}
        />
        <Tooltip title="Send (Enter)">
          <span>
            <IconButton
              color="primary"
              onClick={send}
              disabled={!isWaiting || !draft.trim()}
              sx={{
                background: (t) => t.palette.primary.main,
                color: '#fff',
                '&:hover': { background: (t) => t.palette.primary.dark },
                '&.Mui-disabled': { background: (t) => t.palette.action.disabledBackground },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default RunPanel;
