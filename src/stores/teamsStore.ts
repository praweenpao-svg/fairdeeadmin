import { useState, useCallback } from 'react';
import { StickyColumnType } from '@/types/pipeline';

export interface TeamEntry {
  name: string;
  stickyColumn: StickyColumnType | null;
}

// Default teams with sticky column mapping
const defaultTeamEntries: TeamEntry[] = [
  { name: 'AST RF', stickyColumn: 'RF' },
  { name: 'AST SC', stickyColumn: 'SC' },
  { name: 'DE', stickyColumn: 'DE' },
  { name: 'Admin', stickyColumn: 'Admin' },
  { name: 'Delivery', stickyColumn: 'Delivery' },
];

// Simple global state for teams (shared between components)
let globalTeamEntries: TeamEntry[] = [...defaultTeamEntries];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach(listener => listener());
}

export function useTeamsStore() {
  const [teamEntries, setTeamEntriesState] = useState<TeamEntry[]>(globalTeamEntries);

  const subscribe = useCallback(() => {
    const listener = () => setTeamEntriesState([...globalTeamEntries]);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  // Subscribe on mount
  useState(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  });

  // Derived: plain team name list for backward compat
  const teams = teamEntries.map(t => t.name);

  const setTeams = useCallback((newTeams: string[]) => {
    globalTeamEntries = newTeams.map(name => {
      const existing = globalTeamEntries.find(t => t.name === name);
      return existing || { name, stickyColumn: null };
    });
    notify();
  }, []);

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

  const updateTeamStickyColumn = useCallback((teamName: string, stickyColumn: StickyColumnType | null) => {
    globalTeamEntries = globalTeamEntries.map(t =>
      t.name === teamName ? { ...t, stickyColumn } : t
    );
    notify();
  }, []);

  const deleteTeam = useCallback((teamName: string) => {
    globalTeamEntries = globalTeamEntries.filter(t => t.name !== teamName);
    notify();
    return teamName;
  }, []);

  const getTeamByStickyColumn = useCallback((col: StickyColumnType): TeamEntry | undefined => {
    return globalTeamEntries.find(t => t.stickyColumn === col);
  }, []);

  const getTeamsByStickyColumn = useCallback((col: StickyColumnType): TeamEntry[] => {
    return globalTeamEntries.filter(t => t.stickyColumn === col);
  }, []);

  return {
    teams,
    teamEntries,
    setTeams,
    addTeam,
    updateTeam,
    updateTeamStickyColumn,
    deleteTeam,
    getTeamByStickyColumn,
    getTeamsByStickyColumn,
  };
}

export const defaultTeams = defaultTeamEntries.map(t => t.name);
