import React, { useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';

interface ProgressionTimelineProps {
  sale: SaleDetail;
}

interface SubStep {
  label: { en: string; th: string };
  done: boolean;
  policyKind?: 'vmi' | 'cmi';
}

interface Stage {
  key: string;
  label: { en: string; th: string };
  subSteps: SubStep[];
  completedBy?: string;
  completedAt?: string;
}

function getStages(sale: SaleDetail): Stage[] {
  const vmi = sale.policies.find(p => p.kind === 'vmi');
  const cmi = sale.policies.find(p => p.kind === 'cmi');

  return [
    {
      key: 'leads',
      label: { en: 'Leads', th: 'ลีด' },
      subSteps: [
        { label: { en: 'Lead converted', th: 'แปลงลีดแล้ว' }, done: true },
      ],
      completedBy: sale.assignment.sc || '—',
      completedAt: sale.createdAt,
    },
    {
      key: 'to_pay',
      label: { en: 'To Pay Premium', th: 'รอชำระเบี้ย' },
      subSteps: [
        { label: { en: 'Payment received', th: 'ได้รับชำระเงิน' }, done: sale.paymentStatus === 'paid' },
      ],
      completedBy: sale.paymentStatus === 'paid' ? 'System' : undefined,
      completedAt: sale.paymentStatus === 'paid' ? sale.createdAt : undefined,
    },
    {
      key: 'to_report',
      label: { en: 'To Report Sale', th: 'รอแจ้งงาน' },
      subSteps: [
        { label: { en: 'OPS Step 1 complete', th: 'ขั้นตอน OPS 1 เสร็จ' }, done: sale.opsStep1Complete },
        { label: { en: 'OPS Step 2 complete', th: 'ขั้นตอน OPS 2 เสร็จ' }, done: sale.opsStep2Complete },
      ],
      completedBy: sale.opsStep1Complete && sale.opsStep2Complete ? sale.assignment.admin || '—' : undefined,
      completedAt: sale.opsStep1Complete && sale.opsStep2Complete ? sale.createdAt : undefined,
    },
    {
      key: 'to_issue',
      label: { en: 'To Issue Policy', th: 'รอออกกรมธรรม์' },
      subSteps: [
        ...(vmi ? [
          { label: { en: 'VMI — Notify insurer', th: 'VMI — แจ้ง บ.ประกัน' }, done: false, policyKind: 'vmi' as const },
          { label: { en: 'VMI — Upload policy', th: 'VMI — อัปโหลดกรมธรรม์' }, done: false, policyKind: 'vmi' as const },
          { label: { en: 'VMI — Policy number', th: 'VMI — เลขกรมธรรม์' }, done: !!vmi.policyNumber, policyKind: 'vmi' as const },
        ] : []),
        ...(cmi ? [
          { label: { en: 'CMI — Notify insurer', th: 'CMI — แจ้ง บ.ประกัน' }, done: false, policyKind: 'cmi' as const },
          { label: { en: 'CMI — Upload policy', th: 'CMI — อัปโหลดกรมธรรม์' }, done: false, policyKind: 'cmi' as const },
          { label: { en: 'CMI — Policy number', th: 'CMI — เลขกรมธรรม์' }, done: !!cmi.policyNumber, policyKind: 'cmi' as const },
        ] : []),
      ],
    },
    {
      key: 'to_deliver',
      label: { en: 'To Deliver Policy', th: 'รอจัดส่ง' },
      subSteps: [
        ...(vmi ? [
          { label: { en: 'VMI — Delivery method', th: 'VMI — วิธีจัดส่ง' }, done: !!vmi.deliveryMethod, policyKind: 'vmi' as const },
          { label: { en: 'VMI — Tracking number', th: 'VMI — เลขพัสดุ' }, done: !!vmi.trackingNumber, policyKind: 'vmi' as const },
        ] : []),
        ...(cmi ? [
          { label: { en: 'CMI — Delivery method', th: 'CMI — วิธีจัดส่ง' }, done: !!cmi.deliveryMethod, policyKind: 'cmi' as const },
          { label: { en: 'CMI — Tracking number', th: 'CMI — เลขพัสดุ' }, done: !!cmi.trackingNumber, policyKind: 'cmi' as const },
        ] : []),
      ],
    },
    {
      key: 'completed',
      label: { en: 'Completed', th: 'เสร็จสิ้น' },
      subSteps: [
        { label: { en: 'All policies delivered', th: 'จัดส่งครบทุกกรมธรรม์' }, done: false },
      ],
    },
  ];
}

function getActiveStageIndex(stages: Stage[]): number {
  for (let i = 0; i < stages.length; i++) {
    const allDone = stages[i].subSteps.every(s => s.done);
    if (!allDone) return i;
  }
  return stages.length - 1;
}

export function ProgressionTimeline({ sale }: ProgressionTimelineProps) {
  const { language } = useLanguageStore();
  const stages = getStages(sale);
  const activeIndex = getActiveStageIndex(stages);
  const [expandedCompleted, setExpandedCompleted] = useState<number | null>(null);

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h4 className="text-sm font-semibold mb-4">
        {language === 'th' ? 'ความคืบหน้า' : 'Progression Timeline'}
      </h4>

      <div className="flex items-start gap-0">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isPending = idx > activeIndex;
          const isLast = idx === stages.length - 1;

          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Node */}
                <button
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
                    isCompleted && 'bg-primary border-primary text-primary-foreground cursor-pointer hover:ring-2 hover:ring-primary/30',
                    isActive && 'border-primary bg-primary/10 text-primary',
                    isPending && 'border-muted-foreground/30 text-muted-foreground bg-muted/20 cursor-default',
                  )}
                  onClick={() => {
                    if (isCompleted) {
                      setExpandedCompleted(expandedCompleted === idx ? null : idx);
                    }
                  }}
                  disabled={isPending}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </button>

                {/* Label */}
                <span className={cn(
                  'text-[11px] mt-2 text-center leading-tight px-1',
                  isCompleted && 'text-primary font-medium',
                  isActive && 'text-foreground font-semibold',
                  isPending && 'text-muted-foreground',
                )}>
                  {language === 'th' ? stage.label.th : stage.label.en}
                </span>

                {/* Active: show sub-steps */}
                {isActive && (
                  <div className="mt-2 space-y-1 w-full px-1">
                    {stage.subSteps.map((sub, si) => (
                      <div key={si} className="flex items-center gap-1.5">
                        {sub.done ? (
                          <Check className="w-3 h-3 text-green-600 shrink-0" />
                        ) : (
                          <Circle className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={cn(
                          'text-[10px] leading-tight',
                          sub.done ? 'text-green-600 line-through' : 'text-muted-foreground'
                        )}>
                          {language === 'th' ? sub.label.th : sub.label.en}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed: expandable summary */}
                {isCompleted && expandedCompleted === idx && (
                  <div className="mt-2 text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1.5 w-full">
                    <div>{language === 'th' ? 'โดย' : 'By'}: {stage.completedBy || '—'}</div>
                    <div>{language === 'th' ? 'เมื่อ' : 'At'}: {stage.completedAt || '—'}</div>
                  </div>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className={cn(
                  'h-0.5 w-full mt-[18px] rounded-full flex-1 min-w-4',
                  idx < activeIndex ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
