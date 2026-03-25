import { useState } from 'react';
import { AtSign, Bell, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useMentionNotificationsStore, MentionNotification } from '@/stores/mentionNotificationsStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useCurrentUserStore } from '@/stores/currentUserStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockStaffMembers } from '@/data/mockStaff';
import { toast } from 'sonner';

function getRelativeTime(timestamp: string, language: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'th' ? 'เมื่อสักครู่' : 'Just now';
    if (diffMins < 60) return language === 'th' ? `${diffMins} นาทีที่แล้ว` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'th' ? `${diffHours} ชั่วโมงที่แล้ว` : `${diffHours}h ago`;
    if (diffDays < 7) return language === 'th' ? `${diffDays} วันที่แล้ว` : `${diffDays}d ago`;
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' });
  } catch {
    return timestamp;
  }
}

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
    notifications, markAsRead, markAllAsRead,
    timeRange, setTimeRange, userFilter, setUserFilter,
  } = useMentionNotificationsStore();
  const [open, setOpen] = useState(false);

  // Filter notifications by recipient
  const recipientId = userFilter || currentUser.name;

  // Filter by time range
  const now = new Date();
  const filteredNotifications = notifications.filter((n) => {
    // Recipient filter
    if (n.recipientUserId !== recipientId && n.mentionedBy !== recipientId) {
      // Also try matching by name for backwards compat
      const matchesRecipient = n.recipientUserId === recipientId;
      if (!matchesRecipient) return false;
    }

    // Time range filter
    if (timeRange !== 'all') {
      try {
        const date = new Date(n.mentionedAt);
        const days = timeRange === '7d' ? 7 : 30;
        const cutoff = new Date(now.getTime() - days * 86400000);
        if (date < cutoff) return false;
      } catch {
        return true;
      }
    }

    return true;
  });

  // Sort: unread first, then by timestamp desc
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.mentionedAt).getTime() - new Date(a.mentionedAt).getTime();
  });

  const unreadCount = notifications.filter(
    (n) => !n.read && (n.recipientUserId === recipientId || n.mentionedBy === recipientId)
  ).length;

  const displayBadge = unreadCount > 99 ? '99+' : unreadCount > 0 ? unreadCount : null;

  const handleNotificationClick = (notification: MentionNotification) => {
    markAsRead(notification.id);
    setOpen(false);
    // Deep-link: navigate to the source sale's History & Activity
    // For now, show a toast with the sale reference
    toast.info(
      language === 'th'
        ? `กำลังเปิด Sale ${notification.saleId}...`
        : `Opening Sale ${notification.saleId}...`,
      { description: language === 'th' ? 'เปิดประวัติกิจกรรม' : 'Opening History & Activity sidebar' }
    );
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
          {displayBadge && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium px-1">
              {displayBadge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 bg-popover z-50" align="end">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {language === 'th' ? 'ศูนย์แจ้งเตือน' : 'Notification Center'}
            </h4>
            {unreadCount > 0 && (
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
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '7d' | '30d' | 'all')}>
              <SelectTrigger className="h-7 text-xs w-28">
                <Clock className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{language === 'th' ? '7 วัน' : '7 days'}</SelectItem>
                <SelectItem value="30d">{language === 'th' ? '30 วัน' : '30 days'}</SelectItem>
                <SelectItem value="all">{language === 'th' ? 'ทั้งหมด' : 'All time'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userFilter || '__me__'} onValueChange={(v) => setUserFilter(v === '__me__' ? null : v)}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__me__">
                  {language === 'th' ? 'ของฉัน' : 'My mentions'}
                </SelectItem>
                {mockStaffMembers
                  .filter((s) => s.name !== currentUser.name)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="h-[380px]">
          {sortedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              {language === 'th' ? 'ไม่มีการแจ้งเตือน' : 'No notifications'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                    !notification.read && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Author avatar */}
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="text-xs bg-muted">
                        {getInitials(notification.mentionedBy)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Sale ID + policy type */}
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                          {notification.saleId}
                        </Badge>
                        {notification.policyType && (
                          <Badge
                            className={cn(
                              "text-[10px] h-5 px-1.5",
                              notification.policyType === 'vmi'
                                ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                                : notification.policyType === 'cmi'
                                  ? "bg-purple-500/20 text-purple-600 border-purple-500/30"
                                  : "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                            )}
                          >
                            {notification.policyType.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Mention text preview */}
                      <p className="text-sm text-foreground line-clamp-2">
                        {highlightMentions(notification.mentionTextPreview)}
                      </p>

                      {/* Author + relative time */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <span className="font-medium">{notification.mentionedBy}</span>
                        <span>•</span>
                        <span title={getFullDateTime(notification.mentionedAt)}>
                          {getRelativeTime(notification.mentionedAt, language)}
                        </span>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
