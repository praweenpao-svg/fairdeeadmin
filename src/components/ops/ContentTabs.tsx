import React from 'react';
import sampleNationalId from '@/assets/sample-national-id.jpeg';
import sampleCarRegistration from '@/assets/sample-car-registration.jpg';
import samplePaymentProof from '@/assets/sample-payment-proof.png';
import mtiLogo from '@/assets/insurer-mti.png';
import { useLanguageStore } from '@/stores/languageStore';
import { SaleDetail } from '@/data/mockSaleDetail';
import { CoveragePanel } from './CoveragePanel';
import { PolicyDetailsZone } from './PolicyDetailsZone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Image, CreditCard, User, Package, Link2, Plus, X, RefreshCw, Upload, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ContentTabsProps {
  sale: SaleDetail;
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
                <span className="font-semibold">{policy.premiumAfterTax.toLocaleString()} ฿</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === 'th' ? 'คอมมิชชั่น' : 'Commission'}</span>
                <span className="font-medium text-primary">{policy.affiliateCommission.toLocaleString()} ฿</span>
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
                {sale.policies.reduce((s, p) => s + p.premiumAfterTax, 0).toLocaleString()} ฿
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

  const [categories, setCategories] = React.useState<DocCategory[]>([
    { key: 'car_reg', en: 'Car registration', th: 'ทะเบียนรถ', required: true, docs: [] },
    { key: 'national_id', en: 'National ID', th: 'บัตรประชาชน', required: true, docs: [] },
    { key: 'old_policy', en: 'Old policy document', th: 'เอกสารกรมธรรม์เดิม', docs: [] },
    { key: 'manual_quote', en: 'Manual quotation from insurer', th: 'ใบเสนอราคาจากบริษัทประกัน', docs: [] },
    { key: 'payment_proof', en: 'Payment proof to fairdee', th: 'หลักฐานการชำระเงินให้แฟร์ดี', docs: [] },
    { key: 'national_id_undertaking', en: 'National ID with undertaking', th: 'บัตรประชาชนพร้อมหนังสือมอบอำนาจ', docs: [] },
    { key: 'national_id_selfie', en: 'National ID with selfie', th: 'บัตรประชาชนพร้อมเซลฟี่', docs: [] },
    { key: 'general', en: 'General documents', th: 'เอกสารทั่วไป', docs: [] },
  ]);

  const [unlinkedDocs, setUnlinkedDocs] = React.useState<{ id: string; name: string; size?: string; preview?: string }[]>([]);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTarget, setUploadTarget] = React.useState<string | null>(null); // category key or null for unlinked

  const handleOpenUploadForCategory = (categoryKey: string) => {
    setUploadTarget(categoryKey);
    setUploadDialogOpen(true);
  };

  const handleOpenUploadForUnlinked = () => {
    setUploadTarget(null);
    setUploadDialogOpen(true);
  };

  const handleUploadFiles = (files: { id: string; name: string; size: string; type: string; preview?: string }[]) => {
    if (uploadTarget) {
      setCategories(prev => prev.map(cat =>
        cat.key === uploadTarget ? { ...cat, docs: [...cat.docs, ...files.map(f => ({ id: f.id, name: f.name, preview: f.preview, type: f.type }))] } : cat
      ));
    } else {
      setUnlinkedDocs(prev => [...prev, ...files.map(f => ({ id: f.id, name: f.name, size: f.size, preview: f.preview }))]);
    }
  };

  const handleRemoveDoc = (categoryKey: string, docId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.key === categoryKey ? { ...cat, docs: cat.docs.filter(d => d.id !== docId) } : cat
    ));
  };

  const handleRemoveUnlinked = (docId: string) => {
    setUnlinkedDocs(prev => prev.filter(d => d.id !== docId));
  };

  // Drag & drop from unlinked to category
  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData('text/plain', docId);
  };

  const handleDrop = (e: React.DragEvent, categoryKey: string) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData('text/plain');
    const doc = unlinkedDocs.find(d => d.id === docId);
    if (doc) {
      setCategories(prev => prev.map(cat =>
        cat.key === categoryKey ? { ...cat, docs: [...cat.docs, { id: doc.id, name: doc.name, preview: doc.preview }] } : cat
      ));
      setUnlinkedDocs(prev => prev.filter(d => d.id !== docId));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const uploadCategoryLabel = uploadTarget
    ? (language === 'th'
      ? categories.find(c => c.key === uploadTarget)?.th || ''
      : categories.find(c => c.key === uploadTarget)?.en || '')
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: document categories */}
      <div className="lg:col-span-3 space-y-2">
        {categories.map(cat => (
          <div
            key={cat.key}
            className="border border-border rounded-lg p-3 bg-card"
            onDrop={(e) => handleDrop(e, cat.key)}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium">
                  {language === 'th' ? cat.th : cat.en}
                  {cat.required && <span className="text-destructive ml-0.5">*</span>}
                </span>
                <p className="text-[10px] text-muted-foreground">{cat.docs.length} {language === 'th' ? 'เอกสาร' : 'Documents'}</p>
              </div>
              <button
                onClick={() => handleOpenUploadForCategory(cat.key)}
                className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            {cat.docs.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {cat.docs.map(doc => (
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
                    <button onClick={() => handleRemoveDoc(cat.key, doc.id)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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

      {/* Upload Dialog */}
      <UploadDocumentsDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        categoryLabel={uploadCategoryLabel}
        onUpload={handleUploadFiles}
      />
    </div>
  );
}

function VerifyInformationTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const customer = sale.customer;
  const vehicle = sale.vehicle;
  const shipping = sale.shipping;
  const [zoom, setZoom] = React.useState<Record<string, number>>({ national_id: 100, car_reg: 100, payment: 50 });

  const handleZoom = (key: string, delta: number) => {
    setZoom(prev => ({ ...prev, [key]: Math.max(25, Math.min(400, (prev[key] || 100) + delta)) }));
  };

  return (
    <div className="space-y-6">
      {/* Section 1: National ID */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b border-border">
            <span className="text-sm font-semibold">National ID</span>
          </div>
          <div className="grid grid-cols-3">
            {/* Left: Image viewer (1/3) */}
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
            {/* Right: Form fields (2/3) with 2-column grid */}
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
          <div className="px-4 py-2 border-b border-border">
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
          <div className="px-4 py-2 border-b border-border">
            <span className="text-sm font-semibold">{language === 'th' ? 'หลักฐานการชำระเงิน' : 'Payment proof to FairDee'}</span>
          </div>
          <div className="grid grid-cols-3">
            <div className="col-span-1 border-r border-border p-3 flex flex-col">
              <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center min-h-[240px]">
                <img
                  src={samplePaymentProof}
                  alt="Payment Proof"
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${(zoom.payment || 50) / 100})` }}
                />
              </div>
              <ImageZoomControls zoom={zoom.payment || 50} onZoom={(d) => handleZoom('payment', d)} />
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
            <VerifyField label={language === 'th' ? 'วันเริ่มต้นกรมธรรม์' : 'Policy Start Date (AD)*'} value="" source="" isDate />
            <VerifyField label={language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number*'} value={customer.phoneNumber} source="" />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h5 className="text-sm font-semibold mb-4">{language === 'th' ? 'ที่อยู่จัดส่ง' : 'Shipping Address'}</h5>
          <div className="flex items-center gap-2 mb-4">
            {[
              { value: 'policy_holder', en: 'Policy Holder', th: 'ผู้เอาประกันภัย' },
              { value: 'agent', en: 'Agent', th: 'ตัวแทน' },
              { value: 'e_policy', en: 'E-Policy', th: 'E-Policy' },
              { value: 'new_address', en: 'Add new address', th: 'เพิ่มที่อยู่ใหม่' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-0 cursor-pointer">
                <input type="radio" name="shipping_type" defaultChecked={shipping.receiverType === opt.value} className="peer sr-only" />
                <span className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-colors">
                  {language === 'th' ? opt.th : opt.en}
                </span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <VerifyField label={language === 'th' ? 'ชื่อผู้รับกรมธรรม์' : 'Policy Receiver Name*'} value={shipping.receiverName} source="National Id Saved" />
            <VerifyField label={language === 'th' ? 'ที่อยู่' : 'Address Line*'} value={shipping.addressLine} source="National Id Saved" />
            <VerifyField label={language === 'th' ? 'จังหวัด' : 'Province*'} value={shipping.province} source="National Id Saved" />
            <VerifyField label={language === 'th' ? 'เขต/อำเภอ' : 'District*'} value={shipping.district} source="National Id Saved" />
            <VerifyField label={language === 'th' ? 'แขวง/ตำบล' : 'Sub District*'} value={shipping.subDistrict} source="National Id Saved" />
            <VerifyField label={language === 'th' ? 'รหัสไปรษณีย์' : 'Postal Code*'} value={shipping.postalCode} source="National Id Saved" />
            <VerifyField label={language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number*'} value={shipping.phoneNumber} source="National Id Saved" />
          </div>
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

function VerifyField({ label, value, source, isDate, isSelect, options }: { label: string; value: string; source?: string; isDate?: boolean; isSelect?: boolean; options?: string[] }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        {source && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">ⓘ {source}</span>}
      </div>
      {isDate ? (
        <Input type="datetime-local" defaultValue={value} className="text-xs h-9 bg-card" />
      ) : isSelect && options ? (
        <Select defaultValue={value}>
          <SelectTrigger className="text-xs h-9 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input defaultValue={value} className="text-xs h-9 bg-card" placeholder={label} />
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

function PackageSelectionTab({ sale }: { sale: SaleDetail }) {
  const { language } = useLanguageStore();
  const vmiPolicy = sale.policies.find(p => p.kind === 'vmi');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [installmentPlan, setInstallmentPlan] = React.useState('');
  const [addCmi, setAddCmi] = React.useState('');
  const [customerType, setCustomerType] = React.useState<string>('');
  const [commercialVehicle, setCommercialVehicle] = React.useState('');
  const [kycMode, setKycMode] = React.useState('');

  const isInstallment = paymentMethod === 'bank_account_installment' || paymentMethod === 'qr_code_installment' || paymentMethod === 'credit_card_installment';
  const showKyc = paymentMethod === 'bank_account_installment' || paymentMethod === 'qr_code_installment';
  const installmentOptions = installmentPlan === 'downpayment' ? DOWNPAYMENT_INSTALLMENT_OPTIONS : EQUAL_INSTALLMENT_OPTIONS;

  return (
    <div className="space-y-6">
      {/* Selected Package Card */}
      <div className="space-y-2">
        <SectionLabel>{language === 'th' ? 'แพ็กเกจที่เลือก' : 'Select a package'}</SectionLabel>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{language === 'th' ? 'ชั้น 1 อีซี่' : 'Easy Type 1'}</p>
                <p className="text-xs text-muted-foreground">{language === 'th' ? 'เมืองไทยประกันภัย' : 'Muang Thai Insurance'}</p>
              </div>
              <img src={mtiLogo} alt="MTI" className="w-8 h-8 rounded object-cover" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ค่าคอมมิชชั่น' : 'Commission'}</span>
                <span className="font-semibold text-sidebar-background">2,000 ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ราคาเบี้ยประกันรวม' : 'Total Premium'}</span>
                <span className="font-semibold text-sidebar-background">10,000 ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'th' ? 'ทุนประกัน' : 'Sum Insured'}</span>
                <span className="font-semibold text-sidebar-background">500,000 ฿</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Customer Type */}
          <ToggleSelect
            label={language === 'th' ? 'ประเภทลูกค้า' : 'Customer Type'}
            options={[
              { value: 'individual', label: language === 'th' ? 'บุคคลธรรมดา' : 'Individual' },
              { value: 'corporation', label: language === 'th' ? 'บริษัท' : 'Corporation' },
            ]}
            value={customerType}
            onChange={setCustomerType}
          />

          {/* Commercial Vehicle */}
          <ToggleSelect
            label={language === 'th' ? 'สำหรับรถพาณิชย์' : 'For Commercial Vehicle'}
            options={[
              { value: 'yes', label: language === 'th' ? 'ใช่' : 'Yes' },
              { value: 'no', label: language === 'th' ? 'ไม่ใช่' : 'No' },
            ]}
            value={commercialVehicle}
            onChange={setCommercialVehicle}
          />

          {/* Add CMI */}
          <ToggleSelect
            label={language === 'th' ? 'ซื้อ พ.ร.บ. เพิ่ม?' : 'Add Compulsory Insurance?'}
            options={[
              { value: 'yes', label: language === 'th' ? 'ใช่' : 'Yes' },
              { value: 'no', label: language === 'th' ? 'ไม่ใช่' : 'No' },
            ]}
            value={addCmi}
            onChange={setAddCmi}
          />

          {/* CMI Start Date - only when CMI = yes */}
          {addCmi === 'yes' && (
            <div className="space-y-2">
              <SectionLabel>{language === 'th' ? 'วันเริ่มต้น พ.ร.บ.' : 'Compulsory Start Date'}</SectionLabel>
              <Input type="date" className="text-xs h-9 bg-card" />
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'วิธีการชำระเงิน' : 'Payment Method'} <span className="text-destructive">*</span></SectionLabel>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={language === 'th' ? 'เลือกวิธีชำระเงิน' : 'Select payment method'} />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(pm => (
                  <SelectItem key={pm.value} value={pm.value}>{language === 'th' ? pm.th : pm.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Code */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'รหัสรถ' : 'Vehicle Code'} <span className="text-destructive">*</span></SectionLabel>
            <Select>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={language === 'th' ? 'เลือกรหัสรถ' : 'Select vehicle code'} />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CODES.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add-Ons */}
          <div className="space-y-2">
            <SectionLabel>{language === 'th' ? 'ความคุ้มครองเพิ่มเติม' : 'Add-Ons'}</SectionLabel>
            <Select>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={language === 'th' ? 'เลือก Add-Ons' : 'Select Add-Ons'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{language === 'th' ? 'ไม่ติดตั้ง' : 'None'}</SelectItem>
                <SelectItem value="roadside">{language === 'th' ? 'ล้อแม็กซ์ สเกิร์ต ฝากระโปรง' : 'Alloy Wheels & Skirt'}</SelectItem>
                <SelectItem value="searchlight">{language === 'th' ? 'สเกิร์ตรอบคัน' : 'Full Body Kit'}</SelectItem>
                <SelectItem value="headlight">{language === 'th' ? 'ไฟหน้าแต่ง' : 'Custom Headlights'}</SelectItem>
                <SelectItem value="taillight">{language === 'th' ? 'ไฟท้ายแต่ง' : 'Custom Taillights'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right column: KYC + Installment (conditional) */}
        <div className="space-y-4">
          {showKyc && (
            <ToggleSelect
              label={language === 'th' ? 'ข้อมูล KYC' : 'KYC Information'}
              options={[
                { value: 'manual', label: 'Manual KYC' },
                { value: 'auto', label: 'Auto KYC' },
              ]}
              value={kycMode}
              onChange={setKycMode}
            />
          )}

          {isInstallment && (
            <div className="space-y-3">
              <ToggleSelect
                label={language === 'th' ? 'เลือกแผนผ่อนชำระ' : 'Installment Plan'}
                options={[
                  { value: 'equal', label: language === 'th' ? 'ผ่อนเท่ากัน' : 'Equal Installments' },
                  { value: 'downpayment', label: language === 'th' ? 'ดาวน์ 25%' : '25% Downpayment' },
                ]}
                value={installmentPlan}
                onChange={setInstallmentPlan}
              />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{language === 'th' ? 'จำนวนงวด' : 'No. of Installments'}</p>
                <Select>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder={language === 'th' ? 'เลือกจำนวนงวด' : 'Select installments'} />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{language === 'th' ? opt.th : opt.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContentTabs({ sale }: ContentTabsProps) {
  const { language } = useLanguageStore();

  return (
    <Tabs defaultValue="package" className="w-full">
      <TabsList className="w-full justify-start bg-card border border-border rounded-lg p-1">
        <TabsTrigger value="package" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <Package className="w-3.5 h-3.5" />
          {language === 'th' ? 'เลือกแพ็กเกจ' : 'Package Selection'}
        </TabsTrigger>
        <TabsTrigger value="link-docs" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <Link2 className="w-3.5 h-3.5" />
          {language === 'th' ? 'เชื่อมโยงเอกสาร' : 'Link Documents'}
        </TabsTrigger>
        <TabsTrigger value="verify" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          {language === 'th' ? 'ตรวจสอบข้อมูล' : 'Verify Information'}
        </TabsTrigger>
        <TabsTrigger value="details" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <User className="w-3.5 h-3.5" />
          {language === 'th' ? 'ข้อมูลลูกค้าและรถ' : 'Customer & Vehicle'}
        </TabsTrigger>
        <TabsTrigger value="invoice" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <CreditCard className="w-3.5 h-3.5" />
          {language === 'th' ? 'ใบแจ้งหนี้และชำระเงิน' : 'Invoice & Payments'}
        </TabsTrigger>
        <TabsTrigger value="documents" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <FileText className="w-3.5 h-3.5" />
          {language === 'th' ? 'เอกสาร' : 'Documents'}
        </TabsTrigger>
        <TabsTrigger value="benefits" className="text-xs gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <Image className="w-3.5 h-3.5" />
          {language === 'th' ? 'สิทธิประโยชน์กรมธรรม์' : 'Policy Benefits'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="package" className="mt-4">
        <PackageSelectionTab sale={sale} />
      </TabsContent>
      <TabsContent value="link-docs" className="mt-4">
        <LinkDocumentsTab sale={sale} />
      </TabsContent>
      <TabsContent value="verify" className="mt-4">
        <VerifyInformationTab sale={sale} />
      </TabsContent>
      <TabsContent value="details" className="mt-4">
        <PolicyDetailsZone sale={sale} />
      </TabsContent>
      <TabsContent value="invoice" className="mt-4">
        <InvoiceTab sale={sale} />
      </TabsContent>
      <TabsContent value="documents" className="mt-4">
        <DocumentsTab sale={sale} />
      </TabsContent>
      <TabsContent value="benefits" className="mt-4">
        <PolicyBenefitsTab sale={sale} />
      </TabsContent>
    </Tabs>
  );
}
