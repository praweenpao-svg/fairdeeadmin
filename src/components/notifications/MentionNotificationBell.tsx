import { useState } from 'react';
import { Bell, AtSign, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMentionNotificationsStore, MentionNotification, AssignmentNotification, getMentionSourceType } from '@/stores/mentionNotificationsStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentUserStore } from '@/stores/currentUserStore';
import { useNotificationNavigationStore } from '@/stores/notificationNavigationStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

function getFullDateTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function MentionNotificationBell() {
  const { language } = useLanguageStore();
  const currentUser = useCurrentUserStore();
  const {
    notifications, assignments, markAsRead, markAllAsRead,
    unreadOnlyFilter, setUnreadOnlyFilter,
    markAssignmentAsRead, markAllAssignmentsAsRead,
  } = useMentionNotificationsStore();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentioned' | 'assigned'>('mentioned');

  // 30-day window for mentions
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const myMentions = notifications.filter((n) => {
    if (n.recipientUserId !== currentUser.name) return false;
    try {
      if (new Date(n.mentionedAt) < thirtyDaysAgo) return false;
    } catch { return true; }
    return true;
  });

  const visibleMentions = unreadOnlyFilter
    ? myMentions.filter((n) => !n.read)
    : myMentions;

  // Sort: unread first, then by timestamp desc
  const sortedMentions = [...visibleMentions].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.mentionedAt).getTime() - new Date(a.mentionedAt).getTime();
  });

  // Assigned to me: active only
  const myAssignments = assignments
    .filter((a) => a.assigneeUserId === currentUser.name && a.isActive)
    .sort((a, b) => {
      const ar = a.read ?? false, br = b.read ?? false;
      if (ar !== br) return ar ? 1 : -1;
      return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
    });

  const unreadMentionCount = myMentions.filter((n) => !n.read).length;
  const unreadAssignmentCount = myAssignments.filter((a) => !a.read).length;
  const hasUnread = unreadMentionCount > 0 || unreadAssignmentCount > 0;

  const setNavTarget = useNotificationNavigationStore(s => s.setTarget);

  const handleMentionClick = (notification: MentionNotification) => {
    markAsRead(notification.id);
    setOpen(false);
    if (notification.leadId && notification.policyId && notification.targetStage) {
      setNavTarget({
        leadId: notification.leadId,
        policyId: notification.policyId,
        policyKind: notification.policyType || 'vmi',
        targetStage: notification.targetStage,
      });
    } else {
      toast.info(`Opening ${notification.quotationId}...`);
    }
  };

  const handleAssignmentClick = (assignment: AssignmentNotification) => {
    markAssignmentAsRead(assignment.id);
    setOpen(false);
    if (assignment.leadId && assignment.policyId && assignment.targetStage) {
      setNavTarget({
        leadId: assignment.leadId,
        policyId: assignment.policyId,
        policyKind: assignment.policyType,
        targetStage: assignment.targetStage,
      });
    } else {
      toast.info(`Opening ${assignment.quotationId}...`);
    }
  };

  const highlightMentions = (text: string) => {
    const parts = text.split(/(@[\w]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium bg-primary/10 rounded px-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {hasUnreadMentions && (
            <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 bg-popover z-50" align="end">
        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab('mentioned')}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'mentioned'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <AtSign className="w-3.5 h-3.5" />
              {language === 'th' ? 'ถูกกล่าวถึง' : 'Mentioned'}
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'assigned'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {language === 'th' ? 'มอบหมายให้ฉัน' : 'Assigned to me'}
            </button>
          </div>
        </div>

        {/* Mentioned Tab */}
        {activeTab === 'mentioned' && (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Switch
                  checked={unreadOnlyFilter}
                  onCheckedChange={setUnreadOnlyFilter}
                  className="h-4 w-7 [&>span]:h-3 [&>span]:w-3"
                />
                <span className="text-xs text-muted-foreground">
                  {language === 'th' ? 'ยังไม่อ่าน' : 'Unread only'}
                </span>
              </div>
              {myMentions.some((n) => !n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => markAllAsRead()}
                >
                  {language === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}
                </Button>
              )}
            </div>
            <ScrollArea className="h-[360px]">
              {sortedMentions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  {language === 'th' ? 'ไม่มีการแจ้งเตือน' : 'No notifications'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedMentions.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleMentionClick(notification)}
                      className={cn(
                        'w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                        !notification.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="text-xs bg-muted">
                            {getInitials(notification.mentionedBy)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                              {notification.quotationId}
                            </Badge>
                            {notification.policyType && (
                              <Badge
                                className={cn(
                                  "text-[10px] h-5 px-1.5",
                                  notification.policyType === 'vmi'
                                    ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                                    : "bg-purple-500/20 text-purple-600 border-purple-500/30"
                                )}
                              >
                                {notification.policyType.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-sm line-clamp-2",
                            !notification.read ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {highlightMentions(notification.mentionTextPreview)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <span className="font-medium">{notification.mentionedBy}</span>
                            <span>•</span>
                            <span>{getFullDateTime(notification.mentionedAt)}</span>
                          </div>
                        </div>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {/* Assigned to me Tab */}
        {activeTab === 'assigned' && (
          <ScrollArea className="h-[390px]">
            {myAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                <ClipboardList className="w-8 h-8 mb-2 opacity-30" />
                {language === 'th' ? 'ไม่มีงานที่มอบหมาย' : 'No active assignments'}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {myAssignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => handleAssignmentClick(assignment)}
                    className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                            {assignment.quotationId}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[10px] h-5 px-1.5",
                              assignment.policyType === 'vmi'
                                ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                                : "bg-purple-500/20 text-purple-600 border-purple-500/30"
                            )}
                          >
                            {assignment.policyType.toUpperCase()}
                          </Badge>
                          <Badge className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                            {assignment.saleStage}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {language === 'th' ? 'มอบหมายเมื่อ' : 'Assigned'}: {getFullDateTime(assignment.assignedAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
