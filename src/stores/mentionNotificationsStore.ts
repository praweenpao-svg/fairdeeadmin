import { create } from 'zustand';

export interface MentionNotification {
  id: string;
  recipientUserId: string;
  saleId: string;
  policyType?: 'vmi' | 'cmi' | 'vmi+cmi';
  reworkRecordId?: string | null;
  commentId?: string | null;
  mentionTextPreview: string;
  mentionedBy: string;
  mentionedByUserId: string;
  mentionedAt: string;
  read: boolean;
}

type TimeRange = '7d' | '30d' | 'all';

interface MentionNotificationsState {
  notifications: MentionNotification[];
  timeRange: TimeRange;
  userFilter: string | null; // null = current user
  addNotification: (notification: Omit<MentionNotification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setTimeRange: (range: TimeRange) => void;
  setUserFilter: (userId: string | null) => void;
}

export const useMentionNotificationsStore = create<MentionNotificationsState>((set) => ({
  notifications: [],
  timeRange: '7d',
  userFilter: null,
  addNotification: (notification) => set((state) => {
    // Deduplicate: same recipient + same source (rework or comment) = skip
    const isDuplicate = state.notifications.some(
      (n) =>
        n.recipientUserId === notification.recipientUserId &&
        n.mentionedByUserId === notification.mentionedByUserId &&
        n.saleId === notification.saleId &&
        ((notification.reworkRecordId && n.reworkRecordId === notification.reworkRecordId) ||
         (notification.commentId && n.commentId === notification.commentId))
    );
    if (isDuplicate) return state;

    return {
      notifications: [
        {
          ...notification,
          id: crypto.randomUUID(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 200),
    };
  }),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),
  setTimeRange: (range) => set({ timeRange: range }),
  setUserFilter: (userId) => set({ userFilter: userId }),
}));

// Helper to extract mentions from comment text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([\w]+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

// Generate truncated preview (~80 chars) around a mention
export function generateMentionPreview(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}
