import { useState, useCallback, useEffect } from 'react';
import { StickyColumnType } from '@/types/pipeline';

export interface TeamEntry {
  name: string;
  stickyColumn: StickyColumnType | null;
}

const defaultTeamEntries: TeamEntry[] = [
  { name: 'AST RF', stickyColumn: 'RF' },
  { name: 'AST SC', stickyColumn: 'SC' },
  { name: 'DE', stickyColumn: 'DE' },
  { name: 'Admin', stickyColumn: 'Admin' },
  { name: 'Delivery', stickyColumn: 'Delivery' },
];

let globalTeamEntries: TeamEntry[] = [...defaultTeamEntries];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach(listener => listener());
}

export function useTeamsStore() {
  const [teamEntries, setTeamEntriesState] = useState<TeamEntry[]>(globalTeamEntries);

  useEffect(() => {
    const listener = () => setTeamEntriesState([...globalTeamEntries]);
    listeners.add(listener);
    // Sync on mount in case global changed before subscribing
    listener();
    return () => { listeners.delete(listener); };
  }, []);

  const teams = teamEntries.map(t => t.name);

  const addTeam = useCallback((name: string, stickyColumn: StickyColumnType | null = null) => {
    if (!globalTeamEntries.some(t => t.name === name)) {
      globalTeamEntries = [...globalTeamEntries, { name, stickyColumn }];
      notify();
    }
  }, []);

  const updateTeam = useCallback((oldName: string, newName: string, stickyColumn?: StickyColumnType | null) => {
    globalTeamEntries = globalTeamEntries.map(t =>
      t.name === oldName
        ? { name: newName, stickyColumn: stickyColumn !== undefined ? stickyColumn : t.stickyColumn }
        : t
    );
    notify();
    return oldName;
  }, []);

  const deleteTeam = useCallback((teamName: string) => {
    globalTeamEntries = globalTeamEntries.filter(t => t.name !== teamName);
    notify();
    return teamName;
  }, []);

  const getTeamsByStickyColumn = useCallback((col: StickyColumnType): TeamEntry[] => {
    return globalTeamEntries.filter(t => t.stickyColumn === col);
  }, []);

  return {
    teams,
    teamEntries,
    addTeam,
    updateTeam,
    deleteTeam,
    getTeamsByStickyColumn,
  };
}

export const defaultTeams = defaultTeamEntries.map(t => t.name);
