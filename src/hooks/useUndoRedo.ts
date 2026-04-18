import { useEffect } from 'react';
import { useFlowStore } from '../store/flowStore';

type StoreState = ReturnType<typeof useFlowStore.getState>;

export const useTemporalStore = () => {
  const store = useFlowStore.temporal as unknown as {
    getState: () => {
      undo: () => void;
      redo: () => void;
      pastStates: Partial<StoreState>[];
      futureStates: Partial<StoreState>[];
    };
  };
  return store.getState();
};

export const useUndoRedoKeyboard = () => {
  const { undo, redo } = useTemporalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (isMeta && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
};
