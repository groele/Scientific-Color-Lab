import { useHistoryStore } from '@/stores/history-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function useWorkspaceHistory() {
  const entries = useHistoryStore((state) => state.entries);
  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);
  const undo = useWorkspaceStore((state) => state.undo);
  const redo = useWorkspaceStore((state) => state.redo);

  return {
    entries,
    canUndo,
    canRedo,
    undo,
    redo,
  };
}
