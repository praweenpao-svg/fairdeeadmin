import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SearchableReasonSelect } from '@/components/pipeline/SearchableReasonSelect';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ReworkConfig, ReworkAttachment, PolicyRecord, PipelineStage } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';

interface PolicyReworkActionsProps {
  policy: PolicyRecord;
  reworkConfigs: ReworkConfig[];
  currentStage: PipelineStage;
  onAddRework: (policyId: string, reasonId: string, details: string, attachments: ReworkAttachment[]) => void;
  onOpenRemarks: () => void;
}

export function PolicyReworkActions({
  policy,
  reworkConfigs,
  currentStage,
  onAddRework,
  onOpenRemarks,
}: PolicyReworkActionsProps) {
  const { language } = useLanguageStore();
  const [mainPopoverOpen, setMainPopoverOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [details, setDetails] = useState('');
  const [attachments, setAttachments] = useState<ReworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all unresolved rework entries
  const unresolvedEntries = policy.reworkHistory?.filter(e => !e.resolved) || [];

  // If no active rework, don't render
  if (unresolvedEntries.length === 0) {
    return null;
  }

  // Get existing reason IDs to exclude from add options
  const existingReasonIds = unresolvedEntries.map(e => e.reasonId);

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
        setAttachments((prev) => [...prev, attachment]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddConfirm = () => {
    if (selectedReasonId) {
      onAddRework(policy.id, selectedReasonId, details, attachments);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setMainPopoverOpen(false);
    setShowAddForm(false);
    setSelectedReasonId('');
    setDetails('');
    setAttachments([]);
  };

  return (
    <Popover open={mainPopoverOpen} onOpenChange={(open) => {
      setMainPopoverOpen(open);
      if (!open) {
        resetAndClose();
      }
    }}>
      <PopoverTrigger asChild>
        <div 
          className="w-[160px] h-8 text-xs border border-warning text-warning rounded-md px-3 flex items-center gap-2 cursor-pointer bg-warning/10 hover:bg-warning/20 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {language === 'th' ? 'งานติดปัญหา' : 'Rework'}
            {unresolvedEntries.length > 1 && ` (${unresolvedEntries.length})`}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 z-50 p-3" align="start">
        {!showAddForm ? (
          <div className="space-y-3">
            {/* Quick summary */}
            <div className="text-sm">
              <span className="font-medium text-warning">
                {unresolvedEntries.length}
              </span>
              <span className="text-muted-foreground ml-1">
                {language === 'th' ? 'งานติดปัญหาที่ยังไม่แก้ไข' : 'active rework issue(s)'}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-start"
                onClick={() => {
                  setMainPopoverOpen(false);
                  onOpenRemarks();
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-2 text-warning" />
                {language === 'th' ? 'ดู/แก้ไขงานติดปัญหา' : 'View/Manage Rework'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-start"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                {language === 'th' ? 'เพิ่มเหตุผลอื่น' : 'Add another reason'}
              </Button>
            </div>
          </div>
        ) : (
          // Add new rework form
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'เพิ่มเหตุผลใหม่' : 'Add new reason'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedReasonId('');
                  setDetails('');
                  setAttachments([]);
                }}
              >
                {language === 'th' ? 'กลับ' : 'Back'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'เลือกเหตุผล' : 'Select reason'}</Label>
              <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder={language === 'th' ? 'เลือกเหตุผล' : 'Select reason'} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {(() => {
                    const filteredConfigs = reworkConfigs.filter((config) => 
                      config.configType === 'rework' &&
                      !existingReasonIds.includes(config.id) && 
                      config.stages.includes(currentStage) &&
                      (config.policyScope === 'both' || config.policyScope === policy.kind)
                    );
                    const internal = filteredConfigs.filter(c => c.partyType === 'internal');
                    const external = filteredConfigs.filter(c => c.partyType === 'external');
                    return (
                      <>
                        {internal.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground tracking-wide">
                              {language === 'th' ? 'ใช้สำหรับ OPS เท่านั้น (ตัวแทนจะไม่เห็นข้อมูลดังกล่าว)' : 'OPS only (agent will not see this)'}
                            </div>
                            {internal.map((config) => (
                              <SelectItem key={config.id} value={config.id} className="text-xs pl-4">
                                {language === 'th' ? config.descriptionTh : config.descriptionEn}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {external.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground tracking-wide border-t mt-1">
                              {language === 'th' ? 'ใช้สำหรับ OPS และตัวแทน (ตัวแทนจะเห็นข้อมูลดังกล่าว)' : 'OPS and agent (agent will see this)'}
                            </div>
                            {external.map((config) => (
                              <SelectItem key={config.id} value={config.id} className="text-xs pl-4">
                                {language === 'th' ? config.descriptionTh : config.descriptionEn}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'รายละเอียด (ไม่บังคับ)' : 'Details (optional)'}</Label>
              <Textarea
                placeholder={language === 'th' ? 'ใส่รายละเอียดเพิ่มเติม...' : 'Enter detailed reason...'}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[50px] resize-none text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'ไฟล์แนบ' : 'Attachments'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs"
                  >
                    {attachment.type === 'pdf' ? (
                      <FileText className="w-3 h-3 text-destructive" />
                    ) : (
                      <Image className="w-3 h-3 text-primary" />
                    )}
                    <span className="max-w-[60px] truncate">{attachment.name}</span>
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
                disabled={!selectedReasonId}
              >
                {language === 'th' ? 'เพิ่ม' : 'Add'}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
