import { create } from 'zustand';
import { PipelineStage } from '@/types/pipeline';

interface NotificationNavigationTarget {
  leadId: string;
  policyId: string;
  policyKind: 'vmi' | 'cmi';
  targetStage: PipelineStage;
}

interface NotificationNavigationState {
  target: NotificationNavigationTarget | null;
  setTarget: (target: NotificationNavigationTarget | null) => void;
  clearTarget: () => void;
}

export const useNotificationNavigationStore = create<NotificationNavigationState>((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
  clearTarget: () => set({ target: null }),
}));
