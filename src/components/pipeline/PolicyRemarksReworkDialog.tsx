import { useState, useRef } from 'react';
import { MessageSquare, Send, CheckCircle, ArrowRightLeft, Upload, X, FileText, Image, AlertTriangle, User, ChevronDown, ChevronRight, Reply, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PolicyRemark, PolicyReworkEntry, ReworkConfig, ReworkAttachment, ThreadReply } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PolicyRemarksReworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyKind: 'vmi' | 'cmi';
  remarks: PolicyRemark[];
  reworkHistory: PolicyReworkEntry[];
  reworkConfigs: ReworkConfig[];
  onAddRemark: (comment: string, attachments?: ReworkAttachment[]) => void;
  onAddRemarkReply?: (remarkId: string, comment: string, attachments?: ReworkAttachment[]) => void;
  onAddReworkReply?: (entryId: string, comment: string, attachments?: ReworkAttachment[]) => void;
  onReworkResolve: (entryId: string) => void;
  onReworkReassign: (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

type ThreadItem = 
  | { type: 'remark'; data: PolicyRemark; timestamp: Date }
  | { type: 'rework'; data: PolicyReworkEntry; timestamp: Date };

export function PolicyRemarksReworkDialog({
  open,
  onOpenChange,
  policyKind,
  remarks,
  reworkHistory,
  reworkConfigs,
  onAddRemark,
  onAddRemarkReply,
  onAddReworkReply,
  onReworkResolve,
  onReworkReassign,
}: PolicyRemarksReworkDialogProps) {
  const { language } = useLanguageStore();
  const [newComment, setNewComment] = useState('');
  const [newCommentAttachments, setNewCommentAttachments] = useState<ReworkAttachment[]>([]);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; type: 'remark' | 'rework' } | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<ReworkAttachment[]>([]);
  
  // Reassign form state
  const [reassignEntryId, setReassignEntryId] = useState<string | null>(null);
  const [selectedNewReasonId, setSelectedNewReasonId] = useState<string>('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [reassignAttachments, setReassignAttachments] = useState<ReworkAttachment[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const newCommentFileInputRef = useRef<HTMLInputElement>(null);

  // Get unresolved rework entries
  const unresolvedEntries = reworkHistory.filter(e => !e.resolved);

  // Merge remarks and rework into a single timeline
  const buildTimeline = (): ThreadItem[] => {
    const items: ThreadItem[] = [];
    
    remarks.forEach(remark => {
      items.push({
        type: 'remark',
        data: remark,
        timestamp: new Date(remark.createdAt),
      });
    });
    
    reworkHistory.forEach(entry => {
      items.push({
        type: 'rework',
        data: entry,
        timestamp: new Date(entry.savedAt),
      });
    });
    
    // Sort by timestamp ascending (oldest first, newest at bottom)
    return items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const timeline = buildTimeline();

  const handleSubmitRemark = () => {
    if (!newComment.trim()) return;
    onAddRemark(newComment.trim(), newCommentAttachments.length > 0 ? newCommentAttachments : undefined);
    setNewComment('');
    setNewCommentAttachments([]);
  };

  const handleSubmitReply = () => {
    if (!replyComment.trim() || !replyingTo) return;
    
    if (replyingTo.type === 'remark' && onAddRemarkReply) {
      onAddRemarkReply(replyingTo.id, replyComment.trim(), replyAttachments.length > 0 ? replyAttachments : undefined);
    } else if (replyingTo.type === 'rework' && onAddReworkReply) {
      onAddReworkReply(replyingTo.id, replyComment.trim(), replyAttachments.length > 0 ? replyAttachments : undefined);
    }
    
    setReplyComment('');
    setReplyAttachments([]);
    setReplyingTo(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'reassign' | 'reply' | 'new') => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: ReworkAttachment[] = [];
    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'pdf') {
        const attachment: ReworkAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: ext === 'jpeg' ? 'jpg' : (ext as 'png' | 'jpg' | 'pdf'),
          url: URL.createObjectURL(file),
        };
        newAttachments.push(attachment);
      }
    });

    if (target === 'reassign') {
      setReassignAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (target === 'reply') {
      setReplyAttachments(prev => [...prev, ...newAttachments]);
      if (replyFileInputRef.current) replyFileInputRef.current.value = '';
    } else {
      setNewCommentAttachments(prev => [...prev, ...newAttachments]);
      if (newCommentFileInputRef.current) newCommentFileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string, target: 'reassign' | 'reply' | 'new') => {
    if (target === 'reassign') {
      setReassignAttachments(prev => prev.filter(a => a.id !== id));
    } else if (target === 'reply') {
      setReplyAttachments(prev => prev.filter(a => a.id !== id));
    } else {
      setNewCommentAttachments(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleReassignConfirm = () => {
    if (reassignEntryId && selectedNewReasonId) {
      onReworkReassign(reassignEntryId, selectedNewReasonId, reassignDetails, reassignAttachments);
      resetReassignForm();
    }
  };

  const resetReassignForm = () => {
    setReassignEntryId(null);
    setSelectedNewReasonId('');
    setReassignDetails('');
    setReassignAttachments([]);
  };

  const toggleThreadExpanded = (id: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getReasonLabel = (entry: PolicyReworkEntry) => {
    const config = reworkConfigs.find(c => c.id === entry.reasonId);
    return language === 'th' 
      ? (config?.descriptionTh || entry.reasonLabel)
      : (config?.descriptionEn || entry.reasonLabel);
  };

  const currentReassignEntry = unresolvedEntries.find(e => e.id === reassignEntryId);

  const renderAttachments = (attachments?: ReworkAttachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {attachments.map(att => (
          <a
            key={att.id}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded text-xs text-primary hover:bg-muted transition-colors"
          >
            {att.type === 'pdf' ? <FileText className="w-3 h-3" /> : <Image className="w-3 h-3" />}
            <span className="max-w-[80px] truncate">{att.name}</span>
          </a>
        ))}
      </div>
    );
  };

  const renderReplies = (replies?: ThreadReply[]) => {
    if (!replies || replies.length === 0) return null;
    return (
      <div className="mt-2 pl-3 border-l-2 border-muted space-y-2">
        {replies.map(reply => (
          <div key={reply.id} className="py-1.5">
            <p className="text-xs text-foreground/90 whitespace-pre-wrap">{reply.comment}</p>
            {renderAttachments(reply.attachments)}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span className="font-medium">{reply.createdBy}</span>
              <span>•</span>
              <span>{formatDate(reply.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRemarkThread = (remark: PolicyRemark) => {
    const hasReplies = remark.replies && remark.replies.length > 0;
    const isExpanded = expandedThreads.has(remark.id);
    const isReplying = replyingTo?.id === remark.id && replyingTo?.type === 'remark';

    return (
      <div key={remark.id} className="p-3 bg-muted/30 rounded-lg border border-border">
        {/* Main remark */}
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground whitespace-pre-wrap">{remark.comment}</p>
            {renderAttachments(remark.attachments)}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="font-medium">{remark.createdBy}</span>
              <span>•</span>
              <span>{formatDate(remark.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Thread controls */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
          {hasReplies && (
            <button
              onClick={() => toggleThreadExpanded(remark.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {remark.replies?.length} {language === 'th' ? 'ความคิดเห็น' : 'replies'}
            </button>
          )}
          <button
            onClick={() => setReplyingTo(isReplying ? null : { id: remark.id, type: 'remark' })}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <Reply className="w-3 h-3" />
            {language === 'th' ? 'ตอบกลับ' : 'Reply'}
          </button>
        </div>

        {/* Expanded replies */}
        {hasReplies && isExpanded && renderReplies(remark.replies)}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <Textarea
              placeholder={language === 'th' ? 'เพิ่มความคิดเห็น...' : 'Add a reply...'}
              value={replyComment}
              onChange={(e) => setReplyComment(e.target.value)}
              className="min-h-[60px] resize-none text-xs"
            />
            {replyAttachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {replyAttachments.map(att => (
                  <div key={att.id} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs">
                    {att.type === 'pdf' ? <FileText className="w-3 h-3 text-destructive" /> : <Image className="w-3 h-3 text-primary" />}
                    <span className="max-w-[60px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id, 'reply')} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <input ref={replyFileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'reply')} />
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => replyFileInputRef.current?.click()}>
                <Paperclip className="w-3 h-3 mr-1" />
                {language === 'th' ? 'แนบ' : 'Attach'}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setReplyingTo(null); setReplyComment(''); setReplyAttachments([]); }}>
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
                <Button size="sm" className="h-6 text-xs" onClick={handleSubmitReply} disabled={!replyComment.trim()}>
                  <Send className="w-3 h-3 mr-1" />
                  {language === 'th' ? 'ส่ง' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReworkThread = (entry: PolicyReworkEntry) => {
    const hasReplies = entry.replies && entry.replies.length > 0;
    const isExpanded = expandedThreads.has(entry.id);
    const isReplying = replyingTo?.id === entry.id && replyingTo?.type === 'rework';
    const isActive = !entry.resolved;

    return (
      <div
        key={entry.id}
        className={cn(
          'p-3 rounded-lg border',
          isActive
            ? 'bg-warning/10 border-warning/30'
            : 'bg-muted/20 border-border opacity-70'
        )}
      >
        {/* Main rework entry */}
        <div className="flex items-start gap-2">
          <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', isActive ? 'text-warning' : 'text-muted-foreground')} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('text-sm font-medium', isActive ? 'text-warning' : 'text-muted-foreground line-through')}>
                {getReasonLabel(entry)}
              </p>
              {isActive && entry.assignedTo && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-primary/30">
                  <User className="w-2.5 h-2.5 mr-1" />
                  {entry.assignedTo}
                </Badge>
              )}
              {!isActive && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-600 border-green-500/30">
                  <CheckCircle className="w-2.5 h-2.5 mr-1" />
                  {language === 'th' ? 'แก้ไขแล้ว' : 'Resolved'}
                </Badge>
              )}
            </div>
            {entry.details && (
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{entry.details}</p>
            )}
            {renderAttachments(entry.attachments)}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{language === 'th' ? 'โดย' : 'By'} {entry.savedBy}</span>
              <span>•</span>
              <span>{formatDate(entry.savedAt)}</span>
            </div>
            {!isActive && entry.resolvedBy && (
              <div className="text-xs text-green-600 mt-1">
                {language === 'th' ? 'แก้ไขโดย' : 'Resolved by'} {entry.resolvedBy} • {entry.resolvedAt}
              </div>
            )}
          </div>
        </div>

        {/* Thread controls and actions */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 flex-wrap">
          {hasReplies && (
            <button
              onClick={() => toggleThreadExpanded(entry.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {entry.replies?.length} {language === 'th' ? 'ความคิดเห็น' : 'replies'}
            </button>
          )}
          <button
            onClick={() => setReplyingTo(isReplying ? null : { id: entry.id, type: 'rework' })}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Reply className="w-3 h-3" />
            {language === 'th' ? 'ตอบกลับ' : 'Reply'}
          </button>
          
          {/* Resolve/Reassign actions for active rework */}
          {isActive && (
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                className="h-6 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => onReworkResolve(entry.id)}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {language === 'th' ? 'แก้ไขแล้ว' : 'Resolve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                onClick={() => setReassignEntryId(entry.id)}
              >
                <ArrowRightLeft className="w-3 h-3 mr-1" />
                {language === 'th' ? 'มอบหมายใหม่' : 'Reassign'}
              </Button>
            </div>
          )}
        </div>

        {/* Expanded replies */}
        {hasReplies && isExpanded && renderReplies(entry.replies)}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <Textarea
              placeholder={language === 'th' ? 'เพิ่มความคิดเห็น...' : 'Add a reply...'}
              value={replyComment}
              onChange={(e) => setReplyComment(e.target.value)}
              className="min-h-[60px] resize-none text-xs"
            />
            {replyAttachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {replyAttachments.map(att => (
                  <div key={att.id} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs">
                    {att.type === 'pdf' ? <FileText className="w-3 h-3 text-destructive" /> : <Image className="w-3 h-3 text-primary" />}
                    <span className="max-w-[60px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id, 'reply')} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <input ref={replyFileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'reply')} />
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => replyFileInputRef.current?.click()}>
                <Paperclip className="w-3 h-3 mr-1" />
                {language === 'th' ? 'แนบ' : 'Attach'}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setReplyingTo(null); setReplyComment(''); setReplyAttachments([]); }}>
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
                <Button size="sm" className="h-6 text-xs" onClick={handleSubmitReply} disabled={!replyComment.trim()}>
                  <Send className="w-3 h-3 mr-1" />
                  {language === 'th' ? 'ส่ง' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        resetReassignForm();
        setReplyingTo(null);
        setReplyComment('');
        setReplyAttachments([]);
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {policyKind.toUpperCase()} {language === 'th' ? 'หมายเหตุ & งานติดปัญหา' : 'Remarks & Rework'}
            {unresolvedEntries.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {unresolvedEntries.length} {language === 'th' ? 'งานติดปัญหา' : 'Active'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {reassignEntryId ? (
          // Reassign Form
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'มอบหมายงานใหม่' : 'Reassign rework'}
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetReassignForm}>
                {language === 'th' ? 'กลับ' : 'Back'}
              </Button>
            </div>

            {currentReassignEntry && (
              <div className="p-2 bg-muted/50 border rounded text-xs">
                <span className="text-muted-foreground">{language === 'th' ? 'จาก:' : 'From:'}</span>
                <span className="ml-1 font-medium">{getReasonLabel(currentReassignEntry)}</span>
                {currentReassignEntry.assignedTo && (
                  <span className="ml-2 text-muted-foreground">
                    ({language === 'th' ? 'ผู้รับผิดชอบ:' : 'Owner:'} {currentReassignEntry.assignedTo})
                  </span>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'เลือกเหตุผลใหม่' : 'Select new reason'}</Label>
              <Select value={selectedNewReasonId} onValueChange={setSelectedNewReasonId}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder={language === 'th' ? 'เลือกเหตุผล' : 'Select reason'} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {reworkConfigs
                    .filter(config => config.id !== currentReassignEntry?.reasonId)
                    .map(config => (
                      <SelectItem key={config.id} value={config.id} className="text-xs">
                        {language === 'th' ? config.descriptionTh : config.descriptionEn}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'รายละเอียด (ไม่บังคับ)' : 'Details (optional)'}</Label>
              <Textarea
                placeholder={language === 'th' ? 'ใส่รายละเอียดเพิ่มเติม...' : 'Enter detailed reason...'}
                value={reassignDetails}
                onChange={(e) => setReassignDetails(e.target.value)}
                className="min-h-[60px] resize-none text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'ไฟล์แนบ' : 'Attachments'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {reassignAttachments.map(att => (
                  <div key={att.id} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs">
                    {att.type === 'pdf' ? <FileText className="w-3 h-3 text-destructive" /> : <Image className="w-3 h-3 text-primary" />}
                    <span className="max-w-[80px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id, 'reassign')} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'reassign')} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-xs">
                <Upload className="w-3 h-3 mr-1.5" />
                {language === 'th' ? 'แนบไฟล์' : 'Attach files'}
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetReassignForm}>
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleReassignConfirm} disabled={!selectedNewReasonId}>
                {language === 'th' ? 'มอบหมายใหม่' : 'Reassign'}
              </Button>
            </div>
          </div>
        ) : (
          // Main timeline view
          <>
            <ScrollArea className="h-[350px] pr-4">
              {timeline.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  {language === 'th' ? 'ยังไม่มีหมายเหตุหรืองานติดปัญหา' : 'No remarks or rework issues yet'}
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {timeline.map(item => 
                    item.type === 'remark' 
                      ? renderRemarkThread(item.data as PolicyRemark)
                      : renderReworkThread(item.data as PolicyReworkEntry)
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Add New Remark */}
            <div className="border-t pt-4 mt-2 shrink-0">
              <div className="space-y-2">
                <Textarea
                  placeholder={language === 'th' ? 'เพิ่มหมายเหตุ...' : 'Add a remark...'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[70px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmitRemark();
                    }
                  }}
                />
                {newCommentAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {newCommentAttachments.map(att => (
                      <div key={att.id} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs">
                        {att.type === 'pdf' ? <FileText className="w-3 h-3 text-destructive" /> : <Image className="w-3 h-3 text-primary" />}
                        <span className="max-w-[80px] truncate">{att.name}</span>
                        <button onClick={() => removeAttachment(att.id, 'new')} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input ref={newCommentFileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'new')} />
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => newCommentFileInputRef.current?.click()}>
                      <Paperclip className="w-4 h-4 mr-1" />
                      {language === 'th' ? 'แนบไฟล์' : 'Attach'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {language === 'th' ? 'Ctrl+Enter เพื่อส่ง' : 'Ctrl+Enter to send'}
                    </span>
                  </div>
                  <Button size="sm" onClick={handleSubmitRemark} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-1.5" />
                    {language === 'th' ? 'ส่ง' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
