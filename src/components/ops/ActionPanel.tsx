import React, { useState } from 'react';
import {
  ClipboardCheck, FileUp, Hash, Truck, Package, AlertTriangle,
  MessageSquare, CheckCircle2, XCircle, ArrowRightLeft, Users,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SaleDetail, SalePolicy } from '@/data/mockSaleDetail';

interface ActionPanelProps {
  sale: SaleDetail;
  onUpdate?: (sale: SaleDetail) => void;
}

// Staff lists for assignment
const rfStaff = ['Ricky', 'Jenny', 'Tommy'];
const scStaff = ['Lisa', 'Mike', 'Nina'];
const deStaff = ['Oscar', 'Paula', 'Quinn', 'Pao'];
const adminStaff = ['Rachel', 'Sam', 'Tina'];
const deliveryStaff = ['Dao', 'Kai', 'Ploy'];

function ActionGroup({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        <span>{title}</span>
      </div>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function PerPolicyRow({ policies, label, renderAction }: {
  policies: SalePolicy[];
  label: string;
  renderAction: (policy: SalePolicy) => React.ReactNode;
}) {
  const hasMultiple = policies.length > 1;
  return (
    <>
      {policies.map((policy) => (
        <div key={`${label}-${policy.kind}`} className="flex items-center gap-2">
          {hasMultiple && (
            <Badge variant="outline" className={cn(
              'text-[9px] w-10 justify-center shrink-0',
              policy.kind === 'vmi' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'
            )}>
              {policy.kind.toUpperCase()}
            </Badge>
          )}
          <div className="flex-1">{renderAction(policy)}</div>
        </div>
      ))}
    </>
  );
}

export function ActionPanel({ sale, onUpdate }: ActionPanelProps) {
  const { language } = useLanguageStore();
  const [assignments, setAssignments] = useState(sale.assignment);
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [reworkText, setReworkText] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<'vmi' | 'cmi'>('vmi');

  const isMultiPolicy = sale.policies.length > 1;

  const handleToastAction = (actionName: string) => {
    toast.success(`${actionName} — ${language === 'th' ? 'ดำเนินการสำเร็จ' : 'Action completed'}`, {
      description: language === 'th' ? 'ฟีเจอร์นี้จะเชื่อมต่อกับระบบจริงในอนาคต' : 'This feature will connect to the real system in the future.',
    });
  };

  const handleAssignmentChange = (role: keyof typeof assignments, value: string) => {
    const updated = { ...assignments, [role]: value };
    setAssignments(updated);
    toast.success(
      `${role.toUpperCase()} → ${value}`,
      { description: language === 'th' ? 'เปลี่ยนผู้รับผิดชอบแล้ว' : 'Assignment updated' }
    );
  };

  const handleLogRework = () => {
    if (!reworkText.trim()) return;
    toast.success(language === 'th' ? 'บันทึก Rework สำเร็จ' : 'Rework logged', {
      description: `${isMultiPolicy ? `[${selectedPolicy.toUpperCase()}] ` : ''}${reworkText}`,
    });
    setReworkText('');
    setReworkDialogOpen(false);
  };

  const handleAddRemark = () => {
    if (!remarkText.trim()) return;
    toast.success(language === 'th' ? 'เพิ่มหมายเหตุสำเร็จ' : 'Remark added', {
      description: `${isMultiPolicy ? `[${selectedPolicy.toUpperCase()}] ` : ''}${remarkText}`,
    });
    setRemarkText('');
    setRemarkDialogOpen(false);
  };

  return (
    <div className="w-80 shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-border bg-card">
      <div className="p-4 space-y-6">
        {/* Panel Title */}
        <div>
          <h3 className="text-sm font-bold">
            {language === 'th' ? 'แผงจัดการ' : 'Action Panel'}
          </h3>
          <p className="text-[11px] text-muted-foreground">QQ #{sale.qqId}</p>
        </div>

        {/* G1 — OPS Verification */}
        <ActionGroup title={language === 'th' ? 'ตรวจสอบ OPS' : 'OPS Verification'} icon={ClipboardCheck}>
          <Button
            variant={sale.opsStep1Complete ? 'secondary' : 'outline'}
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={() => handleToastAction('Complete OPS Step 1')}
          >
            <ClipboardCheck className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'เสร็จสิ้นขั้นตอน 1' : 'Complete OPS Step 1'}
            {sale.opsStep1Complete && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-green-600" />}
          </Button>
          <Button
            variant={sale.opsStep2Complete ? 'secondary' : 'outline'}
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={() => handleToastAction('Complete OPS Step 2')}
          >
            <ClipboardCheck className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'เสร็จสิ้นขั้นตอน 2' : 'Complete OPS Step 2'}
            {sale.opsStep2Complete && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-green-600" />}
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8"
            onClick={() => handleToastAction('Manage Instalment')}>
            <CreditCard className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'จัดการผ่อนชำระ' : 'Manage Instalment'}
          </Button>
        </ActionGroup>

        {/* G2 — Policy Issuance (per-policy) */}
        <ActionGroup title={language === 'th' ? 'ออกกรมธรรม์' : 'Policy Issuance'} icon={FileUp}>
          <div className="text-[10px] text-muted-foreground mb-1">
            {language === 'th' ? 'แจ้ง บ.ประกัน' : 'Notify Insurer'}
          </div>
          <PerPolicyRow policies={sale.policies} label="notify" renderAction={(p) => (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7"
              onClick={() => handleToastAction(`Notify Insurer (${p.kind.toUpperCase()})`)}>
              {language === 'th' ? 'แจ้ง บ.ประกัน' : 'Notify Insurer'}
            </Button>
          )} />

          <div className="text-[10px] text-muted-foreground mb-1 mt-2">
            {language === 'th' ? 'อัปโหลดกรมธรรม์' : 'Upload Policy File'}
          </div>
          <PerPolicyRow policies={sale.policies} label="upload" renderAction={(p) => (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7"
              onClick={() => handleToastAction(`Upload Policy (${p.kind.toUpperCase()})`)}>
              <FileUp className="w-3 h-3 mr-1.5" />
              {language === 'th' ? 'อัปโหลดไฟล์' : 'Upload File'}
            </Button>
          )} />

          <div className="text-[10px] text-muted-foreground mb-1 mt-2">
            {language === 'th' ? 'เลขกรมธรรม์' : 'Policy Number'}
          </div>
          <PerPolicyRow policies={sale.policies} label="policynum" renderAction={(p) => (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7"
              onClick={() => handleToastAction(`Enter Policy Number (${p.kind.toUpperCase()})`)}>
              <Hash className="w-3 h-3 mr-1.5" />
              {p.policyNumber || (language === 'th' ? 'กรอกเลขกรมธรรม์' : 'Enter Number')}
            </Button>
          )} />
        </ActionGroup>

        {/* G3 — Policy Delivery (per-policy) */}
        <ActionGroup title={language === 'th' ? 'จัดส่งกรมธรรม์' : 'Policy Delivery'} icon={Truck}>
          <div className="text-[10px] text-muted-foreground mb-1">
            {language === 'th' ? 'วิธีจัดส่ง' : 'Delivery Method'}
          </div>
          <PerPolicyRow policies={sale.policies} label="delivery" renderAction={(p) => (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7"
              onClick={() => handleToastAction(`Set Delivery Method (${p.kind.toUpperCase()})`)}>
              <Package className="w-3 h-3 mr-1.5" />
              {p.deliveryMethod || (language === 'th' ? 'ตั้งค่าวิธีจัดส่ง' : 'Set Method')}
            </Button>
          )} />

          <div className="text-[10px] text-muted-foreground mb-1 mt-2">
            {language === 'th' ? 'เลขพัสดุ' : 'Tracking Number'}
          </div>
          <PerPolicyRow policies={sale.policies} label="tracking" renderAction={(p) => (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7"
              onClick={() => handleToastAction(`Enter Tracking (${p.kind.toUpperCase()})`)}>
              <Truck className="w-3 h-3 mr-1.5" />
              {p.trackingNumber || (language === 'th' ? 'กรอกเลขพัสดุ' : 'Enter Tracking')}
            </Button>
          )} />
        </ActionGroup>

        {/* G4 — Rework & Remarks (real dialogs) */}
        <ActionGroup title={language === 'th' ? 'Rework และหมายเหตุ' : 'Rework & Remarks'} icon={AlertTriangle}>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8"
            onClick={() => setReworkDialogOpen(true)}>
            <AlertTriangle className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'บันทึก Rework' : 'Log Rework'}
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8"
            onClick={() => setRemarkDialogOpen(true)}>
            <MessageSquare className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'เพิ่มหมายเหตุ' : 'Add Remark'}
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8"
            onClick={() => handleToastAction('Resolve Rework')}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'แก้ไข Rework' : 'Resolve Rework'}
          </Button>
        </ActionGroup>

        {/* G5 — Cancellation & Transfer */}
        <ActionGroup title={language === 'th' ? 'ยกเลิกและโอน' : 'Cancellation & Transfer'} icon={XCircle}>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8"
            onClick={() => handleToastAction('Request Endorsement/Cancellation')}>
            <XCircle className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'ขอสลักหลัง/ยกเลิก' : 'Request Endorsement/Cancel'}
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8"
            onClick={() => handleToastAction('Transfer Sale')}>
            <ArrowRightLeft className="w-3.5 h-3.5 mr-2" />
            {language === 'th' ? 'โอนงาน' : 'Transfer Sale'}
          </Button>
        </ActionGroup>

        {/* G6 — Role Assignments (real controls) */}
        <ActionGroup title={language === 'th' ? 'มอบหมายงาน' : 'Role Assignments'} icon={Users}>
          {[
            { role: 'rf' as const, label: 'RF', staff: rfStaff },
            { role: 'sc' as const, label: 'SC', staff: scStaff },
            { role: 'de' as const, label: 'DE', staff: deStaff },
            { role: 'admin' as const, label: 'Admin', staff: adminStaff },
            { role: 'delivery' as const, label: 'Delivery', staff: deliveryStaff },
          ].map(({ role, label, staff }) => (
            <div key={role} className="flex items-center gap-2">
              <span className="text-[11px] font-medium w-14 shrink-0">{label}</span>
              <Select
                value={assignments[role] || ''}
                onValueChange={(v) => handleAssignmentChange(role, v)}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder={language === 'th' ? 'ยังไม่มอบหมาย' : 'Unassigned'} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {staff.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </ActionGroup>
      </div>

      {/* Rework Dialog */}
      <Dialog open={reworkDialogOpen} onOpenChange={setReworkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'th' ? 'บันทึก Rework' : 'Log Rework'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isMultiPolicy && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  {language === 'th' ? 'เลือกกรมธรรม์' : 'Select Policy'}
                </label>
                <div className="flex gap-2">
                  {(['vmi', 'cmi'] as const).map((kind) => (
                    <Button
                      key={kind}
                      variant={selectedPolicy === kind ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedPolicy(kind)}
                    >
                      {kind.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium mb-1.5 block">
                {language === 'th' ? 'รายละเอียด' : 'Details'}
              </label>
              <Textarea
                value={reworkText}
                onChange={(e) => setReworkText(e.target.value)}
                placeholder={language === 'th' ? 'กรอกรายละเอียด Rework...' : 'Enter rework details...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReworkDialogOpen(false)}>
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button size="sm" onClick={handleLogRework}>
              {language === 'th' ? 'บันทึก' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remark Dialog */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'th' ? 'เพิ่มหมายเหตุ' : 'Add Remark'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isMultiPolicy && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  {language === 'th' ? 'เลือกกรมธรรม์' : 'Select Policy'}
                </label>
                <div className="flex gap-2">
                  {(['vmi', 'cmi'] as const).map((kind) => (
                    <Button
                      key={kind}
                      variant={selectedPolicy === kind ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedPolicy(kind)}
                    >
                      {kind.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium mb-1.5 block">
                {language === 'th' ? 'หมายเหตุ' : 'Remark'}
              </label>
              <Textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder={language === 'th' ? 'กรอกหมายเหตุ...' : 'Enter remark...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRemarkDialogOpen(false)}>
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button size="sm" onClick={handleAddRemark}>
              {language === 'th' ? 'บันทึก' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
