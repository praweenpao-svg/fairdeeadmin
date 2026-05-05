import React, { useState } from 'react';
import { X, AlertTriangle, MessageSquare, CheckCircle2, Send, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useHistoryStore } from '@/stores/historyStore';

export interface HistoryEntry {
  id: string;
  type: 'rework' | 'remark' | 'status_change' | 'assignment' | 'field_update';
  user: string;
  timestamp: string;
  description: string;
  policyKind?: 'vmi' | 'cmi';
  resolved?: boolean;
}

interface HistoryActivitySidebarProps {
  open: boolean;
  onClose: () => void;
  quotationId?: string;
  availablePolicies?: ('vmi' | 'cmi')[];
}

const mockHistory: HistoryEntry[] = [
  {
    id: 'h1',
    type: 'rework',
    user: 'Rachel',
    timestamp: '2026-03-28T14:30:00',
    description: 'ระบุข้อมูลผู้เอาประกันภัย ไม่ถูกต้องหรือไม่ครบถ้วน กรุณาแก้ไข @Pao',
    policyKind: 'vmi',
    resolved: false,
  },
  {
    id: 'h2',
    type: 'remark',
    user: 'Pao',
    timestamp: '2026-03-27T16:00:00',
    description: 'ลูกค้าแจ้งว่าจะส่งเอกสารเพิ่มเติมภายในวันพรุ่งนี้',
    policyKind: 'vmi',
  },
  {
    id: 'h3',
    type: 'status_change',
    user: 'System',
    timestamp: '2026-03-26T10:00:00',
    description: 'VMI status: Pending Payment → Pending Review',
    policyKind: 'vmi',
  },
  {
    id: 'h4',
    type: 'assignment',
    user: 'System',
    timestamp: '2026-03-25T09:00:00',
    description: 'DE assigned: Pao',
  },
  {
    id: 'h5',
    type: 'field_update',
    user: 'Lisa',
    timestamp: '2026-03-24T11:30:00',
    description: 'Sale Type: — → งานใหม่',
  },
  {
    id: 'h6',
    type: 'rework',
    user: 'Rachel',
    timestamp: '2026-03-23T15:00:00',
    description: 'เอกสารประกอบการแจ้งงานไม่ครบถ้วน',
    policyKind: 'vmi',
    resolved: true,
  },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: { en: string; th: string } }> = {
  rework: { icon: AlertTriangle, color: 'text-orange-500', label: { en: 'Rework', th: 'Rework' } },
  remark: { icon: MessageSquare, color: 'text-blue-500', label: { en: 'Remark', th: 'หมายเหตุ' } },
  status_change: { icon: CheckCircle2, color: 'text-green-500', label: { en: 'Status Change', th: 'เปลี่ยนสถานะ' } },
  assignment: { icon: CheckCircle2, color: 'text-primary', label: { en: 'Assignment', th: 'มอบหมาย' } },
  field_update: { icon: Clock, color: 'text-muted-foreground', label: { en: 'Field Update', th: 'อัปเดตข้อมูล' } },
};

