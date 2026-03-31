import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { CoverageDetail } from '@/data/mockSaleDetail';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface CoveragePanelProps {
  coverage: CoverageDetail;
  policyKind?: 'vmi' | 'cmi';
  showLabel?: boolean;
}

function CoverageFullBreakdown({ coverage }: { coverage: CoverageDetail }) {
  const { language } = useLanguageStore();
  
  const sections = [
    {
      title: language === 'th' ? 'ความรับผิดต่อบุคคลภายนอก' : 'Liability Limits',
      fields: [
        { label: language === 'th' ? 'ความเสียหายต่อร่างกาย' : 'Third Party Bodily Injury', value: coverage.thirdPartyBodilyInjury },
        { label: language === 'th' ? 'ความเสียหายต่อทรัพย์สิน' : 'Third Party Property Damage', value: coverage.thirdPartyPropertyDamage },
      ],
    },
    {
      title: language === 'th' ? 'ความคุ้มครองส่วนบุคคล' : 'Personal Coverage',
      fields: [
        { label: language === 'th' ? 'อุบัติเหตุส่วนบุคคล (PA)' : 'Personal Accident (PA)', value: coverage.personalAccident },
        { label: language === 'th' ? 'ค่ารักษาพยาบาล' : 'Medical Expense', value: coverage.medicalExpense },
      ],
    },
    {
      title: language === 'th' ? 'ความคุ้มครองเพิ่มเติม' : 'Additional Coverage',
      fields: [
        { label: language === 'th' ? 'ความเสียหายต่อรถ' : 'Own Damage', value: coverage.ownDamage ? `${coverage.ownDamage.toLocaleString()} THB` : undefined },
        { label: language === 'th' ? 'ค่าเสียหายส่วนแรก' : 'Deductible', value: coverage.deductible ? `${coverage.deductible.toLocaleString()} THB` : undefined },
        { label: language === 'th' ? 'อุปกรณ์ตกแต่ง' : 'Accessories Cover', value: coverage.accessoriesCover },
        { label: language === 'th' ? 'น้ำท่วม/ภัยธรรมชาติ' : 'Flood / Natural Disaster', value: coverage.floodCover },
        { label: language === 'th' ? 'ค่าประกันตัว' : 'Bail Bond', value: coverage.bailBond },
      ],
    },
    {
      title: language === 'th' ? 'ข้อยกเว้นและส่วนเพิ่มเติม' : 'Exclusions & Add-ons',
      fields: [
        { label: language === 'th' ? 'ข้อยกเว้นสำคัญ' : 'Key Exclusions', value: coverage.keyExclusions },
        { label: language === 'th' ? 'ส่วนเสริม' : 'Add-ons / Riders', value: coverage.addOns?.join(', ') },
      ],
    },
    {
      title: language === 'th' ? 'ข้อมูลกรมธรรม์' : 'Policy Info',
      fields: [
        { label: language === 'th' ? 'ระยะเวลาคุ้มครอง' : 'Policy Period', value: coverage.policyPeriod },
        { label: language === 'th' ? 'รหัสผลิตภัณฑ์' : 'Insurer Product Code', value: coverage.insurerProductCode },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <h5 className="text-xs font-semibold text-primary mb-2">{section.title}</h5>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {section.fields.map((field) => (
              <div key={field.label} className={cn(
                field.label.includes('Exclusion') || field.label.includes('ข้อยกเว้น') ? 'col-span-2' : ''
              )}>
                <span className="text-[11px] text-muted-foreground">{field.label}</span>
                <p className="text-xs font-medium">{field.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CoveragePanel({ coverage, policyKind, showLabel = true }: CoveragePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { language } = useLanguageStore();

  const headerLabel = policyKind
    ? `${policyKind.toUpperCase()} — ${language === 'th' ? 'สิทธิประโยชน์และความคุ้มครอง' : 'Policy Benefits & Coverage'}`
    : language === 'th' ? 'สิทธิประโยชน์และความคุ้มครอง' : 'Policy Benefits & Coverage';

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header - always visible */}
      <HoverCard openDelay={300} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
              <span className="text-sm font-semibold">{headerLabel}</span>
              {policyKind && (
                <Badge variant="outline" className={cn(
                  'text-[10px]',
                  policyKind === 'vmi' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'
                )}>
                  {policyKind.toUpperCase()}
                </Badge>
              )}
            </div>
            {/* Key fields inline */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
              <span>{coverage.insurer}</span>
              <span className="font-medium">{language === 'th' ? 'ชั้น' : 'Class'} {coverage.insuranceClass}</span>
              <span>{coverage.coverageType}</span>
              <span className="font-semibold text-foreground">
                {coverage.sumInsured > 0 ? `${coverage.sumInsured.toLocaleString()} Baht` : '—'}
              </span>
              <span className="font-semibold text-primary">
                {coverage.annualPremium.toLocaleString()} Baht
              </span>
            </div>
          </button>
        </HoverCardTrigger>
        {!expanded && (
          <HoverCardContent className="w-[520px] p-4 bg-popover" side="top" align="start">
            <h4 className="text-sm font-semibold mb-3">
              {language === 'th' ? 'รายละเอียดความคุ้มครอง' : 'Full Coverage Breakdown'}
            </h4>
            <CoverageFullBreakdown coverage={coverage} />
          </HoverCardContent>
        )}
      </HoverCard>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <CoverageFullBreakdown coverage={coverage} />
        </div>
      )}
    </div>
  );
}
