import React from 'react';
import sampleNationalId from '@/assets/sample-national-id.jpeg';
import sampleCarRegistration from '@/assets/sample-car-registration.jpg';
import samplePaymentProof from '@/assets/sample-payment-proof.png';
import insurerLogo from '@/assets/insurer-generic.png';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import {
  getRequiredDocuments,
  DOCUMENT_FIELDS,
  getPaymentProofName,
  getDocumentTier,
  TIER_ORDER,
  TIER_LABELS,
  TIER_BADGE_CLASS,
  type DocumentGroup,
} from '@/data/documentRequirements';
import { CoveragePanel } from './CoveragePanel';
import { Step1FormSection } from './Step1FormSection';
import { useOpsLogic } from './OpsLogicContext';
import { PolicyDetailsZone } from './PolicyDetailsZone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceListTab } from './InvoiceListTab';
import { ProcessPaymentTab } from './ProcessPaymentTab';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Image, CreditCard, User, Package, Link2, Plus, X, RefreshCw, Upload, ShieldCheck, Check, Lock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContentTabsProps {
  sale: SaleDetail;
}

function LockedBanner({ language }: { language: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
      <Lock className="w-3.5 h-3.5 text-primary" />
      <span className="font-medium">
        {language === 'th'
          ? 'ขั้นตอนนี้ถูกล็อก — Sale ID ออกแล้ว ข้อมูลเป็นแบบอ่านอย่างเดียว ใช้ "Update Sale" เพื่อแก้ไข'
          : 'Locked — Sale ID issued. Fields are read-only. Use "Update Sale" to edit.'}
      </span>
    </div>
  );
}

function BlockerList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
        <span className="text-xs font-semibold text-destructive">{title}</span>
        <span className="text-[10px] text-destructive/80">({items.length})</span>
      </div>
      <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-destructive/90">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}


function InvoiceTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  return (
    <div className="space-y-4">
      {sale.policies.map((policy) => (
        <Card key={policy.kind}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  policy.kind === 'vmi' ? 'border-primary text-primary text-[10px]' : 'border-orange-500 text-orange-600 text-[10px]'
                }>
                  {policy.kind.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">{policy.packageName}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {policy.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'เบี้ยหลังภาษี' : 'Premium After Tax'}</span>
                <span className="font-semibold">{policy.premiumAfterTax.toLocaleString()} Baht</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'คอมมิชชั่น' : 'Commission'}</span>
                <span className="font-medium text-primary">{policy.affiliateCommission.toLocaleString()} Baht</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'วิธีชำระ' : 'Payment Method'}</span>
                <span className="font-medium">{sale.paymentMethod}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4">
          <h5 className="text-xs font-semibold mb-2">{language === 'th' ? 'สรุปยอดชำระ' : 'Payment Summary'}</h5>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'th' ? 'รวมเบี้ยประกัน' : 'Total Premium'}</span>
              <span className="font-semibold">
                {sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0).toLocaleString()} Baht
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'th' ? 'สถานะการชำระ' : 'Payment Status'}</span>
              <Badge variant="outline" className="text-[10px]">{sale.paymentStatus}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  const docs = [
    { name: language === 'th' ? 'สำเนาบัตรประชาชน' : 'National ID Copy', status: 'uploaded' },
    { name: language === 'th' ? 'สำเนาทะเบียนรถ' : 'Car Registration', status: 'uploaded' },
    { name: language === 'th' ? 'กรมธรรม์ VMI' : 'VMI Policy File', status: 'pending' },
    ...(sale.hasCompulsoryInsurance ? [
      { name: language === 'th' ? 'กรมธรรม์ พ.ร.บ.' : 'CMI Policy File', status: 'pending' },
    ] : []),
    { name: language === 'th' ? 'สลิปชำระเงิน' : 'Payment Slip', status: 'uploaded' },
  ];

  return (
    <div className="space-y-2">
      {docs.map((doc, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            {doc.status === 'uploaded' ? (
              <Image className="w-4 h-4 text-green-600" />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">{doc.name}</span>
          </div>
          <Badge
            variant="outline"
            className={doc.status === 'uploaded'
              ? 'border-green-500 text-green-600 text-[10px]'
              : 'border-muted-foreground text-muted-foreground text-[10px]'
            }
          >
            {doc.status === 'uploaded'
              ? (language === 'th' ? 'อัปโหลดแล้ว' : 'Uploaded')
              : (language === 'th' ? 'รอเอกสาร' : 'Pending')
            }
          </Badge>
        </div>
      ))}
    </div>
  );
}

interface DocFile {
  id: string;
  name: string;
  preview?: string;
  type?: string;
}

interface DocCategory {
  key: string;
  en: string;
  th: string;
  required?: boolean;
  docs: DocFile[];
}

function UploadDocumentsDialog({ 
  open, 
  onOpenChange, 
  categoryLabel,
  onUpload 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  categoryLabel: string;
  onUpload: (files: { id: string; name: string; size: string; type: string; preview?: string }[]) => void;
}) {
  const { language } = useLanguageStore();
  const [selectedFiles, setSelectedFiles] = React.useState<{ id: string; name: string; size: string; type: string; preview?: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files
      .filter(f => ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type))
      .map(f => ({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        type: f.type,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (e.target) e.target.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = () => {
    onUpload(selectedFiles.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type, preview: f.preview })));
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {categoryLabel 
              ? `${language === 'th' ? 'อัปโหลดเอกสาร' : 'Upload Documents'} - ${categoryLabel}`
              : (language === 'th' ? 'อัปโหลดเอกสาร' : 'Upload Documents')
            }
          </DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            {language === 'th' ? 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์' : 'Drag and drop files here, or click to select files'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {language === 'th' ? 'รองรับ: JPG, PNG, PDF' : 'Supports: JPG, PNG, PDF'}
          </p>
          <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            {language === 'th' ? 'เลือกไฟล์' : 'Select Files'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            onChange={handleFileSelect}
          />
        </div>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold">{language === 'th' ? 'ไฟล์ที่เลือก' : 'Selected Files'}</p>
            <div className="grid grid-cols-3 gap-3">
              {selectedFiles.map(f => (
                <div key={f.id} className="relative border border-border rounded-lg overflow-hidden bg-card">
                  {f.preview ? (
                    <img src={f.preview} alt={f.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-muted/30">
                      <FileText className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-[10px] font-medium truncate">{f.name}</p>
                    <p className="text-[9px] text-muted-foreground">{f.size}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(f.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={handleClose}>
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button size="sm" className="text-xs" disabled={selectedFiles.length === 0} onClick={handleUpload}>
            {language === 'th' ? 'อัปโหลด' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinkDocumentsTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();

  // Pull live logic state from context (driven by Step1FormSection + dev FAB).
  const { logic, setFieldDocCounts } = useOpsLogic();
  const { saleType, insuranceClass, paymentType, carType, customerType, paymentMethodValue: paymentMethod, driverLicenseCount, carInspectionMethod } = logic;

  const docGroups = React.useMemo(
    () => getRequiredDocuments(
      saleType, insuranceClass, paymentType, carType,
      customerType, paymentMethod, driverLicenseCount, carInspectionMethod
    ),
    [saleType, insuranceClass, paymentType, carType, customerType, paymentMethod, driverLicenseCount, carInspectionMethod]
  );

  // Field-level upload state: fieldId -> docs
  const [fieldDocs, setFieldDocs] = React.useState<Record<string, DocFile[]>>({});
  const [unlinkedDocs, setUnlinkedDocs] = React.useState<{ id: string; name: string; size?: string; preview?: string }[]>([]);

  // Mirror upload counts up to context so VerifyInformationTab can flag missing required docs
  React.useEffect(() => {
    const counts: Record<string, number> = {};
    Object.entries(fieldDocs).forEach(([k, v]) => { counts[k] = v.length; });
    setFieldDocCounts(counts);
  }, [fieldDocs, setFieldDocCounts]);

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTarget, setUploadTarget] = React.useState<string | null>(null);

  const fieldLabel = (fieldId: string) => {
    const def = DOCUMENT_FIELDS[fieldId];
    if (!def) return fieldId;
    // Dynamic name override for payment_proof
    if (fieldId === 'payment_proof') {
      const dyn = getPaymentProofName(paymentMethod);
      return language === 'th' ? dyn.th : dyn.en;
    }
    return language === 'th' ? def.th : def.en;
  };

  const handleOpenUploadForField = (fieldId: string) => {
    setUploadTarget(fieldId);
    setUploadDialogOpen(true);
  };

  const handleOpenUploadForUnlinked = () => {
    setUploadTarget(null);
    setUploadDialogOpen(true);
  };

  const handleUploadFiles = (files: { id: string; name: string; size: string; type: string; preview?: string }[]) => {
    if (uploadTarget) {
      setFieldDocs(prev => ({
        ...prev,
        [uploadTarget]: [...(prev[uploadTarget] || []), ...files.map(f => ({ id: f.id, name: f.name, preview: f.preview, type: f.type }))],
      }));
    } else {
      setUnlinkedDocs(prev => [...prev, ...files.map(f => ({ id: f.id, name: f.name, size: f.size, preview: f.preview }))]);
    }
  };

  const handleRemoveDoc = (fieldId: string, docId: string) => {
    setFieldDocs(prev => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter(d => d.id !== docId),
    }));
  };

  const handleRemoveUnlinked = (docId: string) => {
    setUnlinkedDocs(prev => prev.filter(d => d.id !== docId));
  };

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData('text/plain', docId);
  };

  const handleDrop = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData('text/plain');
    const doc = unlinkedDocs.find(d => d.id === docId);
    if (doc) {
      setFieldDocs(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), { id: doc.id, name: doc.name, preview: doc.preview }],
      }));
      setUnlinkedDocs(prev => prev.filter(d => d.id !== docId));
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const uploadFieldLabel = uploadTarget ? fieldLabel(uploadTarget) : '';

  // Flatten + sort by tier (Required → Conditional → Optional). No group headers.
  const sortedDocs = React.useMemo(() => {
    const withTier = docGroups.map(d => ({ doc: d, tier: getDocumentTier(d) }));
    withTier.sort((a, b) => {
      const ti = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
      if (ti !== 0) return ti;
      // Within same tier, keep formal-required first then required, fallback alpha
      const aReq = a.doc.required ? 0 : 1;
      const bReq = b.doc.required ? 0 : 1;
      if (aReq !== bReq) return aReq - bReq;
      return a.doc.fieldId.localeCompare(b.doc.fieldId);
    });
    return withTier;
  }, [docGroups]);

  return (
    <div className="space-y-6">
      <Step1FormSection sale={sale} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <h4 className="text-sm font-bold pb-2 border-b border-border">
            {language === 'th' ? 'แนบเอกสาร' : 'Link Documents'}
          </h4>
          <div className="space-y-2">
            {sortedDocs.map(({ doc: item, tier }) => {
              const docs = fieldDocs[item.fieldId] || [];
              const labelText = fieldLabel(item.fieldId);
              const def = DOCUMENT_FIELDS[item.fieldId];
              return (
                <div
                  key={item.fieldId}
                  className="border border-border rounded-lg p-3 bg-card"
                  onDrop={(e) => handleDrop(e, item.fieldId)}
                  onDragOver={handleDragOver}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium">
                          {labelText}
                          {item.required && <span className="text-destructive ml-0.5">*</span>}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 ${TIER_BADGE_CLASS[tier]}`}
                        >
                          {language === 'th' ? TIER_LABELS[tier].th : TIER_LABELS[tier].en}
                        </Badge>
                        {def?.isOcr && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/40 text-primary">
                            OCR
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {docs.length} {language === 'th' ? 'เอกสาร' : 'Documents'}
                        {item.requiredCount ? ` / ${item.requiredCount} ${language === 'th' ? 'จำเป็น' : 'required'}` : ''}
                        {item.conditionNote && <span className="ml-1.5 italic">· {item.conditionNote}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenUploadForField(item.fieldId)}
                      className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  {docs.length > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {docs.map(doc => (
                        <div key={doc.id} className="relative border border-border rounded-lg overflow-hidden bg-muted/30">
                          {doc.preview ? (
                            <img src={doc.preview} alt={doc.name} className="w-full h-16 object-cover" />
                          ) : (
                            <div className="w-full h-16 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="px-1.5 py-1">
                            <p className="text-[9px] font-medium truncate">{doc.name}</p>
                          </div>
                          <button onClick={() => handleRemoveDoc(item.fieldId, doc.id)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


      {/* Right: unlinked documents */}
      <div className="lg:col-span-2">
        <Card className="border-border sticky top-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-xs font-semibold">{language === 'th' ? 'เอกสารที่ยังไม่ได้เชื่อมโยง' : 'Unlinked Documents'}</h5>
                <p className="text-[10px] text-muted-foreground">{language === 'th' ? 'ลากรูปไปยังช่องทางซ้ายเพื่อเชื่อมโยง' : 'Drag image into respective box on the left to link it'}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleOpenUploadForUnlinked}
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  title={language === 'th' ? 'อัปโหลดเอกสาร' : 'Upload documents'}
                >
                  <Upload className="w-3 h-3 text-muted-foreground" />
                </button>
                <button className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                </button>
                <button className="px-3 py-1.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  {language === 'th' ? 'เชื่อมโยงอัตโนมัติ' : 'Auto link'}
                </button>
              </div>
            </div>

            {unlinkedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs">{language === 'th' ? 'ไม่มีเอกสารที่ยังไม่ได้เชื่อมโยง' : 'No unlinked documents'}</span>
                <button
                  onClick={handleOpenUploadForUnlinked}
                  className="mt-2 text-[10px] text-primary hover:underline"
                >
                  {language === 'th' ? 'อัปโหลดเอกสาร' : 'Upload documents'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {unlinkedDocs.map(doc => (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, doc.id)}
                    className="relative border border-border rounded-lg overflow-hidden bg-muted/20 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                  >
                    {doc.preview ? (
                      <img src={doc.preview} alt={doc.name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-muted/30">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-1.5">
                      <p className="text-[9px] font-medium truncate">{doc.name}</p>
                      {doc.size && <p className="text-[8px] text-muted-foreground">{doc.size}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveUnlinked(doc.id)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <UploadDocumentsDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        categoryLabel={uploadFieldLabel}
        onUpload={handleUploadFiles}
      />
    </div>
  );
}

type OcrStatus = 'pending' | 'processing' | 'done';
type OcrKey = 'national_id' | 'car_reg' | 'payment';
type AddressSource = 'national_id' | 'agent' | 'car_reg' | 'manual';

interface ShippingFormState {
  receiverType: 'policy_holder' | 'agent' | 'e_policy' | 'new_address';
  addressSource: AddressSource;
  receiverName: string;
  addressLine: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  phoneNumber: string;
}

interface VerifyTabProps {
  sale: SaleDetail;
  onReadinessChange?: (ready: boolean, blockers: string[]) => void;
}

function VerifyInformationTab({ sale, onReadinessChange }: VerifyTabProps) {
  const { language } = useLanguageStore();
  const { logic, installmentPlan, installmentCount, coverageStartDate, fieldDocCounts } = useOpsLogic();
  const customer = sale.customer;
  const vehicle = sale.vehicle;
  const shipping = sale.shipping;
  const agent = sale.agent;

  // Scenario-driven flags
  const isCorporation = logic.customerType === 'corporation';
  const isInstalment = logic.paymentType === 'Instalment';
  const isCOA = logic.saleType === 'COA';
  const isStartToday = React.useMemo(() => {
    if (!coverageStartDate) return false;
    return coverageStartDate === new Date().toISOString().slice(0, 10);
  }, [coverageStartDate]);

  const [zoom, setZoom] = React.useState<Record<string, number>>({ national_id: 100, car_reg: 100, payment: 100 });
  // OCR runs automatically in the background after Step 1 → Step 2 transition.
  const [ocrStatus, setOcrStatus] = React.useState<Record<OcrKey, OcrStatus>>({
    national_id: 'done',
    car_reg: 'done',
    payment: 'done',
  });

  // Insurance / shipping editable state (drives address propagation + gating)
  const [policyStartDate, setPolicyStartDate] = React.useState('');
  const [insurancePhone, setInsurancePhone] = React.useState(customer.phoneNumber || '');

  // Sources available for shipping address propagation. Built from sale data.
  const addressSources = React.useMemo(() => ({
    national_id: {
      addressLine: customer.addressLine,
      province: customer.province,
      district: customer.district,
      subDistrict: customer.subDistrict,
      postalCode: customer.postalCode,
    },
    agent: agent?.address || {
      addressLine: '', province: '', district: '', subDistrict: '', postalCode: '',
    },
    car_reg: {
      // Mock: car-reg address derived from vehicle.registrationProvince
      addressLine: '', province: vehicle.registrationProvince || '', district: '', subDistrict: '', postalCode: '',
    },
  }), [customer, agent, vehicle]);

  const initialShipping: ShippingFormState = {
    receiverType: shipping.receiverType,
    addressSource: shipping.receiverType === 'agent' ? 'agent' : shipping.receiverType === 'policy_holder' ? 'national_id' : 'manual',
    receiverName: shipping.receiverName,
    addressLine: shipping.addressLine,
    province: shipping.province,
    district: shipping.district,
    subDistrict: shipping.subDistrict,
    postalCode: shipping.postalCode,
    phoneNumber: shipping.phoneNumber,
  };
  const [shippingForm, setShippingForm] = React.useState<ShippingFormState>(initialShipping);

  const handleZoom = (key: string, delta: number) => {
    setZoom(prev => ({ ...prev, [key]: Math.max(25, Math.min(400, (prev[key] || 100) + delta)) }));
  };

  const runOcr = (key: OcrKey) => {
    setOcrStatus(prev => ({ ...prev, [key]: 'processing' }));
    setTimeout(() => {
      setOcrStatus(prev => ({ ...prev, [key]: 'done' }));
      const labels: Record<OcrKey, string> = {
        national_id: language === 'th' ? 'บัตรประชาชน' : 'National ID',
        car_reg: language === 'th' ? 'เล่มทะเบียนรถ' : 'Car Registration',
        payment: language === 'th' ? 'หลักฐานการชำระเงิน' : 'Payment Proof',
      };
      toast.success(
        language === 'th'
          ? `OCR ${labels[key]} สำเร็จ — ฟิลด์ถูกอัปเดตจากเอกสาร`
          : `OCR completed for ${labels[key]} — fields populated from document`
      );
    }, 1200);
  };

  // Apply receiver type → set address source and pre-fill on change
  const handleReceiverTypeChange = (rt: ShippingFormState['receiverType']) => {
    let source: AddressSource = 'manual';
    if (rt === 'policy_holder') source = 'national_id';
    else if (rt === 'agent') source = 'agent';
    else if (rt === 'new_address') source = 'manual';
    // e_policy stays manual (no physical address required)

    if (source !== 'manual') {
      const src = addressSources[source];
      setShippingForm(prev => ({
        ...prev,
        receiverType: rt,
        addressSource: source,
        receiverName: rt === 'policy_holder'
          ? `${customer.title} ${customer.firstName} ${customer.lastName}`.trim()
          : rt === 'agent'
          ? agent?.name || prev.receiverName
          : prev.receiverName,
        addressLine: src.addressLine,
        province: src.province,
        district: src.district,
        subDistrict: src.subDistrict,
        postalCode: src.postalCode,
        phoneNumber: rt === 'agent' ? (agent?.phone || prev.phoneNumber) : prev.phoneNumber,
      }));
    } else {
      setShippingForm(prev => ({ ...prev, receiverType: rt, addressSource: 'manual' }));
    }
  };

  // Manually pick a source (within the radios) and re-pull
  const repullFromSource = (source: AddressSource) => {
    if (source === 'manual') return;
    const src = addressSources[source];
    setShippingForm(prev => ({
      ...prev,
      addressSource: source,
      addressLine: src.addressLine,
      province: src.province,
      district: src.district,
      subDistrict: src.subDistrict,
      postalCode: src.postalCode,
    }));
    toast.info(
      language === 'th'
        ? 'ที่อยู่จัดส่งถูกอัปเดตจากแหล่งข้อมูลที่เลือก'
        : 'Shipping address re-pulled from selected source'
    );
  };

  // Corporation-specific fields
  const [companyName, setCompanyName] = React.useState('');
  const [taxId, setTaxId] = React.useState('');
  const [authorizedSignatory, setAuthorizedSignatory] = React.useState('');

  // COA review acknowledgement
  const [coaFormReviewed, setCoaFormReviewed] = React.useState(false);

  // Compute readiness for "Send to Agent"
  React.useEffect(() => {
    const blockers: string[] = [];
    // Today-start scenario: relax start-date gating; only formal docs required.
    if (!isStartToday) {
      if (!policyStartDate) blockers.push(language === 'th' ? 'กรุณาระบุวันเริ่มต้นกรมธรรม์' : 'Policy start date required');
    }
    if (!insurancePhone.trim()) blockers.push(language === 'th' ? 'กรุณาระบุเบอร์โทรศัพท์' : 'Phone number required');
    if (isCorporation) {
      if (!companyName.trim()) blockers.push(language === 'th' ? 'กรุณาระบุชื่อบริษัท' : 'Company name required');
      if (!taxId.trim()) blockers.push(language === 'th' ? 'กรุณาระบุเลขประจำตัวผู้เสียภาษี' : 'Tax ID required');
      if (!authorizedSignatory.trim()) blockers.push(language === 'th' ? 'กรุณาระบุผู้มีอำนาจลงนาม' : 'Authorized signatory required');
    }
    if (isCOA && !coaFormReviewed) blockers.push(language === 'th' ? 'กรุณายืนยันการตรวจสอบแบบฟอร์ม COA' : 'COA form review required');
    if (shippingForm.receiverType !== 'e_policy') {
      if (!shippingForm.addressLine.trim()) blockers.push(language === 'th' ? 'กรุณาระบุที่อยู่จัดส่ง' : 'Shipping address required');
      if (!shippingForm.phoneNumber.trim()) blockers.push(language === 'th' ? 'กรุณาระบุเบอร์โทรผู้รับ' : 'Receiver phone required');
    }
    onReadinessChange?.(blockers.length === 0, blockers);
  }, [ocrStatus, insurancePhone, policyStartDate, shippingForm, language, onReadinessChange, isStartToday, isCorporation, companyName, taxId, authorizedSignatory, isCOA, coaFormReviewed]);

  const ocrPill = (status: OcrStatus) => {
    const map: Record<OcrStatus, { label: string; cls: string }> = {
      pending: { label: language === 'th' ? 'รอดำเนินการ OCR' : 'OCR pending', cls: 'bg-muted text-muted-foreground border-border' },
      processing: { label: language === 'th' ? 'กำลังประมวลผล...' : 'Processing…', cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
      done: { label: language === 'th' ? 'OCR เสร็จสิ้น' : 'OCR complete', cls: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
    };
    const it = map[status];
    return <Badge variant="outline" className={cn('text-[10px] h-5 px-1.5', it.cls)}>{it.label}</Badge>;
  };

  const ocrButton = (key: OcrKey) => {
    const status = ocrStatus[key];
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[11px] gap-1"
        disabled={status === 'processing'}
        onClick={() => runOcr(key)}
      >
        <RefreshCw className={cn('w-3 h-3', status === 'processing' && 'animate-spin')} />
        {status === 'done'
          ? (language === 'th' ? 'รันใหม่' : 'Re-run OCR')
          : (language === 'th' ? 'รัน OCR' : 'Run OCR')}
      </Button>
    );
  };

  // Scenario hint chips
  const scenarioChips: { label: string; cls: string }[] = [];
  if (isCorporation) scenarioChips.push({ label: language === 'th' ? 'นิติบุคคล' : 'Corporation', cls: 'bg-blue-500/15 text-blue-700 border-blue-500/30' });
  if (isInstalment) scenarioChips.push({ label: language === 'th' ? 'ผ่อนชำระ' : 'Instalment', cls: 'bg-violet-500/15 text-violet-700 border-violet-500/30' });
  if (isCOA) scenarioChips.push({ label: 'COA', cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30' });
  if (isStartToday) scenarioChips.push({ label: language === 'th' ? 'เริ่มคุ้มครองวันนี้' : 'Start today', cls: 'bg-rose-500/15 text-rose-700 border-rose-500/30' });

  // Cross-check: required docs from Step 1 not yet uploaded
  // Cross-check uses fieldDocCounts already pulled above
  const missingRequiredDocs = React.useMemo(() => {
    const docs = getRequiredDocuments(
      logic.saleType, logic.insuranceClass, logic.paymentType, logic.carType,
      logic.customerType, logic.paymentMethodValue, logic.driverLicenseCount, logic.carInspectionMethod,
    );
    return docs
      .filter(d => d.required && (fieldDocCounts[d.fieldId] || 0) === 0)
      .map(d => {
        const def = DOCUMENT_FIELDS[d.fieldId];
        const label = def ? (language === 'th' ? def.th : def.en) : d.fieldId;
        const groupLetter = def?.group?.charAt(0) || '?';
        return { fieldId: d.fieldId, label, group: groupLetter };
      });
  }, [logic, fieldDocCounts, language]);

  return (
    <div className="space-y-6">
      {missingRequiredDocs.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-amber-800 mb-1">
                {language === 'th'
                  ? `เอกสารที่ต้องแนบยังไม่ครบ (${missingRequiredDocs.length})`
                  : `Required documents not yet linked (${missingRequiredDocs.length})`}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingRequiredDocs.slice(0, 8).map(m => (
                  <Badge key={m.fieldId} variant="outline" className="h-5 px-1.5 text-[10px] bg-card border-amber-500/40 text-amber-800">
                    {m.group}. {m.label}
                  </Badge>
                ))}
                {missingRequiredDocs.length > 8 && (
                  <span className="text-[10px] text-amber-800/80 self-center">+{missingRequiredDocs.length - 8}</span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-amber-800/80 shrink-0">
              {language === 'th' ? 'กลับไปขั้นตอนที่ 1 เพื่อแนบ' : 'Return to Step 1 to link'}
            </span>
          </div>
        </div>
      )}
      {scenarioChips.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wide">{language === 'th' ? 'ตามสถานการณ์' : 'Driven by scenario'}:</span>
          {scenarioChips.map((c, i) => (
            <Badge key={i} variant="outline" className={cn('h-5 px-1.5 text-[10px]', c.cls)}>{c.label}</Badge>
          ))}
        </div>
      )}
      {/* Section 1: National ID */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">National ID</span>
          </div>
          <div className="grid grid-cols-3">
            <div className="col-span-1 border-r border-border p-3 flex flex-col">
              <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center min-h-[240px]">
                <img
                  src={sampleNationalId}
                  alt="National ID"
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${(zoom.national_id || 100) / 100})` }}
                />
              </div>
              <ImageZoomControls zoom={zoom.national_id || 100} onZoom={(d) => handleZoom('national_id', d)} />
            </div>
            <div className="col-span-2 p-4">
              <h5 className="text-sm font-semibold text-primary mb-3">{language === 'th' ? 'ข้อมูลลูกค้า' : 'Customer Details'}</h5>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <VerifyField label={language === 'th' ? 'ประเภทลูกค้า' : 'Customer Type'} value={customer.customerType === 'individual' ? 'Individual' : 'Corporation'} source="Custom" isSelect options={['Individual', 'Corporation']} />
                <VerifyField label={language === 'th' ? 'คำนำหน้า' : 'Title'} value={customer.title} source="National Id" />
                <VerifyField label={language === 'th' ? 'ชื่อ' : 'First Name'} value={customer.firstName} source="National Id" />
                <VerifyField label={language === 'th' ? 'นามสกุล' : 'Last Name'} value={customer.lastName} source="National Id" />
                <VerifyField label={language === 'th' ? 'ประเภทบัตร' : 'Type of Identification'} value={customer.idType} source="National Id" isSelect options={['National Id', 'Passport', 'Other']} />
                <VerifyField label={language === 'th' ? 'เลขบัตรประชาชน' : 'National Id'} value={customer.nationalId} source="National Id" />
                <VerifyField label={language === 'th' ? 'วันเกิด' : 'Birthday (AD)'} value={customer.birthday} source="National Id" isDate />
                <VerifyField label={language === 'th' ? 'เพศ' : 'Gender'} value={customer.gender} source="National Id" isSelect options={['M', 'F']} />
              </div>
              <h5 className="text-sm font-semibold text-primary mt-4 mb-3">{language === 'th' ? 'ที่อยู่ผู้เอาประกันภัย' : 'Policy Holder Address'}</h5>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <VerifyField label={language === 'th' ? 'ที่อยู่' : 'Address Line'} value={customer.addressLine} source="National Id" />
                <VerifyField label={language === 'th' ? 'จังหวัด' : 'Province'} value={customer.province} source="" />
                <VerifyField label={language === 'th' ? 'เขต/อำเภอ' : 'District'} value={customer.district} source="" />
                <VerifyField label={language === 'th' ? 'แขวง/ตำบล' : 'Sub District'} value={customer.subDistrict} source="" />
                <VerifyField label={language === 'th' ? 'รหัสไปรษณีย์' : 'Postal Code'} value={customer.postalCode} source="" />
                <VerifyField label={language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'} value={customer.phoneNumber} source="" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Car Registration */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Car Registration</span>
          </div>
          <div className="grid grid-cols-3">
            <div className="col-span-1 border-r border-border p-3 flex flex-col">
              <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center min-h-[240px]">
                <img
                  src={sampleCarRegistration}
                  alt="Car Registration"
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${(zoom.car_reg || 100) / 100})` }}
                />
              </div>
              <ImageZoomControls zoom={zoom.car_reg || 100} onZoom={(d) => handleZoom('car_reg', d)} />
            </div>
            <div className="col-span-2 p-4">
              <h5 className="text-sm font-semibold text-primary mb-3">{language === 'th' ? 'ข้อมูลรถยนต์' : 'Policy Details'}</h5>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <VerifyField label={language === 'th' ? 'ประเภททะเบียน' : 'License Type'} value="Registered" source="" isSelect options={['Registered', 'Red Plate', 'Not Registered']} />
                <VerifyField label={language === 'th' ? 'เลขทะเบียน' : 'License Plate'} value={vehicle.licensePlate} source="Portal" />
                <VerifyField label={language === 'th' ? 'จังหวัดจดทะเบียน' : 'Registration Province'} value={vehicle.registrationProvince} source="Car Registration" />
                <VerifyField label={language === 'th' ? 'เลขตัวถัง' : 'Chassis Number'} value={vehicle.chassisNumber} source="" />
                <VerifyField label={language === 'th' ? 'เลขเครื่องยนต์' : 'Engine Number'} value={vehicle.engineNumber} source="" />
                <VerifyField label={language === 'th' ? 'น้ำหนักรถ' : 'Vehicle Weight'} value={vehicle.vehicleWeight} source="Car Registration" />
                <VerifyField label={language === 'th' ? 'สี' : 'Color'} value={vehicle.color} source="Car Registration" isSelect options={['ขาว', 'ดำ', 'เทา', 'แดง', 'น้ำเงิน', 'เขียว']} />
                <VerifyField label={language === 'th' ? 'ข้อกำหนดผู้ขับ' : 'Driver Specification'} value="Not specified" source="Car Registration" isSelect options={['Not specified', 'Named Driver', 'Any Driver']} />
                <VerifyField label={language === 'th' ? 'ผู้รับผลประโยชน์' : 'Beneficiary Type'} value="Legal Owner" source="Car Registration" isSelect options={['Legal Owner', 'Named Person', 'Financial Institution']} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Payment Proof */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">{language === 'th' ? 'หลักฐานการชำระเงิน' : 'Payment proof to FairDee'}</span>
          </div>
          <div className="grid grid-cols-3">
            <div className="col-span-1 border-r border-border p-3 flex flex-col">
              <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center min-h-[240px]">
                <img
                  src={samplePaymentProof}
                  alt="Payment Proof"
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${(zoom.payment || 100) / 100})` }}
                />
              </div>
              <ImageZoomControls zoom={zoom.payment || 100} onZoom={(d) => handleZoom('payment', d)} />
            </div>
            <div className="col-span-2 p-4">
              <h5 className="text-sm font-semibold text-primary mb-3">{language === 'th' ? 'ข้อมูลการชำระเงิน' : 'Payment Information'}</h5>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <VerifyField label={language === 'th' ? 'เวลาทำรายการ' : 'Transaction Time'} value="" source="" isDate />
                <VerifyField label={language === 'th' ? 'เลขที่ทำรายการ' : 'Transaction Id'} value="" source="" />
                <VerifyField label={language === 'th' ? 'จำนวนเงิน' : 'Amount'} value="" source="" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information / Insurance Info */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h5 className="text-sm font-semibold mb-4">{language === 'th' ? 'ข้อมูลประกันภัย' : 'Customer Information'}</h5>
          <h6 className="text-xs font-semibold text-primary mb-3">{language === 'th' ? 'ข้อมูลประกันภัย' : 'Insurance Information'}</h6>
          <div className="grid grid-cols-2 gap-4">
            <VerifyField
              label={language === 'th' ? 'วันเริ่มต้นกรมธรรม์ *' : 'Policy Start Date (AD) *'}
              value={policyStartDate}
              onChange={setPolicyStartDate}
              source=""
              isDate
              required
            />
            <VerifyField
              label={language === 'th' ? 'เบอร์โทรศัพท์ *' : 'Phone Number *'}
              value={insurancePhone}
              onChange={setInsurancePhone}
              source=""
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Corporation: company KYC fields */}
      {isCorporation && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <h5 className="text-sm font-semibold">{language === 'th' ? 'ข้อมูลนิติบุคคล' : 'Corporation KYC'}</h5>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-blue-500/15 text-blue-700 border-blue-500/30">
                {language === 'th' ? 'จำเป็นสำหรับนิติบุคคล' : 'Required for Corporation'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <VerifyField
                label={language === 'th' ? 'ชื่อบริษัท *' : 'Company Name *'}
                value={companyName}
                onChange={setCompanyName}
                source="Business Registration"
                required
              />
              <VerifyField
                label={language === 'th' ? 'เลขประจำตัวผู้เสียภาษี *' : 'Tax ID *'}
                value={taxId}
                onChange={setTaxId}
                source="Business Registration"
                required
              />
              <VerifyField
                label={language === 'th' ? 'ผู้มีอำนาจลงนาม *' : 'Authorized Signatory *'}
                value={authorizedSignatory}
                onChange={setAuthorizedSignatory}
                source="Business Registration"
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instalment: payment schedule preview */}
      {isInstalment && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-violet-700" />
              <h5 className="text-sm font-semibold">{language === 'th' ? 'ตารางผ่อนชำระ' : 'Instalment Schedule'}</h5>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-violet-500/15 text-violet-700 border-violet-500/30">
                {installmentPlan === 'downpayment'
                  ? (language === 'th' ? '25% ดาวน์' : '25% Downpayment')
                  : (language === 'th' ? 'ผ่อนเท่ากัน' : 'Equal Plan')}
                {installmentCount && ` · ${installmentCount} ${language === 'th' ? 'งวด' : 'instalments'}`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'th'
                ? 'ตรวจสอบยอดดาวน์และงวดที่จะเรียกเก็บก่อนส่งให้ตัวแทน'
                : 'Review downpayment and instalment amounts before sending to agent.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* COA: form review acknowledgement */}
      {isCOA && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-amber-700 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold mb-1">{language === 'th' ? 'ตรวจสอบแบบฟอร์ม COA' : 'COA Form Review'}</h5>
                <p className="text-xs text-muted-foreground mb-3">
                  {language === 'th'
                    ? 'ยืนยันว่าตรวจสอบเอกสารโอนโค้ดแล้วก่อนดำเนินการต่อ'
                    : 'Confirm COA transfer documents have been reviewed before proceeding.'}
                </p>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coaFormReviewed}
                    onChange={(e) => setCoaFormReviewed(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>{language === 'th' ? 'ตรวจสอบและยืนยันแบบฟอร์ม COA แล้ว' : 'COA forms reviewed and confirmed'}</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Address */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-semibold">{language === 'th' ? 'ที่อยู่จัดส่ง' : 'Shipping Address'}</h5>
            {shippingForm.addressSource !== 'manual' && shippingForm.receiverType !== 'e_policy' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] gap-1 text-primary"
                onClick={() => repullFromSource(shippingForm.addressSource)}
              >
                <RefreshCw className="w-3 h-3" />
                {language === 'th' ? 'ดึงข้อมูลใหม่จากแหล่งที่เลือก' : 'Re-pull from source'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 mb-4">
            {[
              { value: 'policy_holder' as const, en: 'Policy Holder', th: 'ผู้เอาประกันภัย' },
              { value: 'agent' as const, en: 'Agent', th: 'ตัวแทน' },
              { value: 'e_policy' as const, en: 'E-Policy', th: 'E-Policy' },
              { value: 'new_address' as const, en: 'Add new address', th: 'เพิ่มที่อยู่ใหม่' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-0 cursor-pointer">
                <input
                  type="radio"
                  name="shipping_type"
                  checked={shippingForm.receiverType === opt.value}
                  onChange={() => handleReceiverTypeChange(opt.value)}
                  className="peer sr-only"
                />
                <span className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-colors">
                  {language === 'th' ? opt.th : opt.en}
                </span>
              </label>
            ))}
          </div>

          {shippingForm.addressSource !== 'manual' && (
            <div className="mb-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                ⓘ {language === 'th' ? 'แหล่งที่อยู่' : 'Address source'}: {
                  shippingForm.addressSource === 'national_id' ? (language === 'th' ? 'บัตรประชาชน' : 'National ID')
                  : shippingForm.addressSource === 'agent' ? (language === 'th' ? 'ตัวแทน' : 'Agent')
                  : (language === 'th' ? 'เล่มทะเบียนรถ' : 'Car Registration')
                }
              </span>
            </div>
          )}

          {shippingForm.receiverType !== 'e_policy' && (
            <div className="grid grid-cols-2 gap-4">
              <VerifyField
                label={language === 'th' ? 'ชื่อผู้รับกรมธรรม์ *' : 'Policy Receiver Name *'}
                value={shippingForm.receiverName}
                onChange={(v) => setShippingForm(p => ({ ...p, receiverName: v, addressSource: 'manual' }))}
                required
              />
              <VerifyField
                label={language === 'th' ? 'ที่อยู่ *' : 'Address Line *'}
                value={shippingForm.addressLine}
                onChange={(v) => setShippingForm(p => ({ ...p, addressLine: v, addressSource: 'manual' }))}
                required
              />
              <VerifyField
                label={language === 'th' ? 'จังหวัด *' : 'Province *'}
                value={shippingForm.province}
                onChange={(v) => setShippingForm(p => ({ ...p, province: v, addressSource: 'manual' }))}
                required
              />
              <VerifyField
                label={language === 'th' ? 'เขต/อำเภอ *' : 'District *'}
                value={shippingForm.district}
                onChange={(v) => setShippingForm(p => ({ ...p, district: v, addressSource: 'manual' }))}
              />
              <VerifyField
                label={language === 'th' ? 'แขวง/ตำบล *' : 'Sub District *'}
                value={shippingForm.subDistrict}
                onChange={(v) => setShippingForm(p => ({ ...p, subDistrict: v, addressSource: 'manual' }))}
              />
              <VerifyField
                label={language === 'th' ? 'รหัสไปรษณีย์ *' : 'Postal Code *'}
                value={shippingForm.postalCode}
                onChange={(v) => setShippingForm(p => ({ ...p, postalCode: v, addressSource: 'manual' }))}
              />
              <VerifyField
                label={language === 'th' ? 'เบอร์โทรศัพท์ *' : 'Phone Number *'}
                value={shippingForm.phoneNumber}
                onChange={(v) => setShippingForm(p => ({ ...p, phoneNumber: v }))}
                required
              />
            </div>
          )}
          {shippingForm.receiverType === 'e_policy' && (
            <div className="text-xs text-muted-foreground bg-muted/40 border border-dashed border-border rounded-md p-3">
              {language === 'th'
                ? 'กรมธรรม์จะถูกจัดส่งทางอีเมลแบบอิเล็กทรอนิกส์ — ไม่จำเป็นต้องระบุที่อยู่จัดส่ง'
                : 'Policy will be delivered electronically via email — no shipping address required.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ImageZoomControls({ zoom, onZoom }: { zoom: number; onZoom: (delta: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-3">
      <button onClick={() => onZoom(-25)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent text-muted-foreground text-sm">−</button>
      <span className="text-xs text-muted-foreground min-w-[40px] text-center">{zoom}%</span>
      <button onClick={() => onZoom(25)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent text-muted-foreground text-sm">+</button>
      <button onClick={() => onZoom(100 - zoom)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent text-muted-foreground text-xs">↻</button>
    </div>
  );
}

interface VerifyFieldProps {
  label: string;
  value: string;
  source?: string;
  isDate?: boolean;
  isSelect?: boolean;
  options?: string[];
  required?: boolean;
  onChange?: (value: string) => void;
}

// Source tag map: short label + tooltip explanation, color-coded by provenance
const SOURCE_META: Record<string, { label: { en: string; th: string }; tooltip: { en: string; th: string }; cls: string }> = {
  'National Id': { label: { en: 'NID', th: 'NID' }, tooltip: { en: 'Extracted from National ID via OCR', th: 'ดึงจากบัตรประชาชนผ่าน OCR' }, cls: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  'Car Registration': { label: { en: 'Car Reg', th: 'ทะเบียนรถ' }, tooltip: { en: 'Extracted from Car Registration via OCR', th: 'ดึงจากเล่มทะเบียนรถผ่าน OCR' }, cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  'Payment': { label: { en: 'Payment', th: 'ชำระเงิน' }, tooltip: { en: 'Extracted from payment proof via OCR', th: 'ดึงจากหลักฐานการชำระเงินผ่าน OCR' }, cls: 'bg-violet-500/10 text-violet-700 border-violet-500/30' },
  'Portal': { label: { en: 'Portal', th: 'พอร์ทัล' }, tooltip: { en: 'Pulled from agent portal record', th: 'ดึงจากระบบพอร์ทัลตัวแทน' }, cls: 'bg-slate-500/10 text-slate-700 border-slate-500/30' },
  'Custom': { label: { en: 'Custom', th: 'กำหนดเอง' }, tooltip: { en: 'Captured as a custom lead', th: 'บันทึกจากลีดที่กำหนดเอง' }, cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  'Chatwoot': { label: { en: 'Chatwoot', th: 'Chatwoot' }, tooltip: { en: 'Pulled from Chatwoot quotation', th: 'ดึงจากใบเสนอราคา Chatwoot' }, cls: 'bg-sky-500/10 text-sky-700 border-sky-500/30' },
  'Business Registration': { label: { en: 'Biz Reg', th: 'ทะเบียนนิติบุคคล' }, tooltip: { en: 'Captured from business registration document', th: 'ดึงจากหนังสือรับรองนิติบุคคล' }, cls: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30' },
  manual_saved: { label: { en: 'Manual', th: 'แก้ไขเอง' }, tooltip: { en: 'Manually edited and saved', th: 'แก้ไขด้วยตนเองและบันทึก' }, cls: 'bg-orange-500/10 text-orange-700 border-orange-500/30' },
};

function SourceTag({ source, language }: { source: string; language: string }) {
  const meta = SOURCE_META[source] || { label: { en: source, th: source }, tooltip: { en: source, th: source }, cls: 'bg-muted text-muted-foreground border-border' };
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-0.5 h-4 px-1.5 rounded text-[9px] font-medium border cursor-help', meta.cls)}>
            ⓘ {language === 'th' ? meta.label.th : meta.label.en}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px] max-w-[200px]">
          {language === 'th' ? meta.tooltip.th : meta.tooltip.en}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function VerifyField({ label, value, source, isDate, isSelect, options, required, onChange }: VerifyFieldProps) {
  const { language } = useLanguageStore();
  const isEmpty = required && !value?.trim();
  // Track the original source-provided value so a manual edit flips the tag to manual_saved
  const originalRef = React.useRef(value);
  const [manualEdited, setManualEdited] = React.useState(false);
  const effectiveSource = manualEdited ? 'manual_saved' : source;
  const handleChange = (v: string) => {
    if (!manualEdited && v !== originalRef.current) setManualEdited(true);
    onChange?.(v);
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium truncate">{label}</span>
        {effectiveSource && <SourceTag source={effectiveSource} language={language} />}
      </div>
      {isDate ? (
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={cn('text-xs h-9 bg-card', isEmpty && 'border-destructive')}
        />
      ) : isSelect && options ? (
        <Select value={value} onValueChange={(v) => handleChange(v)}>
          <SelectTrigger className={cn('text-xs h-9 bg-card', isEmpty && 'border-destructive')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={cn('text-xs h-9 bg-card', isEmpty && 'border-destructive')}
          placeholder={label}
        />
      )}
    </div>
  );
}


function PolicyBenefitsTab({ sale }: { sale: SaleDetail }) {
  return (
    <div className="space-y-3">
      {sale.policies.map((policy) => (
        <CoveragePanel
          key={policy.kind}
          coverage={policy.coverage}
          policyKind={sale.policies.length > 1 ? policy.kind : undefined}
          showLabel={sale.policies.length > 1}
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h5 className="text-xs font-semibold text-foreground">{children}</h5>;
}

function ToggleSelect({ label, options, value, onChange }: {
  label: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="grid grid-cols-2 gap-2" style={{ maxWidth: '280px' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`py-1.5 rounded-md text-xs font-medium border transition-colors text-center ${
              value === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:bg-accent'
            }`}
          >
            {opt.label}{value === opt.value && ' ✓'}
          </button>
        ))}
      </div>
    </div>
  );
}

const VEHICLE_CODES = [
  'E11 - รถยนต์ไฟฟ้า-ส่วนบุคคล',
  '110 - รถยนต์ส่วนบุคคล-ส่วนบุคคล',
  '120 - รถยนต์ส่วนบุคคล-เชิงพาณิชย์',
  '210 - รถกระบะ-ส่วนบุคคล',
  '210 - รถตู้-รถตู้ส่วนบุคคล',
  '220 - รถตู้รับจ้าง รถตู้รับจ้างเชิงพาณิชย์ ไม่สาธารณะ',
  '230 - รถตู้รับจ้าง-รถตู้รับจ้างสาธารณะ',
  '320 - รถยนต์บรรทุก (รถกระบะ)',
  '320.1 - รถบรรทุก (รถใหญ่)',
  '327 - รถบรรทุกใช้ลากจูงรถพ่วง',
  '420 - รถใหญ่-รถลากจูง รถหัวลาก',
  '520 - รถใหญ่-รถพ่วงเชิงพาณิชย์',
  '540 - รถใหญ่-รถพ่วงเชิงพาณิชย์พิเศษ',
  '610 - รถมอเตอร์ไซค์-ส่วนบุคคล',
  '620 - รถมอเตอร์ไซค์-เชิงพาณิชย์',
  '630 - รถมอเตอร์ไซค์รับจ้างสาธารณะ',
  '730 - รถแท็กซี่-รถแท็กซี่รับจ้างสาธารณะ',
];

const PAYMENT_METHODS = [
  { value: 'bank_account_full', th: 'บัญชีธนาคาร (จ่ายเต็ม)', en: 'Bank Account (Full Payment)' },
  { value: 'bank_account_installment', th: 'บัญชีธนาคาร (ผ่อนชำระ)', en: 'Bank Account (Installment)' },
  { value: 'qr_code_full', th: 'QR โค้ด (จ่ายเต็ม)', en: 'QR Code (Full Payment)' },
  { value: 'qr_code_installment', th: 'QR โค้ด (ผ่อนชำระ)', en: 'QR Code (Installment)' },
  { value: 'credit_card_full', th: 'บัตรเครดิตออนไลน์ (จ่ายเต็ม)', en: 'Online Credit Card (Full Payment)' },
  { value: 'credit_card_installment', th: 'บัตรเครดิตออนไลน์ (ผ่อนชำระ)', en: 'Online Credit Card (Installment)' },
  { value: 'insurer_cc_bank', th: 'บัตรเครดิต/โอนเงินผ่านบริษัทประกัน', en: 'Insurer Credit Card / Insurer Bank Transfer' },
  { value: 'credits_full', th: 'เครดิต (จ่ายเต็ม)', en: 'Credits (Full Payment)' },
];

const EQUAL_INSTALLMENT_OPTIONS = [
  { value: '3', label: '3 (0%)', th: '3 งวด (0%) รับรายได้หลังงวดที่ 3', en: '3 installments (0%) income after 3rd installment' },
  { value: '4', label: '4 (0%)', th: '4 งวด (0%) รับรายได้หลังงวดที่ 3', en: '4 installments (0%) income after 3rd installment' },
  { value: '5', label: '5 (0%)', th: '5 งวด (0%) รับรายได้หลังงวดที่ 3', en: '5 installments (0%) income after 3rd installment' },
  { value: '6', label: '6 (0%)', th: '6 งวด (0%) รับรายได้หลังงวดที่ 3', en: '6 installments (0%) income after 3rd installment' },
  { value: '8', label: '8 (4%)', th: '8 งวด (4%) รับรายได้หลังงวดที่ 3', en: '8 installments (4%) income after 3rd installment' },
  { value: '10', label: '10 (6%)', th: '10 งวด (6%) รับรายได้หลังงวดที่ 3', en: '10 installments (6%) income after 3rd installment' },
];

const DOWNPAYMENT_INSTALLMENT_OPTIONS = [
  { value: '6', label: '6 (0%)', th: '6 งวด (0%) รับรายได้หลังงวดที่ 2', en: '6 installments (0%) income after 2nd installment' },
  { value: '8', label: '8 (4%)', th: '8 งวด (4%) รับรายได้หลังงวดที่ 2', en: '8 installments (4%) income after 2nd installment' },
  { value: '10', label: '10 (6%)', th: '10 งวด (6%) รับรายได้หลังงวดที่ 2', en: '10 installments (6%) income after 2nd installment' },
];

function PackageBoxOnly({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const { logic } = useOpsLogic();
  const classMap: Record<string, { th: string; en: string }> = {
    Type1: { th: 'ชั้น 1', en: 'Type 1' },
    Type2: { th: 'ชั้น 2', en: 'Type 2' },
    Type3: { th: 'ชั้น 3', en: 'Type 3' },
    'Type2+': { th: 'ชั้น 2+', en: 'Type 2+' },
    'Type3+': { th: 'ชั้น 3+', en: 'Type 3+' },
  };
  const cls = classMap[logic.insuranceClass] ?? { th: logic.insuranceClass, en: logic.insuranceClass };
  const vmi = sale.policies.find(p => p.kind === 'vmi');
  const commission = vmi?.affiliateCommission || 0;
  const premium = vmi?.premiumAfterTax || 0;
  const sumInsured = vmi?.sumInsured || 0;
  const fmt = (n: number) => `${Math.round(n).toLocaleString()} Baht`;
  return (
    <div className="space-y-2">
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">{language === 'th' ? cls.th : cls.en}</p>
              <p className="text-xs text-muted-foreground">{language === 'th' ? 'ชื่อบริษัทประกัน' : 'Insurer Name'}</p>
            </div>
            <div className="w-10 h-10 border border-border rounded-sm bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img src={insurerLogo} alt="Insurer" className="w-full h-full object-contain p-1" loading="lazy" width={512} height={512} />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="grid grid-cols-[1fr_auto] items-start gap-3 py-1 border-b border-border/30">
              <span className="text-xs text-muted-foreground leading-tight">{language === 'th' ? 'ค่าคอมมิชชั่น' : 'Commission'}</span>
              <span className="text-xs font-medium text-right whitespace-nowrap tabular-nums min-w-[88px]">{fmt(commission)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-3 py-1 border-b border-border/30">
              <span className="text-xs text-muted-foreground leading-tight">{language === 'th' ? 'ราคาเบี้ยประกันรวม' : 'Total Premium'}</span>
              <span className="text-xs font-medium text-right whitespace-nowrap tabular-nums min-w-[88px]">{fmt(premium)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-3 py-1">
              <span className="text-xs text-muted-foreground leading-tight">{language === 'th' ? 'ทุนประกัน' : 'Sum Insured'}</span>
              <span className="text-xs font-medium text-right whitespace-nowrap tabular-nums min-w-[88px]">{fmt(sumInsured)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// PackageSelectionTab removed — superseded by PackageBoxOnly + Step1FormSection

export function ContentTabs({ sale }: ContentTabsProps) {
  const { language } = useLanguageStore();
  const {
    logic,
    phone,
    addCompulsory,
    coverageStartDate,
    coverageEndDate,
    compulsoryStartDate,
    compulsoryEndDate,
    voluntaryShippingFormat,
    compulsoryShippingFormat,
    fieldDocCounts,
    locked,
    setLocked,
  } = useOpsLogic();
  const [activeTab, setActiveTab] = React.useState('package-docs');
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set());
  const [step1Blockers, setStep1Blockers] = React.useState<string[]>([]);

  const tabOrder = ['package-docs', 'verify', 'process-payment'];

  // Step 1 validation: required basic-info fields + required-tier doc slots
  const validateStep1 = React.useCallback((): string[] => {
    const b: string[] = [];
    if (!coverageStartDate) b.push(language === 'th' ? 'วันเริ่มความคุ้มครอง (Voluntary)' : 'Voluntary start date');
    if (!phone || phone.length < 9) b.push(language === 'th' ? 'เบอร์โทรศัพท์ลูกค้า (10 หลัก)' : 'Customer phone (10 digits)');
    if (!logic.paymentMethodValue) b.push(language === 'th' ? 'วิธีการชำระเงิน' : 'Payment method');
    if (!voluntaryShippingFormat) b.push(language === 'th' ? 'รูปแบบการจัดส่ง (Voluntary)' : 'Voluntary shipping format');
    if (addCompulsory) {
      if (!compulsoryStartDate) b.push(language === 'th' ? 'วันเริ่มต้น พ.ร.บ.' : 'Compulsory start date');
      if (!compulsoryShippingFormat) b.push(language === 'th' ? 'รูปแบบการจัดส่ง พ.ร.บ.' : 'Compulsory shipping format');
    }
    // Required-tier doc slots: any required field in current scenario must have ≥1 doc
    const docs = getRequiredDocuments(
      logic.saleType, logic.insuranceClass, logic.paymentType, logic.carType,
      logic.customerType, logic.paymentMethodValue, logic.driverLicenseCount, logic.carInspectionMethod,
    );
    const missing = docs.filter(d => d.required && !(fieldDocCounts[d.fieldId] > 0));
    missing.slice(0, 8).forEach(m => {
      const def = DOCUMENT_FIELDS[m.fieldId];
      const label = def ? (language === 'th' ? def.th : def.en) : m.fieldId;
      b.push(`${language === 'th' ? 'เอกสาร' : 'Document'}: ${label}`);
    });
    if (missing.length > 8) b.push(`+${missing.length - 8} ${language === 'th' ? 'เอกสารอื่น' : 'more docs'}`);
    return b;
  }, [coverageStartDate, phone, logic, addCompulsory, compulsoryStartDate, voluntaryShippingFormat, compulsoryShippingFormat, fieldDocCounts, language]);

  // Live re-evaluation so the error list disappears as the user fixes things
  React.useEffect(() => {
    if (step1Blockers.length > 0) setStep1Blockers(validateStep1());
  }, [validateStep1, step1Blockers.length]);

  // Step gating (R-04): a step is unlocked only when every previous step is completed.
  const isTabUnlocked = React.useCallback((tabKey: string) => {
    const idx = tabOrder.indexOf(tabKey);
    if (idx <= 0) return true;
    for (let i = 0; i < idx; i++) {
      if (!completedSteps.has(tabOrder[i])) return false;
    }
    return true;
  }, [completedSteps]);

  const handleTabChange = (val: string) => {
    if (!isTabUnlocked(val)) {
      toast.error(language === 'th' ? 'ยังไม่ปลดล็อกขั้นตอนนี้' : 'Step not unlocked yet', {
        description: language === 'th'
          ? 'กรุณาทำขั้นตอนก่อนหน้าให้เสร็จก่อน'
          : 'Complete the previous step first.',
      });
      return;
    }
    setActiveTab(val);
  };

  const handleNext = (currentTab: string) => {
    if (currentTab === 'package-docs') {
      const b = validateStep1();
      setStep1Blockers(b);
      if (b.length > 0) {
        toast.error(language === 'th' ? 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ' : 'Please complete all required fields');
        return;
      }
    }
    if (currentTab === 'verify') {
      if (!verifyReady) {
        toast.error(language === 'th' ? 'กรุณาแก้ไขรายการที่ค้างก่อน' : 'Please resolve outstanding items');
        return;
      }
      // Step 2 completed → lock Steps 1 & 2 (Sale ID issued)
      setLocked(true);
      // Auto-advance VMI + CMI from "pending" → "pending_review"
      window.dispatchEvent(new Event('ops:step2Completed'));
    }
    setCompletedSteps(prev => new Set(prev).add(currentTab));
    const idx = tabOrder.indexOf(currentTab);
    if (idx < tabOrder.length - 1) {
      setActiveTab(tabOrder[idx + 1]);
    }
  };

  const handleBack = (currentTab: string) => {
    const idx = tabOrder.indexOf(currentTab);
    if (idx > 0) setActiveTab(tabOrder[idx - 1]);
  };


  const tabLabel = (key: string, thLabel: string, enLabel: string) => {
    const isLocked = !isTabUnlocked(key);
    return (
      <span className={cn('flex items-center gap-1', isLocked && 'opacity-50')}>
        {language === 'th' ? thLabel : enLabel}
      </span>
    );
  };

  const [sendToAgentOpen, setSendToAgentOpen] = React.useState(false);
  const [verifySendCount, setVerifySendCount] = React.useState(0);
  // Verify-tab readiness — driven by VerifyInformationTab's onReadinessChange
  const [verifyReady, setVerifyReady] = React.useState(false);
  const [verifyBlockers, setVerifyBlockers] = React.useState<string[]>([]);
  const handleVerifyReadiness = React.useCallback((ready: boolean, blockers: string[]) => {
    setVerifyReady(ready);
    setVerifyBlockers(blockers);
  }, []);


  const NextButton = ({ tabKey }: { tabKey: string }) => {
    const done = completedSteps.has(tabKey);
    const idx = tabOrder.indexOf(tabKey);
    const isLast = idx === tabOrder.length - 1;
    const showBack = idx > 0;
    return (
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        {showBack && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => handleBack(tabKey)}
          >
            {language === 'th' ? 'ย้อนกลับ' : 'Back'}
          </Button>
        )}
        {!isLast && (
          <Button
            size="sm"
            className="text-xs"
            disabled={done}
            onClick={() => handleNext(tabKey)}
          >
            {done
              ? (language === 'th' ? 'เสร็จสิ้น' : 'Completed')
              : (language === 'th' ? 'ถัดไป' : 'Next')}
          </Button>
        )}
      </div>
    );
  };

  const handleSendToAgent = () => {
    setSendToAgentOpen(false);
    setVerifySendCount((c) => c + 1);
    toast.success(language === 'th' ? 'ส่งข้อมูลให้ตัวแทนเรียบร้อย' : 'Information sent to agent successfully');
  };

  // Listen for top-bar Send Summary trigger
  React.useEffect(() => {
    const handler = () => setSendToAgentOpen(true);
    window.addEventListener('ops:openSendSummary', handler);
    return () => window.removeEventListener('ops:openSendSummary', handler);
  }, []);


  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-card border border-border rounded-lg p-1">
        <TabsTrigger value="package-docs" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <Package className="w-3.5 h-3.5" />
          {tabLabel('package-docs', 'ขั้นตอนที่ 1', 'Step 1')}
        </TabsTrigger>
        <TabsTrigger value="verify" disabled={!isTabUnlocked('verify')} className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          {tabLabel('verify', 'ขั้นตอนที่ 2', 'Step 2')}
        </TabsTrigger>
        <TabsTrigger value="process-payment" disabled={!isTabUnlocked('process-payment')} className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <CreditCard className="w-3.5 h-3.5" />
          {tabLabel('process-payment', 'ขั้นตอนที่ 3', 'Step 3')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="package-docs" className="mt-4 space-y-6">
        {locked && <LockedBanner language={language} />}
        <fieldset disabled={locked} className={cn('space-y-6', locked && 'opacity-80')}>
          <PackageBoxOnly sale={sale} />
          <LinkDocumentsTab sale={sale} />
        </fieldset>
        {step1Blockers.length > 0 && !locked && (
          <BlockerList
            title={language === 'th' ? 'ต้องแก้ไขก่อนไปขั้นตอนถัดไป' : 'Resolve before continuing'}
            items={step1Blockers}
          />
        )}
        <NextButton tabKey="package-docs" />
      </TabsContent>
      <TabsContent value="verify" className="mt-4 space-y-4">
        {locked && <LockedBanner language={language} />}
        <fieldset disabled={locked} className={cn('space-y-4', locked && 'opacity-80')}>
          <VerifyInformationTab sale={sale} onReadinessChange={handleVerifyReadiness} />
        </fieldset>
        {!verifyReady && verifyBlockers.length > 0 && !locked && (
          <BlockerList
            title={language === 'th' ? 'ต้องแก้ไขก่อนไปขั้นตอนถัดไป' : 'Resolve before continuing'}
            items={verifyBlockers}
          />
        )}
        <NextButton tabKey="verify" />
      </TabsContent>
      <TabsContent value="process-payment" className="mt-4 space-y-6">
        <ProcessPaymentTab sale={sale} />
        <InvoiceListTab sale={sale} />
        <NextButton tabKey="process-payment" />
      </TabsContent>

      {/* Send to Agent Modal */}
      <Dialog open={sendToAgentOpen} onOpenChange={setSendToAgentOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {language === 'th' ? 'ยืนยันข้อมูล' : 'Verify Information'}
            </DialogTitle>
          </DialogHeader>
          <div className="border border-border rounded-lg p-4 space-y-3 text-sm">
            {(() => {
              const customer = sale.customer;
              const vehicle = sale.vehicle;
              const dash = (v: unknown): string => {
                if (v === null || v === undefined) return '-';
                const s = String(v).trim();
                return s.length === 0 ? '-' : s;
              };
              const fmtDate = (iso: string): string => {
                if (!iso) return '-';
                const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
              };
              const vmi = sale.policies.find(p => p.kind === 'vmi') || sale.policies[0];
              const saleTypeLabel = (() => {
                const map: Record<string, { th: string; en: string }> = {
                  New: { th: 'งานใหม่', en: 'New' },
                  Renewable: { th: 'ต่ออายุ', en: 'Renewal' },
                  COA: { th: 'COA', en: 'COA' },
                };
                const m = map[logic.saleType];
                return m ? (language === 'th' ? m.th : m.en) : dash(logic.saleType);
              })();
              const customerTypeLabel = logic.customerType === 'corporation'
                ? (language === 'th' ? 'นิติบุคคล' : 'Corporation')
                : (language === 'th' ? 'บุคคลธรรมดา' : 'Individual');
              const garageLabel = logic.garageType
                ? (language === 'th' ? (logic.garageType === 'Dealership' ? 'ศูนย์' : 'อู่') : logic.garageType)
                : '-';
              const policyAddress = [customer.addressLine, customer.subDistrict, customer.district, customer.province, customer.postalCode]
                .filter(Boolean).join(' ');
              const shippingAddress = [sale.shipping.addressLine, sale.shipping.subDistrict, sale.shipping.district, sale.shipping.province, sale.shipping.postalCode]
                .filter(Boolean).join(' ');
              const insuredName = [customer.title, customer.firstName, customer.lastName].filter(Boolean).join(' ');
              const sumInsured = vmi?.sumInsured ? `${vmi.sumInsured.toLocaleString()} Baht` : '-';
              const deductible = vmi?.coverage?.deductible ? `${vmi.coverage.deductible.toLocaleString()} Baht` : '-';
              return [
                { label: language === 'th' ? 'รหัสตัวแทน' : 'Agent Code', value: dash(sale.agentCode) },
                { label: language === 'th' ? 'ประเภทงาน' : 'Type of Sale', value: saleTypeLabel },
                { label: language === 'th' ? 'ประเภทลูกค้า' : 'Customer Type', value: customerTypeLabel },
                { label: language === 'th' ? 'บริษัทประกัน' : 'Insurer Name', value: dash(vmi?.insurer) },
                { label: language === 'th' ? 'ชั้นประกัน' : 'Insurance Class', value: dash(logic.insuranceClass || vmi?.coverage?.insuranceClass) },
                { label: language === 'th' ? 'ดีดัคทิเบิ้ล' : 'Deductible', value: deductible },
                { label: language === 'th' ? 'ประเภทอู่' : 'Garage Type', value: garageLabel },
                { label: language === 'th' ? 'จำนวนผู้ขับขี่ระบุชื่อ' : 'Named Drivers', value: dash(logic.driverLicenseCount) },
                { label: language === 'th' ? 'เบอร์โทร' : 'Phone Number', value: dash(phone || customer.phoneNumber) },
                { label: language === 'th' ? 'ทะเบียนรถ' : 'Vehicle Number', value: dash(vehicle.licensePlate) },
                { label: language === 'th' ? 'รหัสรถ' : 'Vehicle Code', value: dash(vehicle.vehicleCode) },
                { label: language === 'th' ? 'ทุนประกัน' : 'Sum Insured', value: sumInsured },
                { label: language === 'th' ? 'วันเริ่มคุ้มครอง' : 'Coverage Start Date', value: fmtDate(coverageStartDate) },
                { label: language === 'th' ? 'วันสิ้นสุดคุ้มครอง' : 'Coverage End Date', value: fmtDate(coverageEndDate) },
                { label: language === 'th' ? 'ที่อยู่กรมธรรม์' : 'Address On Policy Schedule', value: dash(policyAddress) },
                { label: language === 'th' ? 'ที่อยู่จัดส่ง' : 'Delivery Address', value: dash(shippingAddress) },
                { label: language === 'th' ? 'ชื่อผู้เอาประกัน' : 'Insured Name', value: dash(insuredName) },
                { label: language === 'th' ? 'พ.ร.บ.' : 'Compulsory Insurance', value: addCompulsory ? (language === 'th' ? 'มี' : 'Yes') : (language === 'th' ? 'ไม่มี' : 'No') },
                ...(addCompulsory ? [
                  { label: language === 'th' ? 'วันเริ่ม พ.ร.บ.' : 'CMI Start Date', value: fmtDate(compulsoryStartDate) },
                  { label: language === 'th' ? 'วันสิ้นสุด พ.ร.บ.' : 'CMI End Date', value: fmtDate(compulsoryEndDate) },
                ] : []),
              ];
            })().map((row, i) => (
              <div key={i} className="flex justify-between py-1 gap-3">
                <span className="text-muted-foreground font-medium shrink-0">{row.label}:</span>
                <span className="text-right max-w-[55%]">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Button className="w-full" onClick={handleSendToAgent}>
              {language === 'th' ? 'ส่งให้ตัวแทน' : 'Send to Agent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
