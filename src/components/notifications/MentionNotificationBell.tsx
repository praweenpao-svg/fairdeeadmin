import { useState, useMemo } from 'react';
import { Bell, Paperclip, ArrowDownUp, Inbox, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useMentionNotificationsStore,
  MentionNotification,
  AssignmentNotification,
} from '@/stores/mentionNotificationsStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentUserStore } from '@/stores/currentUserStore';
import { useNotificationNavigationStore } from '@/stores/notificationNavigationStore';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

function formatDateTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hh}:${mm}`;
  } catch {
    return timestamp;
  }
}

function stripHash(id: string): string {
  return id.startsWith('#') ? id.slice(1) : id;
}

type SortDir = 'desc' | 'asc';

export function MentionNotificationBell() {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === 'th' ? th : en);
  const currentUser = useCurrentUserStore();
  const {
    notifications, assignments, markAsRead, markAllAsRead,
    unreadOnlyFilter, setUnreadOnlyFilter,
    markAssignmentAsRead,
  } = useMentionNotificationsStore();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignment' | 'mention'>('assignment');
  const [assignmentSort, setAssignmentSort] = useState<SortDir>('desc');
  const [mentionSort, setMentionSort] = useState<SortDir>('desc');

  // 30-day window for mentions (R-25)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const myMentions = useMemo(() => notifications.filter((n) => {
    if (n.recipientUserId !== currentUser.name) return false;
    try {
      // Unread retained indefinitely; read auto-cleared after 30 days
      if (n.read && new Date(n.mentionedAt) < thirtyDaysAgo) return false;
    } catch { /* keep */ }
    return true;
  }), [notifications, currentUser.name]);

  const visibleMentions = unreadOnlyFilter ? myMentions.filter((n) => !n.read) : myMentions;
  const sortedMentions = [...visibleMentions].sort((a, b) => {
    const diff = new Date(b.mentionedAt).getTime() - new Date(a.mentionedAt).getTime();
    return mentionSort === 'desc' ? diff : -diff;
  });

  // R-10: Assignment badge = ALL active assignments (not unread-only)
  const myAssignments = useMemo(() => assignments
    .filter((a) => a.assigneeUserId === currentUser.name && a.isActive)
    .sort((a, b) => {
      const diff = new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      return assignmentSort === 'desc' ? diff : -diff;
    }), [assignments, currentUser.name, assignmentSort]);

  const assignmentCount = myAssignments.length;
  const unreadMentionCount = myMentions.filter((n) => !n.read).length;
  // R-03: combined count
  const totalCount = assignmentCount + unreadMentionCount;
  const badgeLabel = totalCount === 0 ? '' : totalCount > 9 ? '9+' : String(totalCount);

  const setNavTarget = useNotificationNavigationStore(s => s.setTarget);

  const handleMentionClick = (n: MentionNotification) => {
    markAsRead(n.id);
    setOpen(false);
    if (n.leadId && n.policyId && n.targetStage) {
      setNavTarget({
        leadId: n.leadId,
        policyId: n.policyId,
        policyKind: n.policyType || 'vmi',
        targetStage: n.targetStage,
      });
    } else {
      toast.info(`Opening ${n.quotationId}...`);
    }
  };

  const handleAssignmentClick = (a: AssignmentNotification) => {
    markAssignmentAsRead(a.id);
    setOpen(false);
    // Lead row → listing pre-searched; Quotation row → H&A log
    if (a.sourceKind === 'lead') {
      toast.info(t(`Opening lead ${stripHash(a.quotationId)}...`, `กำลังเปิด lead ${stripHash(a.quotationId)}...`));
      return;
    }
    if (a.leadId && a.policyId && a.targetStage && a.policyType) {
      setNavTarget({
        leadId: a.leadId,
        policyId: a.policyId,
        policyKind: a.policyType,
        targetStage: a.targetStage,
      });
    } else {
      toast.info(`Opening ${a.quotationId}...`);
    }
  };

  const highlightMentions = (text: string) => {
    const parts = text.split(/(@[\w]+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="text-primary font-medium bg-primary/10 rounded px-0.5">{part}</span>
      ) : part
    );
  };

  const toggleSort = () => {
    if (activeTab === 'assignment') {
      setAssignmentSort((s) => (s === 'desc' ? 'asc' : 'desc'));
    } else {
      setMentionSort((s) => (s === 'desc' ? 'asc' : 'desc'));
    }
  };
  const currentSort = activeTab === 'assignment' ? assignmentSort : mentionSort;

  const policyBadge = (kind?: 'vmi' | 'cmi') => {
    if (!kind) return null;
    return (
      <Badge
        className={cn(
          'text-[10px] h-5 px-1.5',
          kind === 'vmi'
            ? 'bg-blue-500/20 text-blue-600 border-blue-500/30'
            : 'bg-purple-500/20 text-purple-600 border-purple-500/30'
        )}
      >
        {kind.toUpperCase()}
      </Badge>
    );
  };

  const entryLabel = (n: MentionNotification) => {
    const kind = n.entryType ?? (n.commentId ? 'reply' : 'remark');
    const sourceWord = n.sourceKind === 'lead' ? t('Lead', 'Lead') : t('Policy', 'กรมธรรม์');
    const verb =
      kind === 'reply' ? t('Reply on', 'ตอบกลับใน')
      : kind === 'rework' ? t('Rework on', 'แก้ไขใน')
      : t('Remarks on', 'หมายเหตุใน');
    return `${verb} ${sourceWord} ${stripHash(n.quotationId)}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
              {badgeLabel}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 bg-popover z-50" align="end">
        {/* Header: tabs + sort icon */}
        <div className="flex items-stretch border-b border-border">
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab('assignment')}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'assignment'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Inbox className="w-3.5 h-3.5" />
              {t('Assignment', 'งานที่ได้รับ')}
              {assignmentCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-muted text-foreground text-[10px] font-semibold">
                  {assignmentCount > 99 ? '99+' : assignmentCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('mention')}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'mention'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <AtSign className="w-3.5 h-3.5" />
              {t('Mention', 'การกล่าวถึง')}
              {unreadMentionCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
                  {unreadMentionCount > 99 ? '99+' : unreadMentionCount}
                </span>
              )}
            </button>
          </div>
          {/* R-07: fixed sort icon */}
          <button
            onClick={toggleSort}
            title={t(
              currentSort === 'desc' ? 'Newest first' : 'Oldest first',
              currentSort === 'desc' ? 'ใหม่สุดก่อน' : 'เก่าสุดก่อน'
            )}
            className="px-3 border-l border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center"
          >
            <ArrowDownUp className={cn('w-3.5 h-3.5 transition-transform', currentSort === 'asc' && 'rotate-180')} />
          </button>
        </div>

        {/* Assignment Tab */}
        {activeTab === 'assignment' && (
          <ScrollArea className="h-[480px]">
            {myAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center px-6">
                <Inbox className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {t('No Assignments Yet', 'ยังไม่มีงานที่ได้รับ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "You'll see notifications here when a lead or policy is assigned to you.",
                    'คุณจะเห็นการแจ้งเตือนที่นี่เมื่อมีลีดหรือกรมธรรม์ถูกมอบหมายให้คุณ'
                  )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {myAssignments.map((a) => {
                  const isUnread = !a.read;
                  const isLead = a.sourceKind === 'lead';
                  const sourceLabel = isLead
                    ? `${t('Lead', 'Lead')} ${stripHash(a.quotationId)}`
                    : `${t('Quotation', 'ใบเสนอราคา')} ${stripHash(a.quotationId)}`;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleAssignmentClick(a)}
                      className={cn(
                        'w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                        isUnread && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={cn(
                          'h-2 w-2 rounded-full flex-shrink-0 mt-1.5',
                          isUnread ? 'bg-primary' : 'bg-transparent'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{sourceLabel}</span>
                            {!isLead && a.policyType && policyBadge(a.policyType)}
                            {a.status && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {a.status}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('by', 'โดย')}{' '}
                            <span className="font-medium text-foreground">{a.triggeredBy || 'System'}</span>
                            {' · '}
                            <span>{formatDateTime(a.assignedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}

        {/* Mention Tab */}
        {activeTab === 'mention' && (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Switch
                  checked={unreadOnlyFilter}
                  onCheckedChange={setUnreadOnlyFilter}
                  className="h-4 w-7 [&>span]:h-3 [&>span]:w-3"
                />
                <span className="text-xs text-muted-foreground">
                  {t('Unread only', 'ยังไม่อ่าน')}
                </span>
              </div>
              {myMentions.some((n) => !n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => markAllAsRead()}
                >
                  {t('Mark all as read', 'อ่านทั้งหมด')}
                </Button>
              )}
            </div>
            <ScrollArea className="h-[438px]">
              {sortedMentions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center px-6">
                  <AtSign className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {t('No Mentions Yet', 'ยังไม่มีการกล่าวถึง')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "You'll see notifications here when someone mentions you in remarks or replies.",
                      'คุณจะเห็นการแจ้งเตือนที่นี่เมื่อมีคนกล่าวถึงคุณในหมายเหตุหรือการตอบกลับ'
                    )}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedMentions.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMentionClick(n)}
                      className={cn(
                        'w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={cn(
                          'h-2 w-2 rounded-full flex-shrink-0 mt-1.5',
                          !n.read ? 'bg-primary' : 'bg-transparent'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">
                              {entryLabel(n)}
                            </span>
                            {n.policyType && policyBadge(n.policyType)}
                            {(n.attachmentCount ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                <Paperclip className="w-3 h-3" />
                                {n.attachmentCount}
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            'text-sm line-clamp-2',
                            !n.read ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {highlightMentions(n.mentionTextPreview)}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1.5">
                            {t('by', 'โดย')}{' '}
                            <span className="font-medium text-foreground">{n.mentionedBy}</span>
                            {' · '}
                            <span>{formatDateTime(n.mentionedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
