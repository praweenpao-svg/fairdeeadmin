import { useMemo, useState } from 'react';
import { FileStack, Layers, History, Search, Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  mockDocLibrary,
  mockMatrixRules,
  mockAuditLog,
  type DocTier,
  type SaleType,
  type InsuranceClass,
  type PaymentType,
  type CarType,
} from '@/data/mockDocumentMatrix';

const tierColor: Record<DocTier, string> = {
  'Required Base': 'bg-red-100 text-red-700 border-red-200',
  'Conditional': 'bg-amber-100 text-amber-700 border-amber-200',
  'Sale-Type Specific': 'bg-blue-100 text-blue-700 border-blue-200',
  'Optional': 'bg-slate-100 text-slate-600 border-slate-200',
};

const actionColor: Record<string, string> = {
  Added: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Removed: 'bg-red-100 text-red-700 border-red-200',
  Updated: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function DocumentMatrix() {
  // Library tab state
  const [libSearch, setLibSearch] = useState('');
  const [libCategory, setLibCategory] = useState<string>('all');
  const filteredLib = useMemo(() => mockDocLibrary.filter(d => {
    const q = libSearch.toLowerCase();
    const matchQ = !q || d.name_en.toLowerCase().includes(q) || d.name_th.includes(libSearch);
    const matchC = libCategory === 'all' || d.category === libCategory;
    return matchQ && matchC;
  }), [libSearch, libCategory]);

  // Rules tab state — scenario simulator
  const [saleType, setSaleType] = useState<SaleType>('New');
  const [insClass, setInsClass] = useState<InsuranceClass>('Type1');
  const [payment, setPayment] = useState<PaymentType>('Full');
  const [carType, setCarType] = useState<CarType>('Normally');
  const [showInactive, setShowInactive] = useState(false);

  const docById = useMemo(() => Object.fromEntries(mockDocLibrary.map(d => [d.id, d])), []);

  const matchingRules = useMemo(() => mockMatrixRules.filter(r =>
    r.sale_type === saleType &&
    r.insurance_class === insClass &&
    r.payment_type === payment &&
    r.car_type === carType &&
    (showInactive || r.is_active)
  ), [saleType, insClass, payment, carType, showInactive]);

  const requiredCount = matchingRules.filter(r => r.is_active && r.tier !== 'Optional').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <FileStack className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Document Matrix Console</h1>
            <p className="text-xs text-muted-foreground">Schema visualization — Library, Rules & Audit Log</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-5">
        <Tabs defaultValue="rules" className="w-full">
          <TabsList>
            <TabsTrigger value="library" className="gap-2"><FileStack className="w-4 h-4" />Document Library <Badge variant="secondary" className="ml-1">{mockDocLibrary.length}</Badge></TabsTrigger>
            <TabsTrigger value="rules" className="gap-2"><Layers className="w-4 h-4" />Matrix Rules <Badge variant="secondary" className="ml-1">{mockMatrixRules.length}</Badge></TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><History className="w-4 h-4" />Audit Log <Badge variant="secondary" className="ml-1">{mockAuditLog.length}</Badge></TabsTrigger>
          </TabsList>

          {/* ---------------- LIBRARY ---------------- */}
          <TabsContent value="library" className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input value={libSearch} onChange={(e) => setLibSearch(e.target.value)} placeholder="Search by EN / TH name..." className="pl-8" />
              </div>
              <Select value={libCategory} onValueChange={setLibCategory}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {['A','B','C','D','E','F','G'].map(c => <SelectItem key={c} value={c}>Category {c}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">{filteredLib.length} of {mockDocLibrary.length}</span>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12">ID</TableHead>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (TH)</TableHead>
                    <TableHead className="w-24">Cat.</TableHead>
                    <TableHead className="w-44">Default Tier</TableHead>
                    <TableHead>Default Condition</TableHead>
                    <TableHead className="w-24">Active</TableHead>
                    <TableHead className="w-36">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLib.map(d => (
                    <TableRow key={d.id} className={!d.is_active ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.name_en}</TableCell>
                      <TableCell className="text-muted-foreground">{d.name_th}</TableCell>
                      <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={tierColor[d.default_tier]}>{d.default_tier}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.default_condition_note}</TableCell>
                      <TableCell>{d.is_active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.updated_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ---------------- RULES (Scenario Simulator) ---------------- */}
          <TabsContent value="rules" className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium mb-3">Scenario Simulator — pick a combination, see required documents</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <FilterField label="Sale Type" value={saleType} onChange={(v) => setSaleType(v as SaleType)} options={['New','Renew','COA']} />
                <FilterField label="Insurance Class" value={insClass} onChange={(v) => setInsClass(v as InsuranceClass)} options={['Type1','Type2','Type2Plus','Type3','Type3Plus']} />
                <FilterField label="Payment Type" value={payment} onChange={(v) => setPayment(v as PaymentType)} options={['Full','Instalment']} />
                <FilterField label="Car Type" value={carType} onChange={(v) => setCarType(v as CarType)} options={['Normally','EV','High Sum']} />
                <div className="flex flex-col">
                  <label className="text-xs text-muted-foreground mb-1">Visibility</label>
                  <button
                    onClick={() => setShowInactive(s => !s)}
                    className="h-9 px-3 rounded-md border border-border text-xs flex items-center justify-center gap-1.5 hover:bg-accent"
                  >
                    {showInactive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showInactive ? 'Hide inactive' : 'Show inactive'}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">Result:</span>
                <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">{matchingRules.length} matching rules</Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{requiredCount} required documents</Badge>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-16">Rule ID</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead className="w-20">Cat.</TableHead>
                    <TableHead className="w-44">Tier</TableHead>
                    <TableHead>Condition Note</TableHead>
                    <TableHead className="w-20 text-center">Min #</TableHead>
                    <TableHead className="w-24">Active</TableHead>
                    <TableHead className="w-44">Updated By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchingRules.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No rules match this scenario.</TableCell></TableRow>
                  )}
                  {matchingRules.map(r => {
                    const doc = docById[r.document_id];
                    return (
                      <TableRow key={r.id} className={!r.is_active ? 'opacity-50' : ''}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{doc?.name_en}</div>
                          <div className="text-xs text-muted-foreground">{doc?.name_th}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{doc?.category}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={tierColor[r.tier]}>{r.tier}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.condition_note}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{r.min_count}</TableCell>
                        <TableCell>{r.is_active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}</TableCell>
                        <TableCell className="text-xs">
                          <div className="text-foreground">{r.updated_by}</div>
                          <div className="text-muted-foreground">{r.updated_at}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="text-xs text-muted-foreground px-1">
              Schema dimensions: <code>sale_type × insurance_class × payment_type × car_type</code> = up to{' '}
              <strong>3 × 5 × 2 × 3 = 90</strong> scenarios per document.
            </div>
          </TabsContent>

          {/* ---------------- AUDIT ---------------- */}
          <TabsContent value="audit" className="mt-4 space-y-3">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="w-24">Rule ID</TableHead>
                    <TableHead className="w-28">Action</TableHead>
                    <TableHead className="w-40">Field Changed</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead className="w-48">Actor</TableHead>
                    <TableHead className="w-40">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...mockAuditLog].sort((a,b) => b.created_at.localeCompare(a.created_at)).map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell className="font-mono text-xs">#{log.matrix_rule_id}</TableCell>
                      <TableCell><Badge variant="outline" className={actionColor[log.action]}>{log.action}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{log.field_changed}</TableCell>
                      <TableCell className="text-xs text-muted-foreground line-through">{log.old_value}</TableCell>
                      <TableCell className="text-xs">{log.new_value}</TableCell>
                      <TableCell className="text-xs">{log.actor_email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FilterField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
