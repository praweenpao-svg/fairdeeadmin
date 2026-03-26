import { create } from 'zustand';

export interface MentionNotification {
  id: string;
  recipientUserId: string;
  quotationId: string;
  policyType?: 'vmi' | 'cmi';
  reworkRecordId?: string | null;
  commentId?: string | null;
  mentionTextPreview: string;
  mentionedBy: string;
  mentionedByUserId: string;
  mentionedAt: string; // ISO datetime
  read: boolean;
}

export interface AssignmentNotification {
  id: string;
  assigneeUserId: string;
  quotationId: string;
  policyType: 'vmi' | 'cmi';
  assignedAt: string;
  saleStage: string;
  isActive: boolean;
}

interface MentionNotificationsState {
  notifications: MentionNotification[];
  assignments: AssignmentNotification[];
  unreadOnlyFilter: boolean;
  addNotification: (notification: Omit<MentionNotification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setUnreadOnlyFilter: (on: boolean) => void;
  addAssignment: (assignment: Omit<AssignmentNotification, 'id'>) => void;
  removeAssignment: (quotationId: string, policyType: 'vmi' | 'cmi') => void;
}

// Seed some demo mention notifications
const now = new Date();
const seedMentions: MentionNotification[] = [
  {
    id: '1',
    recipientUserId: 'Pao',
    quotationId: 'FR-2025-001',
    policyType: 'vmi',
    mentionTextPreview: '@Pao ช่วยตรวจสอบเอกสารเพิ่มเติมด้วยครับ ลูกค้าส่งมาใหม่แล้ว',
    mentionedBy: 'Ricky',
    mentionedByUserId: '1',
    mentionedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    read: false,
    reworkRecordId: 'rw-1',
    commentId: null,
  },
  {
    id: '2',
    recipientUserId: 'Pao',
    quotationId: 'FR-2025-003',
    policyType: 'cmi',
    mentionTextPreview: '@Pao กรุณาตรวจสอบค่าเบี้ยประกันภัย CMI ให้ด้วยค่ะ',
    mentionedBy: 'Jenny',
    mentionedByUserId: '2',
    mentionedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
    read: false,
    reworkRecordId: null,
    commentId: 'cmt-1',
  },
  {
    id: '3',
    recipientUserId: 'Pao',
    quotationId: 'FR-2025-007',
    policyType: 'vmi',
    mentionTextPreview: '@Pao เรื่องนี้จัดการเสร็จแล้วครับ ขอให้ช่วย verify อีกครั้ง',
    mentionedBy: 'Tong',
    mentionedByUserId: '5',
    mentionedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    read: true,
    reworkRecordId: 'rw-3',
    commentId: null,
  },
  {
    id: '4',
    recipientUserId: 'Pao',
    quotationId: 'FR-2025-012',
    policyType: 'cmi',
    mentionTextPreview: '@Pao ลูกค้าต้องการเปลี่ยนแปลงรายละเอียดกรมธรรม์',
    mentionedBy: 'Fern',
    mentionedByUserId: '3',
    mentionedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    read: true,
    reworkRecordId: null,
    commentId: 'cmt-4',
  },
];

const seedAssignments: AssignmentNotification[] = [
  {
    id: 'a1',
    assigneeUserId: 'Pao',
    quotationId: 'FR-2025-001',
    policyType: 'vmi',
    assignedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    saleStage: 'Pending Issuance',
    isActive: true,
  },
  {
    id: 'a2',
    assigneeUserId: 'Pao',
    quotationId: 'FR-2025-001',
    policyType: 'cmi',
    assignedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    saleStage: 'Pending Issuance',
    isActive: true,
  },
  {
    id: 'a3',
    assigneeUserId: 'Pao',
    quotationId: 'FR-2025-003',
    policyType: 'vmi',
    assignedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
    saleStage: 'Policy Uploaded',
    isActive: true,
  },
];

export const useMentionNotificationsStore = create<MentionNotificationsState>((set) => ({
  notifications: seedMentions,
  assignments: seedAssignments,
  unreadOnlyFilter: false,
  addNotification: (notification) => set((state) => {
    // Deduplicate: same recipient + same source (rework or comment) = skip
    const isDuplicate = state.notifications.some(
      (n) =>
        n.recipientUserId === notification.recipientUserId &&
        n.mentionedByUserId === notification.mentionedByUserId &&
        n.quotationId === notification.quotationId &&
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
  setUnreadOnlyFilter: (on) => set({ unreadOnlyFilter: on }),
  addAssignment: (assignment) => set((state) => ({
    assignments: [
      { ...assignment, id: crypto.randomUUID() },
      ...state.assignments,
    ],
  })),
  removeAssignment: (quotationId, policyType) => set((state) => ({
    assignments: state.assignments.filter(
      (a) => !(a.quotationId === quotationId && a.policyType === policyType)
    ),
  })),
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
