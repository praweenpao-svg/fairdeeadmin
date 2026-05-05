import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Sliders, FlaskConical } from 'lucide-react';
import { LogicControllerSection } from './LogicControllerSection';
import { useOpsLogic, type ShippingFormat, type KycMode, type InstallmentPlan, type AddOnType } from './OpsLogicContext';
import { useLanguageStore } from '@/stores/languageStore';
import { TEST_SCENARIOS } from '@/data/testScenarios';
import { toast } from '@/hooks/use-toast';

/**
 * Floating dev-only FAB that opens the Logic Controller in a side sheet.
 * Visible always for prototype purposes. Marked clearly as a dev tool so
 * end-users (or screenshots) understand it isn't part of the real product.
 */
export function DevLogicControllerFab() {
  const [open, setOpen] = React.useState(false);
  const {
    logic, setLogic, reset,
    addOns, setAddOns,
    kycMode, setKycMode,
    installmentPlan, setInstallmentPlan,
    installmentCount, setInstallmentCount,
    voluntaryShippingFormat, setVoluntaryShippingFormat,
    compulsoryShippingFormat, setCompulsoryShippingFormat,
    inspectionAppointmentDate, setInspectionAppointmentDate,
  } = useOpsLogic();
  const { language } = useLanguageStore();
  const t = (th: string, en: string) => (language === 'th' ? th : en);

  return (
    <>
      <Button
        type="button"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-background"
        title="Dev: Logic Controller"
        aria-label="Open Logic Controller (dev tool)"
      >
        <Wrench className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-none sm:w-[920px] overflow-y-auto">
          <SheetHeader className="mb-3">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-primary" />
              Logic Controller
              <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wide border border-border rounded px-1.5 py-0.5">
                Prototype Dev Tool
              </span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Drives Step 1 form behaviour & required document list. Not visible to end users — only used for screenshots & QA.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <LogicControllerSection
              value={logic}
              onChange={setLogic}
              onReset={reset}
            />

            {/* Cosmetic / form-only fields (don't change required docs) */}
            <Card className="border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {t('ตัวเลือก Step 1 เพิ่มเติม', 'Step 1 Form Extras')}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {t('คอสเมติก — ไม่กระทบรายการเอกสาร', 'Cosmetic — does not affect doc list')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DevField label={t('ความคุ้มครองเพิ่มเติม', 'Add-Ons')}>
                    <Select value={addOns} onValueChange={(v) => setAddOns(v as AddOnType)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">None</SelectItem>
                        <SelectItem value="alloy" className="text-xs">Alloy Wheels</SelectItem>
                        <SelectItem value="bodykit" className="text-xs">Body Kit</SelectItem>
                        <SelectItem value="headlight" className="text-xs">Headlights</SelectItem>
                        <SelectItem value="taillight" className="text-xs">Taillights</SelectItem>
                      </SelectContent>
                    </Select>
                  </DevField>

                  <DevField label="KYC Mode">
                    <Select value={kycMode || '__none__'} onValueChange={(v) => setKycMode((v === '__none__' ? '' : v) as KycMode)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">— Not set —</SelectItem>
                        <SelectItem value="manual" className="text-xs">Manual KYC</SelectItem>
                        <SelectItem value="auto" className="text-xs">Auto KYC</SelectItem>
                      </SelectContent>
                    </Select>
                  </DevField>

                  <DevField label={t('แผนผ่อน', 'Instalment Plan')}>
                    <Select value={installmentPlan || '__none__'} onValueChange={(v) => setInstallmentPlan((v === '__none__' ? '' : v) as InstallmentPlan)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">— Not set —</SelectItem>
                        <SelectItem value="equal" className="text-xs">Equal</SelectItem>
                        <SelectItem value="downpayment" className="text-xs">25% Downpayment</SelectItem>
                      </SelectContent>
                    </Select>
                  </DevField>

                  <DevField label={t('จำนวนงวด', 'Instalment Count')}>
                    <Select value={installmentCount || '__none__'} onValueChange={(v) => setInstallmentCount(v === '__none__' ? '' : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">— Not set —</SelectItem>
                        {['3', '4', '5', '6', '8', '10'].map(n => (
                          <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </DevField>

                  <DevField label={t('รูปแบบส่ง VMI', 'Voluntary Format')}>
                    <Select value={voluntaryShippingFormat || '__none__'} onValueChange={(v) => setVoluntaryShippingFormat((v === '__none__' ? '' : v) as ShippingFormat)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">— Not set —</SelectItem>
                        <SelectItem value="fairdee" className="text-xs">Print by FairDee</SelectItem>
                        <SelectItem value="self" className="text-xs">Print Self</SelectItem>
                        <SelectItem value="epolicy" className="text-xs">e-Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </DevField>

                  <DevField label={t('รูปแบบส่ง CMI', 'Compulsory Format')}>
                    <Select value={compulsoryShippingFormat || '__none__'} onValueChange={(v) => setCompulsoryShippingFormat((v === '__none__' ? '' : v) as ShippingFormat)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">— Not set —</SelectItem>
                        <SelectItem value="fairdee" className="text-xs">Print by FairDee</SelectItem>
                        <SelectItem value="self" className="text-xs">Print Self</SelectItem>
                        <SelectItem value="epolicy" className="text-xs">e-Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </DevField>

                  <DevField label={t('วันนัดตรวจ', 'Inspection Date')}>
                    <input
                      type="date"
                      value={inspectionAppointmentDate}
                      onChange={(e) => setInspectionAppointmentDate(e.target.value)}
                      className="h-8 text-xs w-full rounded-md border border-input bg-background px-2"
                    />
                  </DevField>
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DevField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
