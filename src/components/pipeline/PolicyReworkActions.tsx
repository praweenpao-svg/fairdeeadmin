import { useState, useRef } from 'react';
import { CheckCircle, ArrowRightLeft, Upload, X, FileText, Image, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ReworkConfig, ReworkAttachment, PolicyRecord, PolicyReworkEntry } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PolicyReworkActionsProps {
  policy: PolicyRecord;
  reworkConfigs: ReworkConfig[];
  onResolve: (policyId: string, entryId: string) => void;
  onReassign: (policyId: string, entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
  onAddRework: (policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

export function PolicyReworkActions({
  policy,
  reworkConfigs,
  onResolve,
  onReassign,
  onAddRework,
}: PolicyReworkActionsProps) {
  const { language } = useLanguageStore();
  const [mainPopoverOpen, setMainPopoverOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'reassign' | 'add'>('list');
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [selectedNewReasonId, setSelectedNewReasonId] = useState<string>('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [reassignAttachments, setReassignAttachments] = useState<ReworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all unresolved rework entries
  const unresolvedEntries = policy.reworkHistory?.filter(e => !e.resolved) || [];

  // If no active rework, don't render
  if (unresolvedEntries.length === 0 || policy.status !== 'rework_required') {
    return null;
  }

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
    if (selectedNewReasonId && selectedEntryId) {
      onReassign(policy.id, selectedEntryId, selectedNewReasonId, reassignDetails, reassignAttachments);
      resetAndClose();
    }
  };

  const handleAddReworkConfirm = () => {
    if (selectedNewReasonId) {
      onAddRework(policy.id, selectedNewReasonId, reassignDetails, reassignAttachments);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setMainPopoverOpen(false);
    setActiveView('list');
    setSelectedEntryId('');
    setSelectedNewReasonId('');
    setReassignDetails('');
    setReassignAttachments([]);
  };

  const handleResolve = (entryId: string) => {
    onResolve(policy.id, entryId);
    // If this was the last entry, close the popover
    if (unresolvedEntries.length === 1) {
      resetAndClose();
    }
  };

  const startReassign = (entryId: string) => {
    setSelectedEntryId(entryId);
    setActiveView('reassign');
  };

  const startAddRework = () => {
    setActiveView('add');
  };

  const getReasonLabel = (entry: PolicyReworkEntry) => {
    const config = reworkConfigs.find(c => c.id === entry.reasonId);
    return language === 'th' 
      ? (config?.descriptionTh || entry.reasonLabel)
      : (config?.descriptionEn || entry.reasonLabel);
  };

  // Get the current entry being reassigned
  const currentEntry = unresolvedEntries.find(e => e.id === selectedEntryId);

  // Get existing reason IDs to exclude from add/reassign options
  const existingReasonIds = unresolvedEntries.map(e => e.reasonId);

  return (
    <Popover open={mainPopoverOpen} onOpenChange={(open) => {
      setMainPopoverOpen(open);
      if (!open) {
        resetAndClose();
      }
    }}>
      <PopoverTrigger asChild>
        <div 
          className="w-[160px] h-8 text-xs border border-warning text-warning rounded-md px-3 flex items-center gap-2 cursor-pointer bg-warning/10"
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {language === 'th' ? 'งานติดปัญหา' : 'Rework'}
            {unresolvedEntries.length > 1 && ` (${unresolvedEntries.length})`}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 z-50 p-0" align="start">
        {activeView === 'list' ? (
          <div className="p-4 space-y-4">
            {/* Header with count */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'รายการงานติดปัญหา' : 'Rework Issues'}
                <span className="ml-1.5 text-muted-foreground">({unresolvedEntries.length})</span>
              </div>
            </div>

            {/* List of all unresolved rework entries */}
            <ScrollArea className={unresolvedEntries.length > 2 ? 'h-[200px]' : ''}>
              <div className="space-y-3 pr-2">
                {unresolvedEntries.map((entry, index) => (
                  <div key={entry.id} className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warning truncate">
                          {getReasonLabel(entry)}
                        </p>
                        {entry.details && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.details}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          <span>{language === 'th' ? 'โดย' : 'By'} {entry.savedBy}</span>
                          <span className="mx-1">•</span>
                          <span>{entry.savedAt}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions for this entry */}
                    <div className="flex gap-2 mt-3 pt-2 border-t border-warning/20">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => handleResolve(entry.id)}
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
            </ScrollArea>

            {/* Add Another Reason button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={startAddRework}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {language === 'th' ? 'เพิ่มเหตุผลอื่น' : 'Add another reason'}
              </Button>
            </div>
          </div>
        ) : activeView === 'reassign' ? (
          // Reassign form
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'มอบหมายงานใหม่' : 'Reassign rework'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setActiveView('list');
                  setSelectedEntryId('');
                  setSelectedNewReasonId('');
                  setReassignDetails('');
                  setReassignAttachments([]);
                }}
              >
                {language === 'th' ? 'กลับ' : 'Back'}
              </Button>
            </div>

            {/* Show current reason being reassigned */}
            {currentEntry && (
              <div className="p-2 bg-muted/50 border rounded text-xs">
                <span className="text-muted-foreground">{language === 'th' ? 'จาก:' : 'From:'}</span>
                <span className="ml-1 font-medium">{getReasonLabel(currentEntry)}</span>
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
                    .filter((config) => config.id !== currentEntry?.reasonId)
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
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetAndClose}>
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
          // Add new rework form
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'เพิ่มเหตุผลใหม่' : 'Add new reason'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setActiveView('list');
                  setSelectedNewReasonId('');
                  setReassignDetails('');
                  setReassignAttachments([]);
                }}
              >
                {language === 'th' ? 'กลับ' : 'Back'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'เลือกเหตุผล' : 'Select reason'}</Label>
              <Select value={selectedNewReasonId} onValueChange={setSelectedNewReasonId}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder={language === 'th' ? 'เลือกเหตุผล' : 'Select reason'} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {reworkConfigs
                    .filter((config) => !existingReasonIds.includes(config.id))
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
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetAndClose}>
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleAddReworkConfirm}
                disabled={!selectedNewReasonId}
              >
                {language === 'th' ? 'เพิ่มเหตุผล' : 'Add reason'}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
