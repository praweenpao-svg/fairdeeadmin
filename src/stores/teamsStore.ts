import { useState, useCallback } from 'react';

// Default teams
const defaultTeams = ['AST RF', 'AST SC', 'DE', 'Admin', 'Delivery'];

// Simple global state for teams (shared between components)
let globalTeams = [...defaultTeams];
let listeners: Set<() => void> = new Set();

export function useTeamsStore() {
  const [teams, setTeamsState] = useState<string[]>(globalTeams);

  const subscribe = useCallback(() => {
    const listener = () => setTeamsState([...globalTeams]);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  // Subscribe on mount
  useState(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  });

  const setTeams = useCallback((newTeams: string[]) => {
    globalTeams = newTeams;
    listeners.forEach(listener => listener());
  }, []);

  const addTeam = useCallback((team: string) => {
    if (!globalTeams.includes(team)) {
      globalTeams = [...globalTeams, team];
      listeners.forEach(listener => listener());
    }
  }, []);

  const updateTeam = useCallback((oldName: string, newName: string) => {
    globalTeams = globalTeams.map(t => t === oldName ? newName : t);
    listeners.forEach(listener => listener());
    return oldName; // Return old name for updating related data
  }, []);

  const deleteTeam = useCallback((team: string) => {
    globalTeams = globalTeams.filter(t => t !== team);
    listeners.forEach(listener => listener());
    return team; // Return deleted team for updating related data
  }, []);

  return { teams, setTeams, addTeam, updateTeam, deleteTeam };
}

export { defaultTeams };
