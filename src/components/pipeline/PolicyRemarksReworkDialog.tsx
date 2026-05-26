import { useState, useRef } from 'react';
import { MessageSquare, Send, CheckCircle, ArrowRightLeft, Upload, X, FileText, Image, AlertTriangle, User, ChevronDown, ChevronRight, Reply, Paperclip, Lock, Globe, FileCheck, FileX, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableReasonSelect } from '@/components/pipeline/SearchableReasonSelect';
import { SearchableStaffSelect } from '@/components/pipeline/SearchableStaffSelect';
import { PolicyRemark, PolicyReworkEntry, ReworkConfig, ReworkAttachment, ThreadReply, PipelineStage, PolicyEndorsementEntry, EndorsementType, EndorsementStatus } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMentionNotificationsStore, extractMentions } from '@/stores/mentionNotificationsStore';
import { useCurrentUserStore } from '@/stores/currentUserStore';
import { ExpandableText } from '@/components/ui/expandable-text';
import { AttachmentThumbnails, AttachmentDisplay } from '@/components/ui/attachment-thumbnails';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, startOfDay } from 'date-fns';
import { th as thLocale } from 'date-fns/locale';
import { mockStaffMembers } from '@/data/mockStaff';

// Endorsement status translations
const endorsementStatusLabels: Record<EndorsementStatus, { en: string; th: string }> = {
  request_created: { en: 'Request Created', th: 'สร้างคำขอแล้ว' },
  request_submitted: { en: 'Request Submitted', th: 'ส่งคำขอแล้ว' },
  request_approved: { en: 'Request Approved', th: 'อนุมัติคำขอแล้ว' },
  pending_on_ops: { en: 'Pending on Ops', th: 'รอดำเนินการ Ops' },
  pending_finance: { en: 'Pending Finance', th: 'รอการเงิน' },
  invalid: { en: 'Invalid', th: 'ไม่ถูกต้อง' },
};

interface PolicyRemarksReworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyKind: 'vmi' | 'cmi';
  onPolicyKindChange?: (kind: 'vmi' | 'cmi') => void;
  availablePolicies?: ('vmi' | 'cmi')[];
  policyId: string;
  leadNumber?: string; // Sale ID for notification
  remarks: PolicyRemark[];
  reworkHistory: PolicyReworkEntry[];
  endorsementHistory?: PolicyEndorsementEntry[];
  reworkConfigs: ReworkConfig[];
  currentStage: PipelineStage;
  onAddRemark: (comment: string, attachments?: ReworkAttachment[]) => void;
  onAddRemarkReply?: (remarkId: string, comment: string, attachments?: ReworkAttachment[]) => void;
  onAddReworkReply?: (entryId: string, comment: string, attachments?: ReworkAttachment[]) => void;
  onAddEndorsementReply?: (entryId: string, comment: string, attachments?: ReworkAttachment[]) => void;
  onReworkResolve: (entryId: string) => void;
  onReworkReassign: (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[], postResolutionOwner?: string) => void;
  onAddRework?: (policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[], autoResolveDate?: string, postResolutionOwner?: string) => void;
  onUpdateAutoResolveDate?: (entryId: string, newDate: string) => void;
}

type ThreadItem = 
  | { type: 'remark'; data: PolicyRemark; timestamp: Date }
  | { type: 'rework'; data: PolicyReworkEntry; timestamp: Date }
  | { type: 'endorsement'; data: PolicyEndorsementEntry; timestamp: Date };


