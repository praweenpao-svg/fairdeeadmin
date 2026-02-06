import { useState, useRef } from 'react';
import { CheckCircle, ArrowRightLeft, Upload, X, FileText, Image, AlertTriangle } from 'lucide-react';
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
import { ReworkConfig, ReworkAttachment, ReworkHistoryEntry, Lead } from '@/types/pipeline';
import { useLanguageStore } from '@/stores/languageStore';

interface InlineReworkActionsProps {
  lead: Lead;
  latestEntry: ReworkHistoryEntry;
  reworkConfigs: ReworkConfig[];
  onResolve: (lead: Lead, entryId: string) => void;
  onReassign: (lead: Lead, entryId: string, newReasonId: string, details: string, attachments: ReworkAttachment[]) => void;
}

export function InlineReworkActions({
  lead,
  latestEntry,
  reworkConfigs,
  onResolve,
  onReassign,
}: InlineReworkActionsProps) {
  const { language } = useLanguageStore();
  const [mainPopoverOpen, setMainPopoverOpen] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [selectedNewReasonId, setSelectedNewReasonId] = useState<string>('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [reassignAttachments, setReassignAttachments] = useState<ReworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If already resolved, don't show actions
  if (latestEntry.resolved) {
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
      onReassign(lead, latestEntry.id, selectedNewReasonId, reassignDetails, reassignAttachments);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setMainPopoverOpen(false);
    setShowReassignForm(false);
    setSelectedNewReasonId('');
    setReassignDetails('');
    setReassignAttachments([]);
  };

  const handleResolve = () => {
    onResolve(lead, latestEntry.id);
    resetAndClose();
  };

  return (
    <Popover open={mainPopoverOpen} onOpenChange={(open) => {
      setMainPopoverOpen(open);
      if (!open) {
        setShowReassignForm(false);
        setSelectedNewReasonId('');
        setReassignDetails('');
        setReassignAttachments([]);
      }
    }}>
      <PopoverTrigger asChild>
        <div 
          className="w-[200px] h-8 text-xs border border-warning text-warning rounded-md px-3 flex items-center gap-2 cursor-pointer hover:bg-warning/10 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{language === 'th' ? 'งานติดปัญหา' : 'Rework Required'}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {!showReassignForm ? (
          <div className="space-y-4">
            {/* Latest Reason Display */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                {language === 'th' ? 'เหตุผลล่าสุด' : 'Latest Rework Reason'}
              </div>
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                <p className="text-sm font-medium text-warning">
                  {(() => {
                    const config = reworkConfigs.find(c => c.id === latestEntry.reasonId);
                    return language === 'th' 
                      ? (config?.descriptionTh || latestEntry.reasonLabel)
                      : (config?.descriptionEn || latestEntry.reasonLabel);
                  })()}
                </p>
                {latestEntry.details && (
                  <p className="text-xs text-muted-foreground mt-1">{latestEntry.details}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  <span>{language === 'th' ? 'โดย' : 'By'} {latestEntry.savedBy}</span>
                  <span className="mx-1">•</span>
                  <span>{latestEntry.savedAt}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                onClick={handleResolve}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                {language === 'th' ? 'แก้ไขแล้ว' : 'Resolve'}
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {language === 'th' ? 'มอบหมายงานใหม่' : 'Reassign rework'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowReassignForm(false)}
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
                  {(() => {
                    const filteredConfigs = reworkConfigs.filter((config) => config.id !== latestEntry.reasonId);
                    const internal = filteredConfigs.filter(c => c.partyType === 'internal');
                    const external = filteredConfigs.filter(c => c.partyType === 'external');
                    return (
                      <>
                        {internal.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground tracking-wide">
                              {language === 'th' ? 'ใช้สำหรับ OPS เท่านั้น (เมื่อเลือก ตัวแทนจะไม่เห็นข้อมูลดังกล่าว)' : 'OPS only (agent will not see this)'}
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
                            <div className="px-2 py-1.5 text-[10px] font-semibold text-blue-600 tracking-wide border-t mt-1">
                              {language === 'th' ? 'ใช้สำหรับ OPS และตัวแทน (เมื่อเลือก ตัวแทนจะเห็นข้อมูลดังกล่าว)' : 'OPS and agent (agent will see this)'}
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
