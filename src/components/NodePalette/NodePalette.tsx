import type { DragEvent } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import styled from 'styled-components';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import InputIcon from '@mui/icons-material/Input';
import HttpIcon from '@mui/icons-material/Http';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { NODE_COLORS, NODE_LABELS } from '../../constants/nodeDefaults';
import type { NodeCategory } from '../../types/nodes';

const PaletteItem = styled.div<{
  $color: string;
  $bg: string;
  $border: string;
  $text: string;
}>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: grab;
  border: 1px solid ${(p) => p.$border};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$text};
  transition: all 0.15s ease;
  user-select: none;

  &:hover {
    border-color: ${(p) => p.$color};
    box-shadow: 0 2px 8px ${(p) => p.$color}22;
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NODE_ICONS: Record<NodeCategory, React.ReactNode> = {
  message: <ChatBubbleOutlinedIcon sx={{ fontSize: 18 }} />,
  condition: <AccountTreeIcon sx={{ fontSize: 18 }} />,
  input: <InputIcon sx={{ fontSize: 18 }} />,
  apiCall: <HttpIcon sx={{ fontSize: 18 }} />,
  end: <StopCircleIcon sx={{ fontSize: 18 }} />,
};

const nodeCategories: NodeCategory[] = [
  'message',
  'condition',
  'input',
  'apiCall',
  'end',
];

const NodePalette = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const itemBg = isDark ? theme.palette.background.default : '#ffffff';
  const itemBorder = theme.palette.divider;
  const itemText = theme.palette.text.primary;

  const onDragStart = (event: DragEvent, nodeType: NodeCategory) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Box
      sx={{
        width: 220,
        borderRight: (t) => `1px solid ${t.palette.divider}`,
        background: (t) => t.palette.background.paper,
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflowY: 'auto',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'text.secondary',
          mb: 0.5,
          px: 0.5,
        }}
      >
        Drag to add
      </Typography>
      {nodeCategories.map((type) => (
        <PaletteItem
          key={type}
          $color={NODE_COLORS[type]}
          $bg={itemBg}
          $border={itemBorder}
          $text={itemText}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
        >
          <IconWrapper $color={NODE_COLORS[type]}>
            {NODE_ICONS[type]}
          </IconWrapper>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {NODE_LABELS[type]}
          </Typography>
        </PaletteItem>
      ))}
    </Box>
  );
};

export default NodePalette;
