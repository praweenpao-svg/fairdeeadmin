import { useState, useRef } from 'react';
import { MessageSquare, Send, CheckCircle, ArrowRightLeft, Upload, X, FileText, Image, AlertTriangle, User } from 'lucide-react';
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
import { PolicyRemark, PolicyReworkEntry, ReworkConfig, ReworkAttachment, PolicyStatus } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface PolicyRemarksReworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyKind: 'vmi' | 'cmi';
  remarks: PolicyRemark[];
  reworkHistory: PolicyReworkEntry[];
  reworkConfigs: ReworkConfig[];
  onAddRemark: (comment: string) => void;
  onReworkResolve: (entryId: string) => void;
  onReworkReassign: (entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

export function PolicyRemarksReworkDialog({
  open,
  onOpenChange,
  policyKind,
  remarks,
  reworkHistory,
  reworkConfigs,
  onAddRemark,
  onReworkResolve,
  onReworkReassign,
}: PolicyRemarksReworkDialogProps) {
  const { language } = useLanguageStore();
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'remarks' | 'rework'>('remarks');
  
  // Reassign form state
  const [reassignEntryId, setReassignEntryId] = useState<string | null>(null);
  const [selectedNewReasonId, setSelectedNewReasonId] = useState<string>('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [reassignAttachments, setReassignAttachments] = useState<ReworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unresolved rework entries
  const unresolvedEntries = reworkHistory.filter(e => !e.resolved);
  const resolvedEntries = reworkHistory.filter(e => e.resolved);

  const handleSubmitRemark = () => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'pdf') {
        const attachment: ReworkAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: ext === 'jpeg' ? 'jpg' : (ext as 'png' | 'jpg' | 'pdf'),
          url: URL.createObjectURL(file),
        };
        setReassignAttachments((prev) => [...prev, attachment]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setReassignAttachments((prev) => prev.filter((a) => a.id !== id));
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

  const startReassign = (entryId: string) => {
    setReassignEntryId(entryId);
  };

  const getReasonLabel = (entry: PolicyReworkEntry) => {
    const config = reworkConfigs.find(c => c.id === entry.reasonId);
    return language === 'th' 
      ? (config?.descriptionTh || entry.reasonLabel)
      : (config?.descriptionEn || entry.reasonLabel);
  };

  // Get the current entry being reassigned
  const currentReassignEntry = unresolvedEntries.find(e => e.id === reassignEntryId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        resetReassignForm();
      }
    }}>
      <DialogContent className="sm:max-w-[550px]">
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'remarks' | 'rework')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="remarks" className="text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {language === 'th' ? 'หมายเหตุ' : 'Remarks'}
              {remarks.length > 0 && <span className="ml-1.5 text-muted-foreground">({remarks.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="rework" className="text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              {language === 'th' ? 'งานติดปัญหา' : 'Rework'}
              {unresolvedEntries.length > 0 && (
                <span className="ml-1.5 text-warning">({unresolvedEntries.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Remarks Tab */}
          <TabsContent value="remarks" className="space-y-4 mt-4">
            <ScrollArea className="h-[280px] pr-4">
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
                      handleSubmitRemark();
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {language === 'th' ? 'Ctrl+Enter เพื่อส่ง' : 'Ctrl+Enter to send'}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSubmitRemark}
                    disabled={!newComment.trim()}
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    {language === 'th' ? 'ส่ง' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Rework Tab */}
          <TabsContent value="rework" className="space-y-4 mt-4">
            {reassignEntryId ? (
              // Reassign Form
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {language === 'th' ? 'มอบหมายงานใหม่' : 'Reassign rework'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={resetReassignForm}
                  >
                    {language === 'th' ? 'กลับ' : 'Back'}
                  </Button>
                </div>

                {/* Show current reason being reassigned */}
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
                        .filter((config) => config.id !== currentReassignEntry?.reasonId)
                        .map((config) => (
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
                    {reassignAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs"
                      >
                        {attachment.type === 'pdf' ? (
                          <FileText className="w-3 h-3 text-destructive" />
                        ) : (
                          <Image className="w-3 h-3 text-primary" />
                        )}
                        <span className="max-w-[80px] truncate">{attachment.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1.5" />
                    {language === 'th' ? 'แนบไฟล์' : 'Attach files'}
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetReassignForm}>
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleReassignConfirm}
                    disabled={!selectedNewReasonId}
                  >
                    {language === 'th' ? 'มอบหมายใหม่' : 'Reassign'}
                  </Button>
                </div>
              </div>
            ) : (
              // Rework List View
              <ScrollArea className="h-[350px] pr-4">
                {/* Active Rework Entries */}
                {unresolvedEntries.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language === 'th' ? 'งานติดปัญหาที่ยังไม่แก้ไข' : 'Active Rework Issues'}
                    </div>
                    {unresolvedEntries.map((entry) => (
                      <div key={entry.id} className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warning truncate">
                              {getReasonLabel(entry)}
                            </p>
                            {entry.details && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.details}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-muted-foreground">
                              <span>{language === 'th' ? 'โดย' : 'By'} {entry.savedBy}</span>
                              <span>•</span>
                              <span>{entry.savedAt}</span>
                            </div>
                            {/* Owner display */}
                            {entry.assignedTo && (
                              <div className="flex items-center gap-1 mt-2">
                                <User className="w-3 h-3 text-primary" />
                                <span className="text-xs font-medium text-primary">
                                  {language === 'th' ? 'ผู้รับผิดชอบ:' : 'Owner:'} {entry.assignedTo}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions for this entry */}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-warning/20">
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => onReworkResolve(entry.id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {language === 'th' ? 'แก้ไขแล้ว' : 'Resolve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={() => startReassign(entry.id)}
                          >
                            <ArrowRightLeft className="w-3 h-3 mr-1" />
                            {language === 'th' ? 'มอบหมายใหม่' : 'Reassign'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Active Rework */}
                {unresolvedEntries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {language === 'th' ? 'ไม่มีงานติดปัญหา' : 'No active rework issues'}
                  </div>
                )}

                {/* Resolved Rework History */}
                {resolvedEntries.length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language === 'th' ? 'ประวัติงานติดปัญหาที่แก้ไขแล้ว' : 'Resolved Rework History'}
                    </div>
                    {[...resolvedEntries].reverse().map((entry) => (
                      <div key={entry.id} className="p-3 bg-muted/30 border border-border rounded-lg opacity-70">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              <p className="text-sm font-medium text-muted-foreground line-through truncate">
                                {getReasonLabel(entry)}
                              </p>
                            </div>
                            {entry.details && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.details}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-muted-foreground">
                              <span>{language === 'th' ? 'แก้ไขโดย' : 'Resolved by'} {entry.resolvedBy}</span>
                              <span>•</span>
                              <span>{entry.resolvedAt}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
