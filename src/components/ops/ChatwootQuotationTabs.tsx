import { useState } from 'react';
import { Check, X, Plus, Search, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLanguageStore } from '@/stores/languageStore';
import { toast } from 'sonner';

export interface ChatwootQuotation {
  id: string;
  licensePlate: string;
  hasPackage: boolean;
  hasSaleId: boolean;
  saleStatus?: 'in_progress' | 'completed';
}

const INITIAL_QUOTATIONS: ChatwootQuotation[] = [
  { id: 'q-112233', licensePlate: 'กข 4358', hasPackage: true, hasSaleId: true, saleStatus: 'in_progress' },
  { id: 'q-112234', licensePlate: 'ฌศ 9921', hasPackage: true, hasSaleId: true, saleStatus: 'completed' },
  { id: 'q-112235', licensePlate: 'พน 1187', hasPackage: false, hasSaleId: false },
];

interface Props {
  /** Active sale id mapped to a quotation; falls back to first */
  activeQuotationId?: string;
  onActiveChange?: (q: ChatwootQuotation) => void;
}

export function ChatwootQuotationTabs({ activeQuotationId, onActiveChange }: Props) {
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<ChatwootQuotation[]>(INITIAL_QUOTATIONS);
  const [activeId, setActiveId] = useState<string>(activeQuotationId || INITIAL_QUOTATIONS[0].id);
  const [search, setSearch] = useState('');

  const t = (en: string, th: string) => (language === 'th' ? th : en);
  const active = quotations.find(q => q.id === activeId) || quotations[0];

  const handleSelect = (q: ChatwootQuotation) => {
    setActiveId(q.id);
    onActiveChange?.(q);
    if (!q.hasPackage) {
      navigate('/comparison-sheet?qid=' + q.id);
    }
  };

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setQuotations(prev => {
      const next = prev.filter(q => q.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next;
    });
  };

  const handleAdd = () => {
    const newId = `q-new-${Date.now()}`;
    const newQ: ChatwootQuotation = {
      id: newId,
      licensePlate: t('New Quotation', 'ใบเสนอราคาใหม่'),
      hasPackage: false,
      hasSaleId: false,
    };
    setQuotations(prev => [...prev, newQ]);
    setActiveId(newId);
    navigate('/comparison-sheet?qid=' + newId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    toast.success(t('Quotation lookup', 'ค้นหาใบเสนอราคา'), {
      description: t(`Searching for "${search}"…`, `กำลังค้นหา "${search}"…`),
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg mb-3">
      {/* Search row */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('Search quotation by ID, license plate, customer…', 'ค้นหาใบเสนอราคาด้วยรหัส ป้ายทะเบียน ลูกค้า…')}
          className="h-8 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
        />
      </form>

      {/* Tab strip */}
      <div className="flex items-stretch overflow-x-auto">
        {quotations.map(q => {
          const isActive = q.id === activeId;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => handleSelect(q)}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 border-r border-border text-sm whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary border-b-2 border-b-primary -mb-px font-medium'
                  : 'hover:bg-accent text-foreground'
              )}
            >
              {q.hasSaleId && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{q.licensePlate}</span>
              <span
                role="button"
                aria-label="close"
                onClick={(e) => handleClose(e as any, q.id)}
                className="ml-1 w-4 h-4 inline-flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
          aria-label={t('New quotation', 'ใบเสนอราคาใหม่')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Completed banner */}
      {active?.saleStatus === 'completed' && (
        <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 border-t border-emerald-200 text-xs text-emerald-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {t(
              'This quotation has already been completed. The Sale ID has been issued and is now read-only.',
              'ใบเสนอราคานี้ดำเนินการเสร็จสิ้นแล้ว Sale ID ถูกออกและอยู่ในสถานะอ่านอย่างเดียว'
            )}
          </span>
        </div>
      )}
    </div>
  );
}
