import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PolicyRemark, PolicyHistoryLogEntry } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PolicyRemarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyKind: 'vmi' | 'cmi';
  remarks: PolicyRemark[];
  onAddRemark: (comment: string) => void;
}

export function PolicyRemarksDialog({
  open,
  onOpenChange,
  policyKind,
  remarks,
  onAddRemark,
}: PolicyRemarksDialogProps) {
  const { language } = useLanguageStore();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddRemark(newComment.trim());
    setNewComment('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {policyKind.toUpperCase()} {language === 'th' ? 'หมายเหตุ' : 'Remarks'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Remarks */}
          <ScrollArea className="h-[300px] pr-4">
            {remarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'th' ? 'ยังไม่มีหมายเหตุ' : 'No remarks yet'}
              </div>
            ) : (
              <div className="space-y-3">
                {[...remarks].reverse().map((remark) => (
                  <div
                    key={remark.id}
                    className="p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {remark.comment}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">{remark.createdBy}</span>
                      <span>•</span>
                      <span>{formatDate(remark.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add New Remark */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Textarea
                placeholder={language === 'th' ? 'เพิ่มหมายเหตุ...' : 'Add a remark...'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {language === 'th' ? 'Ctrl+Enter เพื่อส่ง' : 'Ctrl+Enter to send'}
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {language === 'th' ? 'ส่ง' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
