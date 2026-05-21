import { create } from 'zustand';
import { PipelineStage } from '@/types/pipeline';

// Source of a mention — used to render a chip so users can tell if it
// came from a remark thread, a reply on a thread, or an endorsement note.
export type MentionSourceType = 'remark' | 'reply' | 'endorsement';

export interface MentionNotification {
  id: string;
  recipientUserId: string;
  quotationId: string;
  policyType?: 'vmi' | 'cmi';
  reworkRecordId?: string | null;
  commentId?: string | null;
  /** Optional explicit source. If absent, derived from reworkRecordId/commentId. */
  sourceType?: MentionSourceType;
  mentionTextPreview: string;
  mentionedBy: string;
  mentionedByUserId: string;
  mentionedAt: string; // ISO datetime
  read: boolean;
  /** Number of attachments on the source entry. 0 = no indicator. */
  attachmentCount?: number;
  /** Source entry kind — drives row label "Remarks on …" / "Reply on …". */
  entryType?: 'rework' | 'remark' | 'reply';
  /** Source label kind — Lead vs Quotation. Defaults to quotation. */
  sourceKind?: 'lead' | 'quotation';
  // Deep-link data
  leadId?: string;
  policyId?: string;
  targetStage?: PipelineStage;
}

export interface AssignmentNotification {
  id: string;
  assigneeUserId: string;
  quotationId: string;
  /** Policy type. Null/undefined for Lead-level assignments (no VMI/CMI badge). */
  policyType?: 'vmi' | 'cmi';
  /** Source kind — Lead rows render "Lead 000000", Quotation rows render "Quotation 000000". */
  sourceKind?: 'lead' | 'quotation';
  assignedAt: string;
  saleStage: string;
  /** Latest status of the policy when assigned (e.g. 'Pending', 'Submitted'). */
  status?: string;
  /** Who triggered the assignment — a user name, or 'System' for automatic routing. */
  triggeredBy?: string;
  isActive: boolean;
  /** Whether the assignee has acknowledged this notification yet. */
  read?: boolean;
  // Deep-link data
  leadId?: string;
  policyId?: string;
  targetStage?: PipelineStage;
}

/** Derive source-type chip label from notification fields. */
export function getMentionSourceType(n: MentionNotification): MentionSourceType {
  if (n.sourceType) return n.sourceType;
  if (n.reworkRecordId) return 'remark';
  if (n.commentId) return 'reply';
  return 'remark';
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
  markAssignmentAsRead: (id: string) => void;
  markAllAssignmentsAsRead: () => void;
}

// Seed demo mention notifications using real lead/policy IDs from mockLeads
// To Report: ids 15-20, leadNumbers #10012-#10007, policy IDs pol-{id}-vmi/cmi
// To Issue: ids 21-26, leadNumbers #10018-#10013, policy IDs pol-{id}-vmi/cmi
// Pao is DE on To Report lead id=19 (#10008, vmi_cmi)
// To Issue lead id=22 (#10017, vmi_only, has rework), id=24 (#10015, vmi_cmi, has multiple reworks)
const now = new Date();
const seedMentions: MentionNotification[] = [
  {
    id: '1',
    recipientUserId: 'Pao',
    quotationId: '#10017',
    policyType: 'vmi',
    mentionTextPreview: '@Pao ช่วยตรวจสอบเอกสารเพิ่มเติมด้วยครับ ลูกค้าส่งมาใหม่แล้ว',
    mentionedBy: 'Ricky',
    mentionedByUserId: '1',
    mentionedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    read: false,
    reworkRecordId: 'rw-1',
    commentId: null,
    attachmentCount: 3,
    entryType: 'rework',
    sourceKind: 'quotation',
    // Deep-link data
    leadId: '22',
    policyId: 'pol-22-vmi',
    targetStage: 'to_issue' as const,
  },
  {
    id: '2',
    recipientUserId: 'Pao',
    quotationId: '#10015',
    policyType: 'cmi',
    mentionTextPreview: '@Pao กรุณาตรวจสอบค่าเบี้ยประกันภัย CMI ให้ด้วยค่ะ',
    mentionedBy: 'Jenny',
    mentionedByUserId: '2',
    mentionedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
    read: false,
    reworkRecordId: null,
    commentId: 'cmt-1',
    leadId: '24',
    policyId: 'pol-24-cmi',
    targetStage: 'to_issue' as const,
  },
  {
    id: '3',
    recipientUserId: 'Pao',
    quotationId: '#10008',
    policyType: 'vmi',
    mentionTextPreview: '@Pao เรื่องนี้จัดการเสร็จแล้วครับ ขอให้ช่วย verify อีกครั้ง',
    mentionedBy: 'Lisa',
    mentionedByUserId: '5',
    mentionedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    read: true,
    reworkRecordId: null,
    commentId: 'cmt-3',
    leadId: '19',
    policyId: 'pol-19-vmi',
    targetStage: 'to_report' as const,
  },
  {
    id: '4',
    recipientUserId: 'Pao',
    quotationId: '#10015',
    policyType: 'vmi',
    mentionTextPreview: '@Pao ลูกค้าต้องการเปลี่ยนแปลงรายละเอียดกรมธรรม์ VMI rework',
    mentionedBy: 'Mike',
    mentionedByUserId: '3',
    mentionedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    read: true,
    reworkRecordId: 'rw-4',
    commentId: null,
    leadId: '24',
    policyId: 'pol-24-vmi',
    targetStage: 'to_issue' as const,
  },
];

const seedAssignments: AssignmentNotification[] = [
  {
    id: 'a1',
    assigneeUserId: 'Pao',
    quotationId: '#10008',
    policyType: 'vmi',
    assignedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    saleStage: 'To Report',
    status: 'pending_payment',
    triggeredBy: 'System',
    isActive: true,
    read: false,
    leadId: '19',
    policyId: 'pol-19-vmi',
    targetStage: 'to_report' as const,
  },
  {
    id: 'a2',
    assigneeUserId: 'Pao',
    quotationId: '#10008',
    policyType: 'cmi',
    assignedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    saleStage: 'To Report',
    status: 'pending_payment',
    triggeredBy: 'System',
    isActive: true,
    read: false,
    leadId: '19',
    policyId: 'pol-19-cmi',
    targetStage: 'to_report' as const,
  },
  {
    id: 'a3',
    assigneeUserId: 'Pao',
    quotationId: '#10017',
    policyType: 'vmi',
    assignedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
    saleStage: 'To Issue',
    status: 'pending_review',
    triggeredBy: 'Ricky',
    isActive: true,
    read: true,
    leadId: '22',
    policyId: 'pol-22-vmi',
    targetStage: 'to_issue' as const,
  },
  {
    id: 'a4',
    assigneeUserId: 'Pao',
    quotationId: '#10012',
    sourceKind: 'lead',
    assignedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    saleStage: 'New Lead',
    status: 'new_lead',
    triggeredBy: 'System',
    isActive: true,
    read: false,
    leadId: '15',
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
  markAssignmentAsRead: (id) => set((state) => ({
    assignments: state.assignments.map((a) =>
      a.id === id ? { ...a, read: true } : a
    ),
  })),
  markAllAssignmentsAsRead: () => set((state) => ({
    assignments: state.assignments.map((a) => ({ ...a, read: true })),
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
