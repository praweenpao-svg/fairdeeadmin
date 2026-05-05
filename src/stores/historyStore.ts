import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCurrentUserStore } from './currentUserStore';

export type HistoryEventType =
  | 'rework'
  | 'remark'
  | 'status_change'
  | 'assignment'
  | 'field_update';

export interface HistoryEntry {
  id: string;
  type: HistoryEventType;
  user: string;
  timestamp: string;
  description: string;
  policyKind?: 'vmi' | 'cmi';
  resolved?: boolean;
}

interface HistoryState {
  entries: HistoryEntry[];
  add: (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'user'> & {
    user?: string;
    timestamp?: string;
  }) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((state) => ({
          entries: [
            {
              id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: entry.timestamp ?? new Date().toISOString(),
              user: entry.user ?? useCurrentUserStore.getState().name,
              ...entry,
            },
            ...state.entries,
          ],
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'ops-history-store' },
  ),
);
