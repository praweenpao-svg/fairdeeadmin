import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Lead } from '@/types/pipeline';
import { format, parseISO } from 'date-fns';

export interface Notification {
  id: string;
  leadNumber: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationBellProps {
  leads: Lead[];
  currentUser: string;
}

// Generate notifications for leads assigned to current user
function generateNotifications(leads: Lead[], currentUser: string): Notification[] {
  const notifications: Notification[] = [];
  
  leads.forEach((lead) => {
    const isOwner = 
      lead.assignedTo === currentUser ||
      lead.rfAssignee === currentUser ||
      lead.scAssignee === currentUser ||
      lead.deAssignee === currentUser;
    
    if (isOwner && lead.updatedOn) {
      // Rework is assigned to user only if they are the rework assignee (assignedTo field)
      const reworkAssignedToMe = lead.reworkRequired && lead.assignedTo === currentUser;
      
      notifications.push({
        id: lead.id,
        leadNumber: lead.leadNumber,
        message: reworkAssignedToMe 
          ? `Rework assigned to you` 
          : `Lead updated`,
        timestamp: lead.updatedOn,
        read: false,
      });
    }
  });
  
  // Sort by timestamp descending
  return notifications.sort((a, b) => {
    const dateA = parseDateTime(a.timestamp);
    const dateB = parseDateTime(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  }).slice(0, 10); // Show only latest 10
}

function parseDateTime(dateStr: string): Date {
  // Parse DD-MM-YYYY HH:MM format
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('-').map(Number);
  const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function NotificationBell({ leads, currentUser }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  
  const notifications = generateNotifications(leads, currentUser);
  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Mark all as read when opening
      setReadNotifications(new Set(notifications.map(n => n.id)));
    }
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border px-4 py-3">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <p className="text-xs text-muted-foreground">Latest updates on your assigned tasks</p>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'px-4 py-3 hover:bg-muted/50 transition-colors',
                    !readNotifications.has(notification.id) && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{notification.leadNumber}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                    </div>
                    {!readNotifications.has(notification.id) && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