function formatDateTime(ts: string) {
  try {
    return new Date(ts).toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

/**
 * Shared History & Activity Log sidebar — Section 14 mandates this is one component
 * used identically across Admin Portal and OPS Dashboard.
 * Data model, rework taxonomy, and @mention behaviour per Section 8.
 */
type EntryType = 'rework' | 'remark' | 'status_change' | 'assignment' | 'field_update';

const FILTER_CHIPS: { value: EntryType | 'all'; en: string; th: string }[] = [
  { value: 'all', en: 'All', th: 'ทั้งหมด' },
  { value: 'rework', en: 'Rework', th: 'Rework' },
  { value: 'remark', en: 'Remark', th: 'หมายเหตุ' },
  { value: 'status_change', en: 'Status', th: 'สถานะ' },
  { value: 'assignment', en: 'Assignment', th: 'มอบหมาย' },
  { value: 'field_update', en: 'Updates', th: 'อัปเดต' },
];

function dayKey(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'today';
  if (sameDay(d, yesterday)) return 'yesterday';
  return d.toISOString().slice(0, 10);
}

function dayLabel(key: string, language: string): string {
  if (key === 'today') return language === 'th' ? 'วันนี้' : 'Today';
  if (key === 'yesterday') return language === 'th' ? 'เมื่อวาน' : 'Yesterday';
  try {
    return new Date(key).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return key; }
}

export function HistoryActivitySidebar({ open, onClose, quotationId, availablePolicies }: HistoryActivitySidebarProps) {
  const { language } = useLanguageStore();
  const [compositionMode, setCompositionMode] = useState<'none' | 'rework' | 'remark'>('none');
  const [draftText, setDraftText] = useState('');
  const [policyFilter, setPolicyFilter] = useState<'all' | 'vmi' | 'cmi'>('all');
  const [typeFilter, setTypeFilter] = useState<EntryType | 'all'>('all');
  const liveEntries = useHistoryStore((s) => s.entries);
  const addEntry = useHistoryStore((s) => s.add);

  if (!open) return null;

  const hasBothPolicies = availablePolicies && availablePolicies.includes('vmi') && availablePolicies.includes('cmi');

  const combined = [...liveEntries, ...mockHistory];
  const filteredHistory = combined.filter(e => {
    if (policyFilter !== 'all' && e.policyKind && e.policyKind !== policyFilter) return false;
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    return true;
  });

  // Group by day (today / yesterday / ISO date), preserving recency order.
  const groups: { key: string; entries: HistoryEntry[] }[] = [];
  for (const e of filteredHistory) {
    const k = dayKey(e.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.entries.push(e);
    else groups.push({ key: k, entries: [e] });
  }

  const handleSubmit = (type: 'rework' | 'remark') => {
    if (!draftText.trim()) return;
    addEntry({
      type,
      description: draftText,
      policyKind: policyFilter === 'all' ? undefined : policyFilter,
    });
    toast.success(
      type === 'rework'
        ? (language === 'th' ? 'บันทึก Rework สำเร็จ' : 'Rework logged')
        : (language === 'th' ? 'เพิ่มหมายเหตุสำเร็จ' : 'Remark added'),
      { description: draftText.substring(0, 80) },
    );
    setDraftText('');
    setCompositionMode('none');
  };

  const handleResolve = (entryId: string) => {
    toast.success(language === 'th' ? 'Rework resolved' : 'Rework resolved');
  };

  return (
    <div className="fixed right-0 top-0 z-50 h-screen w-[400px] bg-card border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right-full duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h3 className="text-sm font-semibold">
            {language === 'th' ? 'ประวัติและกิจกรรม' : 'History & Activity Log'}
          </h3>
          {quotationId && (
            <p className="text-[10px] text-muted-foreground">QQ #{quotationId}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasBothPolicies && (
            <Select value={policyFilter} onValueChange={(v) => setPolicyFilter(v as 'all' | 'vmi' | 'cmi')}>
              <SelectTrigger className="h-7 w-[90px] text-[10px] border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all" className="text-xs">{language === 'th' ? 'ทั้งหมด' : 'All'}</SelectItem>
                <SelectItem value="vmi" className="text-xs">VMI</SelectItem>
                <SelectItem value="cmi" className="text-xs">CMI</SelectItem>
              </SelectContent>
            </Select>
          )}
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Composition mode selector */}
      <div className="flex gap-2 px-4 py-2 border-b border-border shrink-0">
        <Button
          variant={compositionMode === 'rework' ? 'default' : 'outline'}
          size="sm"
          className="text-xs gap-1.5 flex-1"
          onClick={() => setCompositionMode(compositionMode === 'rework' ? 'none' : 'rework')}
        >
          <AlertTriangle className="w-3 h-3" />
          {language === 'th' ? 'บันทึก Rework' : 'Log Rework'}
        </Button>
        <Button
          variant={compositionMode === 'remark' ? 'default' : 'outline'}
          size="sm"
          className="text-xs gap-1.5 flex-1"
          onClick={() => setCompositionMode(compositionMode === 'remark' ? 'none' : 'remark')}
        >
          <MessageSquare className="w-3 h-3" />
          {language === 'th' ? 'เพิ่มหมายเหตุ' : 'Add Remark'}
        </Button>
      </div>

      {/* Type filter chips */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0 overflow-x-auto">
        {FILTER_CHIPS.map((chip) => {
          const active = typeFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setTypeFilter(chip.value)}
              className={cn(
                'shrink-0 px-2 py-0.5 rounded-full text-[10px] border transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {language === 'th' ? chip.th : chip.en}
            </button>
          );
        })}
      </div>

      {/* Composition area */}
      {compositionMode !== 'none' && (
        <div className="px-4 py-3 border-b border-border space-y-2 shrink-0 bg-muted/20">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
            {compositionMode === 'rework'
              ? (language === 'th' ? 'บันทึก Rework ใหม่' : 'New Rework Entry')
              : (language === 'th' ? 'เพิ่มหมายเหตุใหม่' : 'New Remark')}
          </p>
          <MentionTextarea
            value={draftText}
            onChange={setDraftText}
            placeholder={
              compositionMode === 'rework'
                ? (language === 'th' ? 'กรอกรายละเอียด Rework... ใช้ @mention เพื่อแจ้งทีม' : 'Rework details... use @mention to notify')
                : (language === 'th' ? 'กรอกหมายเหตุ... ใช้ @mention เพื่อแจ้งทีม' : 'Remark... use @mention to notify')
            }
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setCompositionMode('none'); setDraftText(''); }}>
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button size="sm" className="text-xs gap-1" onClick={() => handleSubmit(compositionMode)}>
              <Send className="w-3 h-3" />
              {language === 'th' ? 'บันทึก' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Activity feed */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-4">
          {groups.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              {language === 'th' ? 'ไม่มีรายการ' : 'No entries match these filters'}
            </p>
          )}
          {groups.map((group) => (
            <div key={group.key} className="space-y-3">
              <div className="sticky top-0 z-10 -mx-4 px-4 py-1 bg-card/95 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {dayLabel(group.key, language)}
                </p>
              </div>
              {group.entries.map((entry) => {
                const config = typeConfig[entry.type] || typeConfig.field_update;
                const Icon = config.icon;
                return (
                  <div key={entry.id} className="relative pl-6 pb-3 border-l-2 border-border last:border-0">
                    <div className={cn('absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-border flex items-center justify-center')}>
                      <Icon className={cn('w-2.5 h-2.5', config.color)} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-[9px]', config.color)}>
                          {language === 'th' ? config.label.th : config.label.en}
                        </Badge>
                        {entry.policyKind && (
                          <Badge variant="outline" className={cn(
                            'text-[9px]',
                            entry.policyKind === 'vmi' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'
                          )}>
                            {entry.policyKind.toUpperCase()}
                          </Badge>
                        )}
                        {entry.type === 'rework' && !entry.resolved && (
                          <Badge className="text-[9px] bg-orange-500/10 text-orange-600 border border-orange-500/30">
                            {language === 'th' ? 'เปิดอยู่' : 'Open'}
                          </Badge>
                        )}
                        {entry.type === 'rework' && entry.resolved && (
                          <Badge className="text-[9px] bg-green-500/10 text-green-600 border border-green-500/30">
                            {language === 'th' ? 'แก้ไขแล้ว' : 'Resolved'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{entry.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          {entry.user} · {formatDateTime(entry.timestamp)}
                        </p>
                        {entry.type === 'rework' && !entry.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-[10px] text-green-600 hover:text-green-700"
                            onClick={() => handleResolve(entry.id)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {language === 'th' ? 'แก้ไข' : 'Resolve'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
