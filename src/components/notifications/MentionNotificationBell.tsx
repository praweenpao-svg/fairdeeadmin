import { useState } from 'react';
import { AtSign, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMentionNotificationsStore, MentionNotification } from '@/stores/mentionNotificationsStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export function MentionNotificationBell() {
  const { language } = useLanguageStore();
  const { notifications, markAsRead, markAllAsRead } = useMentionNotificationsStore();
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleNotificationClick = (notification: MentionNotification) => {
    markAsRead(notification.id);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'd MMM yyyy HH:mm', { locale: language === 'th' ? th : undefined });
    } catch {
      return timestamp;
    }
  };

  // Highlight @mentions in comment
  const highlightMentions = (comment: string) => {
    const parts = comment.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <AtSign className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-popover z-50" align="end">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AtSign className="w-4 h-4" />
              {language === 'th' ? 'การกล่าวถึง' : 'Mentions'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {language === 'th' ? 'คุณถูก tag ในความคิดเห็น' : "You've been tagged in comments"}
            </p>
          </div>
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
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
              <AtSign className="w-8 h-8 mb-2 opacity-30" />
              {language === 'th' ? 'ยังไม่มีการกล่าวถึง' : 'No mentions yet'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                    !notification.read && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                          {notification.saleId}
                        </Badge>
                        {notification.policyKind && (
                          <Badge 
                            className={cn(
                              "text-[10px] h-5 px-1.5",
                              notification.policyKind === 'vmi' 
                                ? "bg-blue-500/20 text-blue-600 border-blue-500/30" 
                                : "bg-purple-500/20 text-purple-600 border-purple-500/30"
                            )}
                          >
                            {notification.policyKind.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {highlightMentions(notification.comment)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <span className="font-medium">{notification.mentionedBy}</span>
                        <span>•</span>
                        <span>{formatTimestamp(notification.mentionedAt)}</span>
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
      </PopoverContent>
    </Popover>
  );
}
