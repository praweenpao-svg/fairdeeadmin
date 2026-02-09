import { create } from 'zustand';
import { mockStaffMembers } from '@/data/mockStaff';

interface CurrentUserState {
  name: string;
  team: string | null;
  setUser: (name: string) => void;
}

const defaultUser = mockStaffMembers.find(s => s.name === 'Pao')!;

export const useCurrentUserStore = create<CurrentUserState>((set) => ({
  name: defaultUser.name,
  team: defaultUser.team,
  setUser: (name: string) => {
    const staff = mockStaffMembers.find(s => s.name === name);
    set({ name, team: staff?.team ?? null });
  },
}));
