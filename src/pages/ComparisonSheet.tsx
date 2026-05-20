import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/stores/languageStore';

export default function ComparisonSheet() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qid = params.get('qid') || '';
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === 'th' ? th : en);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/ops-dashboard?mode=chatwoot')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Back to OPS', 'กลับไป OPS')}
        </Button>
        <div className="h-6 w-px bg-border" />
        <div>
          <div className="text-sm font-semibold">{t('Comparison Sheet', 'ตารางเปรียบเทียบ')}</div>
          <div className="text-xs text-muted-foreground">
            {t('Quotation', 'ใบเสนอราคา')} · {qid || '—'}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {t('No package selected yet', 'ยังไม่ได้เลือกแพ็คเกจ')}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t(
              'Pick a package from the comparison sheet to start the OPS workflow. This is a placeholder view — the real comparison sheet will surface all insurer quotes for this lead.',
              'เลือกแพ็คเกจจากตารางเปรียบเทียบเพื่อเริ่มต้นกระบวนการ OPS หน้านี้เป็นเพียงตัวอย่าง ตารางจริงจะแสดงใบเสนอราคาจากบริษัทประกันทั้งหมด'
            )}
          </p>
          <Button onClick={() => navigate('/ops-dashboard?mode=chatwoot')}>
            {t('Choose Easy Type 1 (mock)', 'เลือก Easy Type 1 (ตัวอย่าง)')}
          </Button>
        </div>
      </div>
    </div>
  );
}
