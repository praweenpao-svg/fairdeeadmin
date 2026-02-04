import { create } from 'zustand';

export interface MentionNotification {
  id: string;
  saleId: string;
  comment: string;
  mentionedBy: string;
  mentionedAt: string;
  policyKind?: 'vmi' | 'cmi';
  read: boolean;
}

interface MentionNotificationsState {
  notifications: MentionNotification[];
  addNotification: (notification: Omit<MentionNotification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useMentionNotificationsStore = create<MentionNotificationsState>((set) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
      },
      ...state.notifications,
    ].slice(0, 50), // Keep only latest 50
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),
}));

// Helper to extract mentions from comment text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}