export function PolicyRemarksReworkDialog({
  open,
  onOpenChange,
  policyKind,
  onPolicyKindChange,
  availablePolicies,
  policyId,
  leadNumber,
  remarks,
  reworkHistory,
  endorsementHistory = [],
  reworkConfigs,
  currentStage,
  onAddRemark,
  onAddRemarkReply,
  onAddReworkReply,
  onAddEndorsementReply,
  onReworkResolve,
  onReworkReassign,
  onAddRework,
  onUpdateAutoResolveDate,
}: PolicyRemarksReworkDialogProps) {
  const { language } = useLanguageStore();
  const CURRENT_USER = useCurrentUserStore(s => s.name);
  const { addNotification } = useMentionNotificationsStore();
  const [newComment, setNewComment] = useState('');
  const [newCommentAttachments, setNewCommentAttachments] = useState<ReworkAttachment[]>([]);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; type: 'remark' | 'rework' | 'endorsement' } | null>(null);
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

  // Merge remarks, rework, and endorsements into a single timeline
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

    endorsementHistory.forEach(entry => {
      items.push({
        type: 'endorsement',
        data: entry,
        timestamp: new Date(entry.savedAt),
      });
    });
    
    // Sort by timestamp ascending (oldest first, newest at bottom)
    return items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const timeline = buildTimeline();

  // Helper to process mentions and create notifications
  // Creates a notification for each unique person mentioned (except the current user)
  const processMentions = (comment: string) => {
    const mentions = extractMentions(comment);
    // For demo purposes, we create notifications for each mentioned person
    // In real app, this would check if the mentioned name matches an actual user
    mentions.forEach(mentionedName => {
      // Always create notification - in real app would filter to actual users
      // For demo, we simulate that the current user "Pao" can receive notifications
      // when they view as themselves, so we should still create the notification
      addNotification({
        recipientUserId: mentionedName,
        quotationId: leadNumber || policyId,
        mentionTextPreview: comment.slice(0, 80),
        mentionedBy: CURRENT_USER,
        mentionedByUserId: CURRENT_USER,
        mentionedAt: new Date().toISOString(),
        policyType: policyKind === 'vmi' ? 'vmi' : policyKind === 'cmi' ? 'cmi' : undefined,
      });
    });
  };

  const handleSubmitRemark = () => {
    if (!newComment.trim()) return;
    processMentions(newComment.trim());
    onAddRemark(newComment.trim(), newCommentAttachments.length > 0 ? newCommentAttachments : undefined);
    setNewComment('');
    setNewCommentAttachments([]);
  };

  const handleSubmitReply = () => {
    if (!replyComment.trim() || !replyingTo) return;
    
    processMentions(replyComment.trim());
    
    if (replyingTo.type === 'remark' && onAddRemarkReply) {
      onAddRemarkReply(replyingTo.id, replyComment.trim(), replyAttachments.length > 0 ? replyAttachments : undefined);
    } else if (replyingTo.type === 'rework' && onAddReworkReply) {
      onAddReworkReply(replyingTo.id, replyComment.trim(), replyAttachments.length > 0 ? replyAttachments : undefined);
    } else if (replyingTo.type === 'endorsement' && onAddEndorsementReply) {
      onAddEndorsementReply(replyingTo.id, replyComment.trim(), replyAttachments.length > 0 ? replyAttachments : undefined);
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
      const cfg = reworkConfigs.find(c => c.id === selectedNewReasonId);
      // Post-resolution owner is OPTIONAL — empty means use team default
      const postResolutionOwner = cfg?.manualOverrideEnabled ? (reassignPostResolutionOwner || undefined) : undefined;
      onReworkReassign(reassignEntryId, selectedNewReasonId, reassignDetails, reassignAttachments, postResolutionOwner);
      resetReassignForm();
    }
  };

  const resetReassignForm = () => {
    setReassignEntryId(null);
    setSelectedNewReasonId('');
    setReassignDetails('');
    setReassignAttachments([]);
    setReassignPostResolutionOwner('');
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
    return <AttachmentDisplay attachments={attachments} size="md" />;
  };

  const renderReplies = (replies?: ThreadReply[], variant: 'default' | 'success' | 'muted' = 'default') => {
    if (!replies || replies.length === 0) return null;
    return (
      <div className="mt-2 pl-3 border-l-2 border-muted space-y-2">
        {replies.map(reply => (
          <div key={reply.id} className="py-1.5">
            <ExpandableText 
              text={reply.comment} 
              className="text-xs text-foreground/90" 
              maxLines={3}
              lineHeight={16}
              variant={variant}
            />
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
            <ExpandableText text={remark.comment} className="text-sm text-foreground" maxLines={4} variant="muted" />
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
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Reply className="w-3 h-3" />
            {language === 'th' ? 'ตอบกลับ' : 'Reply'}
          </button>
        </div>

        {/* Expanded replies */}
        {hasReplies && isExpanded && renderReplies(remark.replies, 'muted')}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <MentionTextarea
              placeholder={language === 'th' ? 'เพิ่มความคิดเห็น... (พิมพ์ @ เพื่อ tag คน)' : 'Add a reply... (type @ to tag someone)'}
              value={replyComment}
              onChange={setReplyComment}
              className="min-h-[60px] resize-none text-xs"
            />
            {replyAttachments.length > 0 && (
              <AttachmentThumbnails 
                attachments={replyAttachments} 
                onRemove={(id) => removeAttachment(id, 'reply')}
                size="sm"
              />
            )}
            <div className="flex items-center justify-between">
              <input ref={replyFileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'reply')} />
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => replyFileInputRef.current?.click()}>
                <Paperclip className="w-3 h-3 mr-1" />
                {language === 'th' ? 'แนบไฟล์' : 'Attach'}
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
            ? 'bg-warning/10 border-primary/40'
            : 'bg-green-500/10 border-green-500/30'
        )}
      >
        {/* Main rework entry */}
        <div className="flex items-start gap-2">
          {isActive ? (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          ) : (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-green-700 dark:text-green-400')}>
                {getReasonLabel(entry)}
              </p>
              {(() => {
                const config = reworkConfigs.find(c => c.id === entry.reasonId);
                const isInternal = config?.partyType === 'internal';
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center">
                        {isInternal ? (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Globe className="w-3 h-3 text-muted-foreground" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {isInternal 
                        ? (language === 'th' ? 'ภายใน (ตัวแทนจะไม่เห็น)' : 'Internal (agent will not see)')
                        : (language === 'th' ? 'ภายนอก (ตัวแทนจะเห็น)' : 'External (agent will see)')
                      }
                    </TooltipContent>
                  </Tooltip>
                );
              })()}
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
              {/* Auto-resolve date display/edit */}
              {entry.autoResolveDate && (
                isActive ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground border-border cursor-pointer hover:bg-accent">
                        <CalendarIcon className="w-2.5 h-2.5 mr-1" />
                        {(() => {
                          const parsed = parse(entry.autoResolveDate, 'dd/MM/yyyy', new Date());
                          return format(parsed, 'd MMM yyyy', language === 'th' ? { locale: thLocale } : undefined);
                        })()}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[60]" align="start">
                      <Calendar
                        mode="single"
                        selected={parse(entry.autoResolveDate, 'dd/MM/yyyy', new Date())}
                        onSelect={(date) => {
                          if (date && onUpdateAutoResolveDate) {
                            onUpdateAutoResolveDate(entry.id, format(date, 'dd/MM/yyyy'));
                          }
                        }}
                        disabled={(date) => date <= startOfDay(new Date())}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground border-border">
                    <CalendarIcon className="w-2.5 h-2.5 mr-1" />
                    {(() => {
                      const parsed = parse(entry.autoResolveDate, 'dd/MM/yyyy', new Date());
                      return format(parsed, 'd MMM yyyy', language === 'th' ? { locale: thLocale } : undefined);
                    })()}
                  </Badge>
                )
              )}
            </div>
            {entry.details && (
              <ExpandableText 
                text={entry.details} 
                className="text-xs text-muted-foreground mt-1" 
                maxLines={3} 
                lineHeight={16}
                variant={isActive ? 'default' : 'success'}
              />
            )}
            {renderAttachments(entry.attachments)}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{language === 'th' ? 'โดย' : 'By'} {entry.savedBy}</span>
              <span>•</span>
              <span>{formatDate(entry.savedAt)}</span>
            </div>
            {!isActive && entry.resolvedBy && (
              <div className="text-xs text-green-600 mt-1">
                {language === 'th' ? 'แก้ไขโดย' : 'Resolved by'} {entry.resolvedBy.replace(' (Reassigned)', '')} • {entry.resolvedAt}
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
            <div className="flex items-center gap-2 ml-auto">
              {(() => {
                const cfg = reworkConfigs.find(c => c.id === entry.reasonId);
                if (!cfg?.manualOverrideEnabled) return null;
                const nextName = entry.postResolutionOwner;
                if (!nextName) return null;
                const nextTeam = mockStaffMembers.find(s => s.name === nextName)?.team || undefined;
                const label = nextTeam ? `[${nextTeam}] ${nextName}` : nextName;
                return (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-6 px-1.5 bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400"
                    title={language === 'th' ? 'เจ้าของเคสหลังแก้ไข' : 'Owner after resolve'}
                  >
                    <User className="w-2.5 h-2.5 mr-1" />
                    {language === 'th' ? 'หลังแก้ไข: ' : 'Next: '}{label}
                  </Badge>
                );
              })()}
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
        {hasReplies && isExpanded && renderReplies(entry.replies, isActive ? 'default' : 'success')}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <MentionTextarea
              placeholder={language === 'th' ? 'เพิ่มความคิดเห็น... (พิมพ์ @ เพื่อ tag คน)' : 'Add a reply... (type @ to tag someone)'}
              value={replyComment}
              onChange={setReplyComment}
              className="min-h-[60px] resize-none text-xs"
            />
            {replyAttachments.length > 0 && (
              <AttachmentThumbnails 
                attachments={replyAttachments} 
                onRemove={(id) => removeAttachment(id, 'reply')}
                size="sm"
              />
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

  const renderEndorsementThread = (entry: PolicyEndorsementEntry) => {
    const hasReplies = entry.replies && entry.replies.length > 0;
    const isExpanded = expandedThreads.has(entry.id);
    const isReplying = replyingTo?.id === entry.id && replyingTo?.type === 'endorsement';
    const isCancellation = entry.endorsementType === 'policy_cancellation';

    return (
      <div
        key={entry.id}
        className={cn(
          'p-3 rounded-lg border',
          isCancellation
            ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
        )}
      >
        {/* Main endorsement entry */}
        <div className="flex items-start gap-2">
          {isCancellation ? (
            <FileX className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <FileCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('text-sm font-medium', isCancellation ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400')}>
                {endorsementStatusLabels[entry.toStatus]?.[language] || entry.toStatus}
              </p>
              {entry.assignedTo && (
                <Badge variant="outline" className={cn(
                  'text-[10px] h-5 px-1.5',
                  isCancellation
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                    : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                )}>
                  <User className="w-2.5 h-2.5 mr-1" />
                  {entry.assignedTo}
                </Badge>
              )}
            </div>
            {entry.details && (
              <ExpandableText 
                text={entry.details} 
                className="text-xs text-muted-foreground mt-1" 
                maxLines={3} 
                lineHeight={16}
              />
            )}
            {renderAttachments(entry.attachments)}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{language === 'th' ? 'โดย' : 'By'} {entry.savedBy}</span>
              <span>•</span>
              <span>{formatDate(entry.savedAt)}</span>
            </div>
          </div>
        </div>

        {/* Thread controls - no resolve/reassign for endorsements */}
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
            onClick={() => setReplyingTo(isReplying ? null : { id: entry.id, type: 'endorsement' })}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Reply className="w-3 h-3" />
            {language === 'th' ? 'ตอบกลับ' : 'Reply'}
          </button>
        </div>

        {/* Expanded replies */}
        {hasReplies && isExpanded && renderReplies(entry.replies)}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <MentionTextarea
              placeholder={language === 'th' ? 'เพิ่มความคิดเห็น... (พิมพ์ @ เพื่อ tag คน)' : 'Add a reply... (type @ to tag someone)'}
              value={replyComment}
              onChange={setReplyComment}
              className="min-h-[60px] resize-none text-xs"
            />
            {replyAttachments.length > 0 && (
              <AttachmentThumbnails 
                attachments={replyAttachments} 
                onRemove={(id) => removeAttachment(id, 'reply')}
                size="sm"
              />
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


  // Also filter by policy scope - show only configs that match this policy kind or 'both'
  const stageFilteredConfigs = reworkConfigs.filter(config => 
    config.configType === 'rework' &&
    config.stages.includes(currentStage) && 
    (config.policyScope === 'both' || config.policyScope === policyKind)
  );

  // Helper to get party type label with prefix
  const getPartyTypeLabel = (partyType: string) => {
    if (partyType === 'external') {
      return language === 'th' ? '[ภายนอก]' : '[External]';
    }
    return language === 'th' ? '[ภายใน]' : '[Internal]';
  };

  // Helper to get config label with party type prefix
  const getConfigLabelWithParty = (config: typeof reworkConfigs[0]) => {
    const partyPrefix = getPartyTypeLabel(config.partyType);
    const description = language === 'th' ? config.descriptionTh : config.descriptionEn;
    return `${partyPrefix} ${description}`;
  };

  // Group configs by party type for better organization
  const groupedConfigs = (configs: typeof reworkConfigs) => {
    const internal = configs.filter(c => c.partyType === 'internal');
    const external = configs.filter(c => c.partyType === 'external');
    return { internal, external };
  };

  // State for adding new rework reason
  const [showAddRework, setShowAddRework] = useState(false);
  const [newReworkReasonId, setNewReworkReasonId] = useState('');
  const [newReworkDetails, setNewReworkDetails] = useState('');
  const [newReworkAttachments, setNewReworkAttachments] = useState<ReworkAttachment[]>([]);
  const [newReworkAutoResolveDate, setNewReworkAutoResolveDate] = useState<Date | undefined>(undefined);
  const [newReworkPostResolutionOwner, setNewReworkPostResolutionOwner] = useState<string>('');
  const [reassignPostResolutionOwner, setReassignPostResolutionOwner] = useState<string>('');
  const addReworkFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddReworkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setNewReworkAttachments(prev => [...prev, ...newAttachments]);
    if (addReworkFileInputRef.current) addReworkFileInputRef.current.value = '';
  };

  const resetAddReworkForm = () => {
    setShowAddRework(false);
    setNewReworkReasonId('');
    setNewReworkDetails('');
    setNewReworkAttachments([]);
    setNewReworkAutoResolveDate(undefined);
    setNewReworkPostResolutionOwner('');
  };

  if (!open) return null;

  const handleClose = () => {
    onOpenChange(false);
    resetReassignForm();
    resetAddReworkForm();
    setReplyingTo(null);
    setReplyComment('');
    setReplyAttachments([]);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={handleClose} />

      {/* Sidesheet */}
      <div className="fixed right-0 top-0 z-50 h-screen w-[480px] bg-card border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right-full duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {availablePolicies && availablePolicies.length > 1 && onPolicyKindChange ? (
              <Select value={policyKind} onValueChange={(v) => onPolicyKindChange(v as 'vmi' | 'cmi')}>
                <SelectTrigger className={cn(
                  "h-6 w-[72px] text-[10px] font-semibold border",
                  policyKind === 'vmi' 
                    ? "bg-blue-500/20 text-blue-600 border-blue-500/30" 
                    : "bg-purple-500/20 text-purple-600 border-purple-500/30"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {availablePolicies.map(k => (
                    <SelectItem key={k} value={k} className="text-xs">{k.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge 
                className={cn(
                  "text-[10px] h-5 px-1.5",
                  policyKind === 'vmi' 
                    ? "bg-blue-500/20 text-blue-600 border-blue-500/30" 
                    : "bg-purple-500/20 text-purple-600 border-purple-500/30"
                )}
              >
                {policyKind.toUpperCase()}
              </Badge>
            )}
            <h3 className="text-sm font-semibold">
              {language === 'th' ? 'หมายเหตุ & งานติดปัญหา' : 'Remarks & Rework'}
            </h3>
            {unresolvedEntries.length > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-primary border-primary/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {unresolvedEntries.length} {language === 'th' ? 'งานติดปัญหา' : 'Active'}
              </Badge>
            )}
          </div>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {reassignEntryId ? (
          // Reassign Form
          <div className="space-y-4 p-4 overflow-y-auto flex-1">
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
              <SearchableReasonSelect
                configs={reworkConfigs.filter(config => 
                  config.configType === 'rework' &&
                  config.id !== currentReassignEntry?.reasonId && 
                  config.stages.includes(currentStage) &&
                  (config.policyScope === 'both' || config.policyScope === policyKind)
                )}
                value={selectedNewReasonId}
                onValueChange={(v) => { setSelectedNewReasonId(v); setReassignPostResolutionOwner(''); }}
              />
            </div>

            {/* Post-Resolution Owner picker (optional) — when Manual Override is enabled */}
            {(() => {
              const cfg = reworkConfigs.find(c => c.id === selectedNewReasonId);
              if (!cfg?.manualOverrideEnabled) return null;
              return (
                <div className="space-y-2">
                  <Label className="text-xs">
                    {language === 'th' ? 'กำหนดเอง (ไม่บังคับ)' : 'Manual Override (optional)'}
                  </Label>
                  <SearchableStaffSelect
                    value={reassignPostResolutionOwner}
                    onValueChange={setReassignPostResolutionOwner}
                  />
                </div>
              );
            })()}

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
              <AttachmentThumbnails 
                attachments={reassignAttachments} 
                onRemove={(id) => removeAttachment(id, 'reassign')}
                size="sm"
              />
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
            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
              
                {/* Show add rework button at top if no timeline items */}
                {timeline.length === 0 && !showAddRework && stageFilteredConfigs.length > 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground mb-4">
                      {language === 'th' ? 'ยังไม่มีหมายเหตุหรืองานติดปัญหา' : 'No remarks or rework issues yet'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-primary/50 text-primary hover:bg-warning/10 hover:text-primary"
                      onClick={() => setShowAddRework(true)}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      {language === 'th' ? 'เพิ่มเหตุผลงานติดปัญหา' : 'Add Rework Reason'}
                    </Button>
                  </div>
                )}
                
                {timeline.length === 0 && !showAddRework && stageFilteredConfigs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    {language === 'th' ? 'ยังไม่มีหมายเหตุหรืองานติดปัญหา' : 'No remarks or rework issues yet'}
                  </div>
                )}
                
                {/* Timeline items */}
                {timeline.map(item => {
                  if (item.type === 'remark') return renderRemarkThread(item.data as PolicyRemark);
                  if (item.type === 'endorsement') return renderEndorsementThread(item.data as PolicyEndorsementEntry);
                  return renderReworkThread(item.data as PolicyReworkEntry);
                })}
                
                {/* Add Rework Reason form - shown at bottom of timeline */}
                {showAddRework && stageFilteredConfigs.length > 0 && (
                  <div className="p-3 bg-warning/5 border border-primary/40 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <AlertTriangle className="w-4 h-4" />
                        {language === 'th' ? 'เพิ่มเหตุผลงานติดปัญหา' : 'Add Rework Reason'}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetAddReworkForm}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">{language === 'th' ? 'เหตุผล' : 'Reason'}</Label>
                      <SearchableReasonSelect
                        configs={stageFilteredConfigs}
                        value={newReworkReasonId}
                        onValueChange={(v) => { setNewReworkReasonId(v); setNewReworkPostResolutionOwner(''); }}
                      />
                    </div>

                    {/* Post-Resolution Owner picker (optional) — when Manual Override is enabled */}
                    {(() => {
                      const selectedConfig = reworkConfigs.find(c => c.id === newReworkReasonId);
                      if (!selectedConfig?.manualOverrideEnabled) return null;
                      return (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            {language === 'th' ? 'กำหนดเอง (ไม่บังคับ)' : 'Manual Override (optional)'}
                          </Label>
                          <SearchableStaffSelect
                            value={newReworkPostResolutionOwner}
                            onValueChange={setNewReworkPostResolutionOwner}
                          />
                        </div>
                      );
                    })()}

                    <div className="space-y-2">
                      <Label className="text-xs">{language === 'th' ? 'รายละเอียด (ไม่บังคับ)' : 'Details (optional)'}</Label>
                      <MentionTextarea
                        placeholder={language === 'th' ? 'ใส่รายละเอียดเพิ่มเติม... (พิมพ์ @ เพื่อ tag คน)' : 'Enter detailed reason... (type @ to tag someone)'}
                        value={newReworkDetails}
                        onChange={setNewReworkDetails}
                        className="min-h-[60px] resize-none text-xs"
                      />
                    </div>

                    {/* Auto-resolve date picker - show when selected reason is auto_resolve */}
                    {(() => {
                      const selectedConfig = reworkConfigs.find(c => c.id === newReworkReasonId);
                      const isAutoResolve = selectedConfig?.automationEnabled && selectedConfig?.automationType === 'auto_resolve';
                      if (!isAutoResolve) return null;
                      return (
                        <div className="space-y-2">
                          <Label className="text-xs">{language === 'th' ? 'วันที่ Auto-Resolve' : 'Auto-Resolve Date'}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full justify-start text-left font-normal h-8 text-xs",
                                  !newReworkAutoResolveDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                {newReworkAutoResolveDate
                                  ? format(newReworkAutoResolveDate, 'd MMM yyyy', language === 'th' ? { locale: thLocale } : undefined)
                                  : (language === 'th' ? 'เลือกวันที่' : 'Select date')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[60]" align="start">
                              <Calendar
                                mode="single"
                                selected={newReworkAutoResolveDate}
                                onSelect={setNewReworkAutoResolveDate}
                                disabled={(date) => date <= startOfDay(new Date())}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      );
                    })()}

                    <div className="space-y-2">
                      <AttachmentThumbnails
                        attachments={newReworkAttachments} 
                        onRemove={(id) => setNewReworkAttachments(prev => prev.filter(a => a.id !== id))}
                        size="sm"
                      />
                      <input ref={addReworkFileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={handleAddReworkFileSelect} />
                      <Button type="button" variant="outline" size="sm" onClick={() => addReworkFileInputRef.current?.click()} className="h-7 text-xs">
                        <Upload className="w-3 h-3 mr-1.5" />
                        {language === 'th' ? 'แนบไฟล์' : 'Attach files'}
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetAddReworkForm}>
                        {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs bg-warning hover:bg-warning/90 text-warning-foreground" 
                        disabled={!newReworkReasonId}
                        onClick={() => {
                          if (onAddRework && newReworkReasonId) {
                            // Process mentions in rework details
                            if (newReworkDetails.trim()) {
                              processMentions(newReworkDetails.trim());
                            }
                            const selectedConfig = reworkConfigs.find(c => c.id === newReworkReasonId);
                            const isAutoResolve = selectedConfig?.automationEnabled && selectedConfig?.automationType === 'auto_resolve';
                            const resolveDate = isAutoResolve && newReworkAutoResolveDate 
                              ? format(newReworkAutoResolveDate, 'dd/MM/yyyy') 
                              : undefined;
                            const postResolutionOwner = selectedConfig?.manualOverrideEnabled ? (newReworkPostResolutionOwner || undefined) : undefined;
                            onAddRework(policyId, newReworkReasonId, newReworkDetails, newReworkAttachments, resolveDate, postResolutionOwner);
                            resetAddReworkForm();
                          }
                        }}
                      >
                        {language === 'th' ? 'เพิ่มเหตุผล' : 'Add Reason'}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Add more rework button - shown after timeline items when there are items */}
                {!showAddRework && stageFilteredConfigs.length > 0 && timeline.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-8 text-xs border-primary/50 text-primary hover:bg-warning/10 hover:text-primary"
                    onClick={() => setShowAddRework(true)}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1.5" />
                    {language === 'th' ? 'เพิ่มเหตุผลงานติดปัญหา' : 'Add Rework Reason'}
                  </Button>
                )}
              </div>
            </ScrollArea>

            {/* Add New Remark */}
            <div className="border-t px-4 py-3 shrink-0">
              <div className="space-y-2">
                <MentionTextarea
                  placeholder={language === 'th' ? 'เพิ่มหมายเหตุ... (พิมพ์ @ เพื่อ tag คน)' : 'Add a remark... (type @ to tag someone)'}
                  value={newComment}
                  onChange={setNewComment}
                  className="min-h-[70px] resize-none"
                />
                {newCommentAttachments.length > 0 && (
                  <AttachmentThumbnails 
                    attachments={newCommentAttachments} 
                    onRemove={(id) => removeAttachment(id, 'new')}
                    size="sm"
                  />
                )}
                <div className="flex justify-end items-center">
                  <div className="flex items-center gap-2">
                    <input ref={newCommentFileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'new')} />
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => newCommentFileInputRef.current?.click()}>
                      <Paperclip className="w-4 h-4 mr-1" />
                      {language === 'th' ? 'แนบไฟล์' : 'Attach'}
                    </Button>
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
      </div>
    </>
  );
}
