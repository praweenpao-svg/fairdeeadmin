import { useState, useRef } from 'react';
import { CheckCircle, ArrowRightLeft, Upload, X, FileText, Image, AlertTriangle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';

interface PolicyReworkActionsProps {
  policy: PolicyRecord;
  reworkConfigs: ReworkConfig[];
  onResolve: (policyId: string, entryIds?: string[]) => void;
  onReassign: (policyId: string, newReasonId: string, details: string, attachments: ReworkAttachment[], entryIds?: string[]) => void;
  onAddRework?: (policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[]) => void;
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
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNewReasonId, setSelectedNewReasonId] = useState<string>('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [reassignAttachments, setReassignAttachments] = useState<ReworkAttachment[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [showAllReasons, setShowAllReasons] = useState(false);
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
    if (selectedNewReasonId) {
      const entriesToReassign = selectedEntryIds.length > 0 ? selectedEntryIds : unresolvedEntries.map(e => e.id);
      onReassign(policy.id, selectedNewReasonId, reassignDetails, reassignAttachments, entriesToReassign);
      resetAndClose();
    }
  };

  const handleAddConfirm = () => {
    if (selectedNewReasonId && onAddRework) {
      onAddRework(policy.id, selectedNewReasonId, reassignDetails, reassignAttachments);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setMainPopoverOpen(false);
    setShowReassignForm(false);
    setShowAddForm(false);
    setSelectedNewReasonId('');
    setReassignDetails('');
    setReassignAttachments([]);
    setSelectedEntryIds([]);
    setShowAllReasons(false);
  };

  const handleResolve = () => {
    const entriesToResolve = selectedEntryIds.length > 0 ? selectedEntryIds : unresolvedEntries.map(e => e.id);
    onResolve(policy.id, entriesToResolve);
    resetAndClose();
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntryIds(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const selectAllEntries = () => {
    if (selectedEntryIds.length === unresolvedEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(unresolvedEntries.map(e => e.id));
    }
  };

  const getReasonLabel = (entry: PolicyReworkEntry) => {
    const config = reworkConfigs.find(c => c.id === entry.reasonId);
    return language === 'th' 
      ? (config?.descriptionTh || entry.reasonLabel)
      : (config?.descriptionEn || entry.reasonLabel);
  };

  // Get unique reasons that are not currently active
  const availableReasons = reworkConfigs.filter(
    config => !unresolvedEntries.some(e => e.reasonId === config.id)
  );

  const displayedEntries = showAllReasons ? unresolvedEntries : unresolvedEntries.slice(0, 2);

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
      <PopoverContent className="w-96 z-50 max-h-[500px] overflow-y-auto" align="start">
        {!showReassignForm && !showAddForm ? (
          <div className="space-y-4">
            {/* Header with selection controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'เหตุผลที่ต้องแก้ไข' : 'Rework Reasons'}
                <span className="text-xs text-muted-foreground ml-1">
                  ({unresolvedEntries.length})
                </span>
              </div>
              {unresolvedEntries.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={selectAllEntries}
                >
                  {selectedEntryIds.length === unresolvedEntries.length 
                    ? (language === 'th' ? 'ยกเลิกทั้งหมด' : 'Deselect all')
                    : (language === 'th' ? 'เลือกทั้งหมด' : 'Select all')}
                </Button>
              )}
            </div>

            {/* Rework Reasons List with Checkboxes */}
            <div className="space-y-2">
              {displayedEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className={cn(
                    "p-3 bg-warning/10 border rounded-md cursor-pointer transition-colors",
                    selectedEntryIds.includes(entry.id) 
                      ? "border-warning" 
                      : "border-warning/20 hover:border-warning/40"
                  )}
                  onClick={() => toggleEntrySelection(entry.id)}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedEntryIds.includes(entry.id)}
                      onCheckedChange={() => toggleEntrySelection(entry.id)}
                      className="mt-0.5 border-warning data-[state=checked]:bg-warning data-[state=checked]:text-warning-foreground"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warning">
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
                </div>
              ))}
              
              {/* Show more/less button */}
              {unresolvedEntries.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground"
                  onClick={() => setShowAllReasons(!showAllReasons)}
                >
                  {showAllReasons ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      {language === 'th' ? 'แสดงน้อยลง' : 'Show less'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      {language === 'th' ? `แสดงเพิ่มเติม (${unresolvedEntries.length - 2})` : `Show ${unresolvedEntries.length - 2} more`}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Selection summary */}
            {selectedEntryIds.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                {language === 'th' 
                  ? `เลือก ${selectedEntryIds.length} จาก ${unresolvedEntries.length} เหตุผล`
                  : `${selectedEntryIds.length} of ${unresolvedEntries.length} selected`}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                  onClick={handleResolve}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'th' 
                    ? (selectedEntryIds.length > 0 ? `แก้ไขแล้ว (${selectedEntryIds.length})` : 'แก้ไขทั้งหมด')
                    : (selectedEntryIds.length > 0 ? `Resolve (${selectedEntryIds.length})` : 'Resolve all')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setShowReassignForm(true)}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'th' ? 'มอบหมายใหม่' : 'Reassign'}
                </Button>
              </div>
              
              {/* Add more rework button */}
              {availableReasons.length > 0 && onAddRework && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'th' ? 'เพิ่มเหตุผลอื่น' : 'Add another reason'}
                </Button>
              )}
            </div>
          </div>
        ) : showAddForm ? (
          // Add new rework form
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'เพิ่มเหตุผลการแก้ไข' : 'Add rework reason'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setShowAddForm(false);
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
                  {availableReasons.map((config) => (
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
                onClick={handleAddConfirm}
                disabled={!selectedNewReasonId}
              >
                {language === 'th' ? 'เพิ่ม' : 'Add'}
              </Button>
            </div>
          </div>
        ) : (
          // Reassign form
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'มอบหมายงานใหม่' : 'Reassign rework'}
                {selectedEntryIds.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({selectedEntryIds.length})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setShowReassignForm(false);
                  setSelectedNewReasonId('');
                  setReassignDetails('');
                  setReassignAttachments([]);
                }}
              >
                {language === 'th' ? 'กลับ' : 'Back'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'เลือกเหตุผลใหม่' : 'Select new reason'}</Label>
              <Select value={selectedNewReasonId} onValueChange={setSelectedNewReasonId}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder={language === 'th' ? 'เลือกเหตุผล' : 'Select reason'} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {reworkConfigs.map((config) => (
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
        )}
      </PopoverContent>
    </Popover>
  );
}
