import { useState, useRef } from 'react';
import { Lock, Globe, Upload, X, FileText, Image as ImageIcon, Download, Cloud, CloudOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { useHistoryStore } from '@/stores/historyStore';
import { toast } from 'sonner';

export type UploadVisibility = 'internal' | 'external';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  mime: string;
  visibility: UploadVisibility;
  uploadedAt: string;
  uploadedBy: string;
  syncedToAgent?: boolean;
}

const SEED_DOCS: UploadedDocument[] = [
  {
    id: 'doc-int-1',
    name: 'Internal_KYC_Notes.pdf',
    size: 224_512,
    mime: 'application/pdf',
    visibility: 'internal',
    uploadedAt: '2026-05-18T10:14:00',
    uploadedBy: 'Rachel',
  },
  {
    id: 'doc-ext-1',
    name: 'Policy_Schedule_Agent.pdf',
    size: 512_044,
    mime: 'application/pdf',
    visibility: 'external',
    uploadedAt: '2026-05-19T09:02:00',
    uploadedBy: 'Pao',
    syncedToAgent: true,
  },
];

const ACCEPT = 'image/jpeg,image/png,application/pdf';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadDocumentsModal({ open, onOpenChange }: Props) {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === 'th' ? th : en);
  const [docs, setDocs] = useState<UploadedDocument[]>(SEED_DOCS);
  const internalRef = useRef<HTMLInputElement>(null);
  const externalRef = useRef<HTMLInputElement>(null);

  const internalDocs = docs.filter(d => d.visibility === 'internal');
  const externalDocs = docs.filter(d => d.visibility === 'external');

  const handleFiles = (files: FileList | null, visibility: UploadVisibility) => {
    if (!files || !files.length) return;
    const accepted: UploadedDocument[] = [];
    Array.from(files).forEach(f => {
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)) {
        toast.error(t(`Unsupported file: ${f.name}`, `ไฟล์ไม่รองรับ: ${f.name}`));
        return;
      }
      accepted.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        size: f.size,
        mime: f.type,
        visibility,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User',
        syncedToAgent: visibility === 'external' ? true : undefined,
      });
    });
    if (!accepted.length) return;
    setDocs(prev => [...prev, ...accepted]);
    accepted.forEach(d => {
      useHistoryStore.getState().add({
        type: 'field_update',
        description:
          visibility === 'internal'
            ? `Uploaded internal document: ${d.name}`
            : `Uploaded external document: ${d.name} (synced to agent app)`,
      });
    });
    toast.success(
      t(
        `${accepted.length} ${visibility === 'internal' ? 'internal' : 'external'} file(s) uploaded`,
        `อัปโหลด ${accepted.length} ไฟล์ (${visibility === 'internal' ? 'ภายใน' : 'ภายนอก'}) แล้ว`,
      ),
    );
  };

  const handleRemove = (id: string) => {
    const target = docs.find(d => d.id === id);
    setDocs(prev => prev.filter(d => d.id !== id));
    if (target?.visibility === 'external') {
      useHistoryStore.getState().add({
        type: 'field_update',
        description: `Removed external document: ${target.name} (also removed from agent app)`,
      });
      toast.message(t('Removed from agent app', 'ลบจากแอปตัวแทนแล้ว'), {
        description: target.name,
      });
    } else if (target) {
      useHistoryStore.getState().add({
        type: 'field_update',
        description: `Removed internal document: ${target.name}`,
      });
    }
  };

  const renderDropZone = (
    visibility: UploadVisibility,
    inputRef: React.RefObject<HTMLInputElement>,
  ) => {
    const isInternal = visibility === 'internal';
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files, visibility); }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 px-4 cursor-pointer transition-colors',
          isInternal
            ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            : 'border-primary/40 bg-primary/5 hover:bg-primary/10',
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          isInternal ? 'bg-slate-200 text-slate-700' : 'bg-primary/15 text-primary',
        )}>
          {isInternal ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
        </div>
        <div className="text-sm font-medium flex items-center gap-1.5">
          {isInternal
            ? t('Internal upload (Admin only)', 'อัปโหลดภายใน (เฉพาะแอดมิน)')
            : t('External upload (Admin + Agent)', 'อัปโหลดภายนอก (แอดมิน + ตัวแทน)')}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('Drop JPEG / PNG / PDF here or click to browse', 'วาง JPEG / PNG / PDF หรือคลิกเพื่อเลือก')}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 gap-1.5"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          <Upload className="w-3.5 h-3.5" />
          {t('Choose files', 'เลือกไฟล์')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files, visibility); e.target.value = ''; }}
        />
      </div>
    );
  };

  const renderDocList = (visibility: UploadVisibility) => {
    const list = visibility === 'internal' ? internalDocs : externalDocs;
    const isInternal = visibility === 'internal';
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            {isInternal ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {isInternal
              ? t('Internal Documents', 'เอกสารภายใน')
              : t('External Documents', 'เอกสารภายนอก')}
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{list.length}</Badge>
          </div>
        </div>
        {list.length === 0 ? (
          <div className="text-xs text-muted-foreground italic px-2 py-3 border border-dashed border-border rounded">
            {t('No documents yet.', 'ยังไม่มีเอกสาร')}
          </div>
        ) : (
          <div className="border border-border rounded divide-y divide-border">
            {list.map(d => (
              <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                {d.mime === 'application/pdf'
                  ? <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  : <ImageIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatSize(d.size)} · {d.uploadedBy}
                  </div>
                </div>
                {!isInternal && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded',
                      d.syncedToAgent
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700',
                    )}
                    title={d.syncedToAgent ? t('Visible to agent', 'ตัวแทนมองเห็น') : t('Sync pending', 'รอซิงก์')}
                  >
                    {d.syncedToAgent ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                    {d.syncedToAgent ? t('Synced', 'ซิงก์แล้ว') : t('Pending', 'รอ')}
                  </span>
                )}
                <button
                  type="button"
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                  title={t('Download', 'ดาวน์โหลด')}
                  onClick={() => toast.success(t('Download started', 'เริ่มดาวน์โหลด'), { description: d.name })}
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                  title={t('Remove', 'ลบ')}
                  onClick={() => handleRemove(d.id)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] max-h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-base">
            {t('Upload Documents', 'อัปโหลดเอกสาร')}
            <span className="text-muted-foreground font-normal ml-2">
              {t('· Internal stays in-house, External syncs to the agent app.', '· ภายในใช้ภายในทีม ภายนอกซิงก์ไปยังแอปตัวแทน')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDropZone('internal', internalRef)}
            {renderDropZone('external', externalRef)}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDocList('internal')}
            {renderDocList('external')}
          </section>
        </div>

        <div className="px-6 py-3 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Close', 'ปิด')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
