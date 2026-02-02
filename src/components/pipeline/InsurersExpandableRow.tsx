import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InsurerQuote, PriceListStatus } from '@/types/pipeline';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InsurersExpandableRowProps {
  insurerQuotes: InsurerQuote[];
  onQuoteUpdate?: (quoteId: string, updates: Partial<InsurerQuote>) => void;
}

// Price list status translations
const priceListStatusLabels: Record<PriceListStatus, { en: string; th: string }> = {
  pending: { en: 'Pending', th: 'รอดำเนินการ' },
  price_list_added: { en: 'Price list added', th: 'เพิ่มราคาแล้ว' },
  rejected_by_insurer: { en: 'Rejected by insurer', th: 'บ.ประกันปฏิเสธ' },
  email_sent: { en: 'Email sent', th: 'ส่งอีเมลแล้ว' },
};

export function InsurersExpandableRow({ 
  insurerQuotes, 
  onQuoteUpdate 
}: InsurersExpandableRowProps) {
  const { language } = useLanguageStore();
  
  if (!insurerQuotes || insurerQuotes.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Insurer Grid - always shown since parent controls visibility */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
            <div className="col-span-2">{language === 'th' ? 'ชื่อบริษัทประกัน' : 'Insurer Name'}</div>
            <div className="col-span-1">{language === 'th' ? 'ชั้นประกัน' : 'Insurance Class'}</div>
            <div className="col-span-1">{language === 'th' ? 'ประเภทอู่' : 'Garage Type'}</div>
            <div className="col-span-1">{language === 'th' ? 'สถานะราคา' : 'PriceList Status'}</div>
            <div className="col-span-1">{language === 'th' ? 'ส่งอีเมล' : 'Email Sent At'}</div>
            <div className="col-span-1">{language === 'th' ? 'รอ (วัน)' : 'Waiting Time (Days)'}</div>
            <div className="col-span-1">{language === 'th' ? 'วันติดตาม' : 'Follow Up Date'}</div>
            <div className="col-span-1">{language === 'th' ? 'สถานะ ETA' : 'ETA Status'}</div>
            <div className="col-span-1">{language === 'th' ? 'เกินกำหนด' : 'Days Overdue'}</div>
            <div className="col-span-1">{language === 'th' ? 'ช่วง ETA' : 'ETA Range'}</div>
            <div className="col-span-1">{language === 'th' ? 'ดำเนินการ' : 'Actions'}</div>
          </div>

          {/* Quote Rows */}
          {insurerQuotes.map((quote, idx) => (
            <div 
              key={quote.id}
              className={cn(
                'grid grid-cols-12 gap-2 px-3 py-2.5 items-center',
                idx < insurerQuotes.length - 1 && 'border-b border-border'
              )}
            >
              {/* Insurer Name */}
              <div className="col-span-2 text-sm font-medium">
                {quote.insurerName}
              </div>

              {/* Insurance Class */}
              <div className="col-span-1 text-xs text-muted-foreground">
                {quote.insuranceClass}
              </div>

              {/* Garage Type */}
              <div className="col-span-1 text-xs text-muted-foreground">
                {quote.garageType}
              </div>

              {/* PriceList Status - Dropdown */}
              <div className="col-span-1">
                <Select 
                  value={quote.priceListStatus}
                  onValueChange={(value) => onQuoteUpdate?.(quote.id, { priceListStatus: value as PriceListStatus })}
                >
                  <SelectTrigger className="h-7 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priceListStatusLabels).map(([key, labels]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {labels[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email Sent At */}
              <div className="col-span-1 text-xs text-muted-foreground">
                {quote.emailSentAt || '-'}
              </div>

              {/* Waiting Time (Days) */}
              <div className="col-span-1 text-xs text-muted-foreground text-center">
                {quote.waitingTimeDays ?? '-'}
              </div>

              {/* Follow Up Date */}
              <div className="col-span-1 text-xs text-muted-foreground">
                {quote.followUpDate || '-'}
              </div>

              {/* ETA Status */}
              <div className="col-span-1">
                {quote.etaStatus ? (
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    quote.etaStatus === 'breached' ? 'text-destructive' : 'text-green-600'
                  )}>
                    {quote.etaStatus === 'breached' ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Breached</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>On Time</span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              {/* Days Overdue */}
              <div className="col-span-1 text-xs text-muted-foreground text-center">
                {quote.daysOverdue ?? '-'}
              </div>

              {/* ETA Range */}
              <div className="col-span-1 text-xs text-muted-foreground">
                {quote.etaRange || '-'}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex flex-col gap-1">
                {quote.priceListStatus === 'price_list_added' ? (
                  <>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                      {language === 'th' ? 'แก้ไข' : 'Edit Pricelist'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                      {language === 'th' ? 'ติดตาม' : 'Follow up Insurer'}
                    </Button>
                  </>
                ) : quote.priceListStatus === 'rejected_by_insurer' ? (
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                    {language === 'th' ? 'เพิ่มราคา' : 'Add Pricelist'}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                      {language === 'th' ? 'เพิ่มราคา' : 'Add Pricelist'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                      {language === 'th' ? 'ติดตาม' : 'Follow up Insurer'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}