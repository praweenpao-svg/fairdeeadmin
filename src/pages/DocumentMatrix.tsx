import { useEffect, useMemo, useState } from 'react';
import { FileStack, History, Search, Pencil, Plus, X, Library, ChevronDown, ChevronRight, Shield, ShieldCheck, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { TablePagination } from '@/components/ui/table-pagination';
import { toast } from '@/hooks/use-toast';
import {
  mockDocLibrary,
  mockMatrixRules,
  mockAuditLog,
  mockInsurers,
  type DocTier,
  type SaleType,
  type InsuranceClass,
  type PaymentType,
  type CarType,
  type DocMatrixRule,
  type DocLibraryRow,
  type SumInsuredOp,
} from '@/data/mockDocumentMatrix';

const SUM_OPS: SumInsuredOp[] = ['<', '<=', '=', '>=', '>'];
const formatThb = (n: number) => new Intl.NumberFormat('en-US').format(n);
const insurerName = (id: string) => mockInsurers.find(i => i.id === id)?.name ?? id;

function ConditionChips({ rule }: { rule: DocMatrixRule }) {
  const hasInsurers = rule.insurer_ids && rule.insurer_ids.length > 0;
  const hasSI = rule.sum_insured_op && rule.sum_insured_value != null;
  if (!hasInsurers && !hasSI) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {hasInsurers && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-normal">
          Insurer: {rule.insurer_ids!.map(insurerName).join(', ')}
        </Badge>
      )}
      {hasSI && (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-normal">
          Sum insured {rule.sum_insured_op} {formatThb(rule.sum_insured_value!)} Baht
        </Badge>
      )}
    </div>
  );
}

type UITier = 'Required' | 'Conditional' | 'Optional';
const normalizeTier = (t: DocTier): UITier => {
  if (t === 'Required Base') return 'Required';
  if (t === 'Sale-Type Specific') return 'Conditional';
  if (t === 'Conditional') return 'Conditional';
  return 'Optional';
};

const tierColor: Record<UITier, string> = {
  Required: 'bg-red-100 text-red-700 border-red-200',
  Conditional: 'bg-amber-100 text-amber-700 border-amber-200',
  Optional: 'bg-slate-100 text-slate-600 border-slate-200',
};

const actionColor: Record<string, string> = {
  Added: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Removed: 'bg-red-100 text-red-700 border-red-200',
  Updated: 'bg-blue-100 text-blue-700 border-blue-200',
};

const SALE_TYPES: SaleType[] = ['New', 'Renew', 'COA'];
const CLASSES: InsuranceClass[] = ['Type1', 'Type2', 'Type2Plus', 'Type3', 'Type3Plus'];
const CLASS_LABEL: Record<InsuranceClass, string> = { Type1: 'Type 1', Type2: 'Type 2', Type2Plus: 'Type 2+', Type3: 'Type 3', Type3Plus: 'Type 3+' };
const PAYMENTS: PaymentType[] = ['Full', 'Instalment'];
const CAR_TYPES: CarType[] = ['Normally', 'EV', 'High Sum'];

interface Combination {
  sale_type: SaleType;
  insurance_class: InsuranceClass;
  payment_type: PaymentType;
  car_type: CarType;
}

const allCombinations: Combination[] = (() => {
  const out: Combination[] = [];
  for (const s of SALE_TYPES) for (const c of CLASSES) for (const p of PAYMENTS) for (const ct of CAR_TYPES) {
    out.push({ sale_type: s, insurance_class: c, payment_type: p, car_type: ct });
  }
  return out;
})();

export default function DocumentMatrix() {
  const [role, setRole] = useState<'super_admin' | 'admin'>('super_admin');
  const isSuperAdmin = role === 'super_admin';

  // Local mutable copies (so edits in library reflect everywhere)
  const [library, setLibrary] = useState<DocLibraryRow[]>(mockDocLibrary);
  const [rules, setRules] = useState<DocMatrixRule[]>(mockMatrixRules);

  // Multi-select filters
  const [fSale, setFSale] = useState<string[]>([]);
  const [fClass, setFClass] = useState<string[]>([]);
  const [fPayment, setFPayment] = useState<string[]>([]);
  const [fCar, setFCar] = useState<string[]>([]);

  // View toggle
  const [view, setView] = useState<'flat' | 'grouped'>('flat');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Combination | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const docById = useMemo(() => Object.fromEntries(library.map(d => [d.id, d])), [library]);

  const matchAll = (sel: string[], v: string) => sel.length === 0 || sel.includes(v);

  const filteredCombos = useMemo(() => allCombinations.filter(c =>
    matchAll(fSale, c.sale_type) &&
    matchAll(fClass, c.insurance_class) &&
    matchAll(fPayment, c.payment_type) &&
    matchAll(fCar, c.car_type)
  ), [fSale, fClass, fPayment, fCar]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [fSale, fClass, fPayment, fCar, view, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredCombos.length / rowsPerPage));
  const pagedCombos = view === 'flat'
    ? filteredCombos.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    : filteredCombos;

  const rulesFor = (c: Combination) => rules.filter(r =>
    r.is_active &&
    r.sale_type === c.sale_type &&
    r.insurance_class === c.insurance_class &&
    r.payment_type === c.payment_type &&
    r.car_type === c.car_type
  );

  const comboKey = (c: Combination) => `${c.sale_type}-${c.insurance_class}-${c.payment_type}-${c.car_type}`;

  // Audit filters
  const [auditAction, setAuditAction] = useState<string>('all');
  const [auditActor, setAuditActor] = useState<string>('all');
  const [auditField, setAuditField] = useState<string>('all');
  const auditActors = useMemo(() => Array.from(new Set(mockAuditLog.map(a => a.actor_email))), []);
  const auditFields = useMemo(() => Array.from(new Set(mockAuditLog.map(a => a.field_changed))), []);
  const filteredAudit = useMemo(() => mockAuditLog.filter(a =>
    (auditAction === 'all' || a.action === auditAction) &&
    (auditActor === 'all' || a.actor_email === auditActor) &&
    (auditField === 'all' || a.field_changed === auditField)
  ).sort((a, b) => b.created_at.localeCompare(a.created_at)), [auditAction, auditActor, auditField]);

  // Saving from edit modal
  const handleSaveScenario = (combo: Combination, nextRules: DocMatrixRule[]) => {
    setRules(prev => {
      const others = prev.filter(r => !(r.sale_type === combo.sale_type && r.insurance_class === combo.insurance_class && r.payment_type === combo.payment_type && r.car_type === combo.car_type));
      return [...others, ...nextRules];
    });
    toast({ title: 'Scenario updated', description: `${combo.sale_type} · ${CLASS_LABEL[combo.insurance_class]} · ${combo.payment_type} · ${combo.car_type}` });
  };

  // Library mutations
  const usageCount = (docId: number) => rules.filter(r => r.document_id === docId && r.is_active).length;
  const handleEditDoc = (id: number, patch: Partial<DocLibraryRow>) => {
    setLibrary(prev => prev.map(d => d.id === id ? { ...d, ...patch, updated_at: new Date().toISOString().slice(0, 16).replace('T', ' ') } : d));
  };
  const handleToggleActive = (doc: DocLibraryRow) => {
    if (doc.is_active && usageCount(doc.id) > 0) {
      toast({ title: 'Cannot deactivate', description: `${doc.name_en} is referenced by ${usageCount(doc.id)} active matrix rule(s). Remove it from those scenarios first.`, variant: 'destructive' });
      return;
    }
    handleEditDoc(doc.id, { is_active: !doc.is_active });
  };
  const handleAddDoc = (row: Omit<DocLibraryRow, 'id' | 'created_at' | 'updated_at'>) => {
    const dup = library.find(d => d.name_en.toLowerCase() === row.name_en.toLowerCase().trim() || d.name_th === row.name_th.trim());
    if (dup) return 'Document with this name already exists';
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setLibrary(prev => [...prev, { ...row, id: Math.max(...prev.map(d => d.id)) + 1, created_at: now, updated_at: now }]);
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileStack className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Document Matrix</h1>
              <p className="text-xs text-muted-foreground">Admin Portal · IR Settings · Document Matrix</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted/40">
              <button onClick={() => setRole('super_admin')} className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 ${isSuperAdmin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'}`}>
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
              </button>
              <button onClick={() => setRole('admin')} className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 ${!isSuperAdmin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'}`}>
                <Shield className="w-3.5 h-3.5" /> Admin
              </button>
            </div>
            {isSuperAdmin && (
              <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)} className="gap-1.5">
                <Library className="w-4 h-4" /> Manage Library
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 py-5">
        <Tabs defaultValue="matrix" className="w-full">
          <TabsList>
            <TabsTrigger value="matrix" className="gap-2"><FileStack className="w-4 h-4" />Matrix <Badge variant="secondary" className="ml-1">{allCombinations.length}</Badge></TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><History className="w-4 h-4" />Audit Log <Badge variant="secondary" className="ml-1">{mockAuditLog.length}</Badge></TabsTrigger>
          </TabsList>

          {/* ---------------- MATRIX ---------------- */}
          <TabsContent value="matrix" className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MultiSelectFilter label="Sale Type" selected={fSale} onChange={setFSale} options={SALE_TYPES.map(s => ({ v: s, l: s }))} />
                <MultiSelectFilter label="Class" selected={fClass} onChange={setFClass} options={CLASSES.map(c => ({ v: c, l: CLASS_LABEL[c] }))} />
                <MultiSelectFilter label="Payment Type" selected={fPayment} onChange={setFPayment} options={PAYMENTS.map(p => ({ v: p, l: p }))} />
                <MultiSelectFilter label="Car Type" selected={fCar} onChange={setFCar} options={CAR_TYPES.map(c => ({ v: c, l: c }))} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Showing</span>
                  <Badge variant="outline">{filteredCombos.length} of {allCombinations.length} scenarios</Badge>
                  {(fSale.length + fClass.length + fPayment.length + fCar.length) > 0 && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setFSale([]); setFClass([]); setFPayment([]); setFCar([]); }}>Clear filters</Button>
                  )}
                </div>
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted/40">
                  <button onClick={() => setView('flat')} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${view === 'flat' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><List className="w-3.5 h-3.5" /> Flat</button>
                  <button onClick={() => setView('grouped')} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${view === 'grouped' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" /> Group by Sale Type</button>
                </div>
              </div>
            </div>

            {/* Matrix table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Sale Type</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Car Type</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Conditional</TableHead>
                    <TableHead className="text-center">Optional</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Last Updated By</TableHead>
                    {isSuperAdmin && <TableHead className="text-right w-24">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view === 'grouped'
                    ? SALE_TYPES.flatMap(st => {
                        const inGroup = filteredCombos.filter(c => c.sale_type === st);
                        if (inGroup.length === 0) return [];
                        const isOpen = openGroups[st] ?? true;
                        return [
                          <TableRow key={`g-${st}`} className="bg-muted/30 hover:bg-muted/30 cursor-pointer" onClick={() => setOpenGroups(p => ({ ...p, [st]: !isOpen }))}>
                            <TableCell colSpan={isSuperAdmin ? 11 : 10} className="font-semibold text-sm py-2">
                              <span className="inline-flex items-center gap-2">
                                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                {st}
                                <Badge variant="outline" className="ml-1">{inGroup.length}</Badge>
                              </span>
                            </TableCell>
                          </TableRow>,
                          ...(isOpen ? inGroup.map(c => renderRow(c, expanded, setExpanded, rulesFor, comboKey, isSuperAdmin, setEditing, docById)) : []),
                        ];
                      })
                    : pagedCombos.map(c => renderRow(c, expanded, setExpanded, rulesFor, comboKey, isSuperAdmin, setEditing, docById))}
                  {filteredCombos.length === 0 && (
                    <TableRow><TableCell colSpan={isSuperAdmin ? 11 : 10} className="text-center text-sm text-muted-foreground py-8">No scenarios match the filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {view === 'flat' && filteredCombos.length > 0 && (
                <TablePagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={filteredCombos.length}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setPage}
                  onRowsPerPageChange={setRowsPerPage}
                />
              )}
            </div>

            <div className="text-xs text-muted-foreground px-1">
              Schema dimensions: <code>sale_type × class × payment_type × car_type</code> = <strong>3 × 5 × 2 × 3 = 90</strong> scenarios.
            </div>
          </TabsContent>

          {/* ---------------- AUDIT ---------------- */}
          <TabsContent value="audit" className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Action</label>
                <Select value={auditAction} onValueChange={setAuditAction}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {['Added', 'Updated', 'Removed'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Actor</label>
                <Select value={auditActor} onValueChange={setAuditActor}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {auditActors.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Field Changed</label>
                <Select value={auditField} onValueChange={setAuditField}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {auditFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={() => { setAuditAction('all'); setAuditActor('all'); setAuditField('all'); }}>Clear filters</Button>
              </div>
            </div>

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
                  {filteredAudit.map(log => (
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
                  {filteredAudit.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No audit entries match the filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditScenarioModal
        combination={editing}
        onClose={() => setEditing(null)}
        rules={editing ? rulesFor(editing) : []}
        docById={docById}
        library={library}
        onSave={handleSaveScenario}
      />

      <ManageLibrarySheet
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        library={library}
        usageCount={usageCount}
        onEditDoc={handleEditDoc}
        onToggleActive={handleToggleActive}
        onAddDoc={handleAddDoc}
      />
    </div>
  );
}

function renderRow(
  c: Combination,
  expanded: string | null,
  setExpanded: (k: string | null) => void,
  rulesFor: (c: Combination) => DocMatrixRule[],
  comboKey: (c: Combination) => string,
  isSuperAdmin: boolean,
  setEditing: (c: Combination) => void,
  docById: Record<number, DocLibraryRow>,
) {
  const key = comboKey(c);
  const rs = rulesFor(c);
  const counts = { Required: 0, Conditional: 0, Optional: 0 } as Record<UITier, number>;
  rs.forEach(r => counts[normalizeTier(r.tier)]++);
  const lastUpdated = rs.length ? rs.map(r => r.updated_at).sort().slice(-1)[0] : '—';
  const lastBy = rs.length ? rs.find(r => r.updated_at === lastUpdated)?.updated_by ?? '—' : '—';
  const isOpen = expanded === key;
  return (
    <>
      <TableRow key={key} className="cursor-pointer hover:bg-muted/40" onClick={() => setExpanded(isOpen ? null : key)}>
        <TableCell className="text-muted-foreground">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
        <TableCell className="font-medium">{c.sale_type}</TableCell>
        <TableCell>{CLASS_LABEL[c.insurance_class]}</TableCell>
        <TableCell>{c.payment_type}</TableCell>
        <TableCell>{c.car_type}</TableCell>
        <TableCell className="text-center"><Badge variant="outline" className={tierColor.Required}>{counts.Required}</Badge></TableCell>
        <TableCell className="text-center"><Badge variant="outline" className={tierColor.Conditional}>{counts.Conditional}</Badge></TableCell>
        <TableCell className="text-center"><Badge variant="outline" className={tierColor.Optional}>{counts.Optional}</Badge></TableCell>
        <TableCell className="text-xs text-muted-foreground">{lastUpdated}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{lastBy}</TableCell>
        {isSuperAdmin && (
          <TableCell className="text-right">
            <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={(e) => { e.stopPropagation(); setEditing(c); }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </TableCell>
        )}
      </TableRow>
      {isOpen && (
        <TableRow key={key + '-exp'} className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={isSuperAdmin ? 11 : 10} className="p-4">
            <ExpandedRowDetail rules={rs} docById={docById} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function MultiSelectFilter({ label, selected, onChange, options }: { label: string; selected: string[]; onChange: (v: string[]) => void; options: { v: string; l: string }[] }) {
  const summary = selected.length === 0 ? 'All' : selected.length === 1 ? options.find(o => o.v === selected[0])?.l : `${selected.length} selected`;
  return (
    <div className="flex flex-col">
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 justify-between font-normal">
            <span className="truncate">{summary}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          <div className="space-y-1">
            {options.map(o => {
              const isOn = selected.includes(o.v);
              return (
                <label key={o.v} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                  <Checkbox checked={isOn} onCheckedChange={(checked) => onChange(checked ? [...selected, o.v] : selected.filter(s => s !== o.v))} />
                  <span className="text-sm">{o.l}</span>
                </label>
              );
            })}
            {selected.length > 0 && (
              <div className="pt-1 border-t border-border mt-1">
                <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={() => onChange([])}>Clear</Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ExpandedRowDetail({ rules, docById }: { rules: DocMatrixRule[]; docById: Record<number, DocLibraryRow> }) {
  const tiers: UITier[] = ['Required', 'Conditional', 'Optional'];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {tiers.map(tier => {
        const items = rules.filter(r => normalizeTier(r.tier) === tier);
        return (
          <div key={tier} className="rounded-md border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className={tierColor[tier]}>{tier}</Badge>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents.</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map(r => {
                  const d = docById[r.document_id];
                  return (
                    <li key={r.id} className="text-xs">
                      <div className="font-medium">{d?.name_en}</div>
                      <div className="text-muted-foreground">{d?.name_th}</div>
                      {r.condition_note && <div className="text-[11px] text-muted-foreground italic mt-0.5">{r.condition_note}{r.min_count > 1 && ` · min ${r.min_count}`}</div>}
                      <ConditionChips rule={r} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditScenarioModal({ combination, onClose, rules, docById, library, onSave }: { combination: Combination | null; onClose: () => void; rules: DocMatrixRule[]; docById: Record<number, DocLibraryRow>; library: DocLibraryRow[]; onSave: (c: Combination, r: DocMatrixRule[]) => void }) {
  const [staged, setStaged] = useState<DocMatrixRule[]>([]);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [addingTier, setAddingTier] = useState<UITier | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => { setStaged(rules); setRemoved(new Set()); setAddingTier(null); setErrors([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [combination?.sale_type, combination?.insurance_class, combination?.payment_type, combination?.car_type]);

  if (!combination) return null;

  const tiers: UITier[] = ['Required', 'Conditional', 'Optional'];
  const visible = staged.filter(r => !removed.has(r.id));

  const updateRule = (id: number, patch: Partial<DocMatrixRule>) => {
    setStaged(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const addDoc = (docId: number, tier: UITier) => {
    const d = docById[docId];
    const newRule: DocMatrixRule = {
      id: -Math.floor(Math.random() * 100000),
      sale_type: combination.sale_type,
      insurance_class: combination.insurance_class,
      payment_type: combination.payment_type,
      car_type: combination.car_type,
      document_id: docId,
      tier: tier as DocTier,
      condition_note: d?.default_condition_note ?? '',
      min_count: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
      created_by: 'you@fairdee.com',
      updated_by: 'you@fairdee.com',
    };
    setStaged(prev => [...prev, newRule]);
    setAddingTier(null);
  };

  const availableDocs = library.filter(d => d.is_active);

  const ruleScopeKey = (r: DocMatrixRule) => {
    const ins = (r.insurer_ids ?? []).slice().sort().join(',');
    const si = r.sum_insured_op && r.sum_insured_value != null ? `${r.sum_insured_op}${r.sum_insured_value}` : '';
    return `${r.document_id}|${ins}|${si}`;
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    // Duplicate doc with identical scope (same insurers + same SI threshold) is invalid.
    const seen = new Map<string, number>();
    visible.forEach(r => {
      const k = ruleScopeKey(r);
      seen.set(k, (seen.get(k) ?? 0) + 1);
    });
    seen.forEach((count, k) => {
      if (count > 1) {
        const docId = Number(k.split('|')[0]);
        errs.push(`"${docById[docId]?.name_en}" has duplicate rules with the same insurer/sum-insured scope. Differentiate them or remove duplicates.`);
      }
    });
    visible.forEach(r => {
      if (!Number.isFinite(r.min_count) || r.min_count < 1) errs.push(`"${docById[r.document_id]?.name_en}" has invalid min_count (must be ≥ 1).`);
      if (normalizeTier(r.tier) === 'Conditional' && !r.condition_note.trim()) {
        errs.push(`"${docById[r.document_id]?.name_en}" is Conditional but has no condition note.`);
      }
      // SI op + value must be paired
      const opSet = !!r.sum_insured_op;
      const valSet = r.sum_insured_value != null && !Number.isNaN(r.sum_insured_value);
      if (opSet !== valSet) {
        errs.push(`"${docById[r.document_id]?.name_en}" sum-insured condition is incomplete (operator and value must both be set).`);
      }
      if (valSet && (r.sum_insured_value as number) < 0) {
        errs.push(`"${docById[r.document_id]?.name_en}" sum-insured value must be ≥ 0.`);
      }
    });
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    onSave(combination, visible);
    onClose();
  };

  return (
    <Dialog open={!!combination} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Document Requirements</DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{combination.sale_type}</Badge>
            <Badge variant="outline">{CLASS_LABEL[combination.insurance_class]}</Badge>
            <Badge variant="outline">{combination.payment_type}</Badge>
            <Badge variant="outline">{combination.car_type}</Badge>
          </div>
        </DialogHeader>

        {errors.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-destructive"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{e}</span></div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {tiers.map(tier => {
            const items = visible.filter(r => normalizeTier(r.tier) === tier);
            return (
              <div key={tier} className="rounded-lg border border-border">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
                  <Badge variant="outline" className={tierColor[tier]}>{tier}</Badge>
                  <span className="text-xs text-muted-foreground">{items.length} document{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-border">
                  {items.length === 0 && (
                    <div className="px-3 py-4 text-xs text-muted-foreground text-center">No documents in this tier.</div>
                  )}
                  {items.map(r => {
                    const d = docById[r.document_id];
                    return (
                      <div key={r.id} className="px-3 py-2.5 grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4">
                          <div className="text-sm font-medium">{d?.name_en}</div>
                          <div className="text-xs text-muted-foreground">{d?.name_th}</div>
                        </div>
                        <div className="col-span-5">
                          <Input
                            value={r.condition_note}
                            onChange={(e) => updateRule(r.id, { condition_note: e.target.value })}
                            placeholder="Condition note"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min={1}
                            value={r.min_count}
                            onChange={(e) => updateRule(r.id, { min_count: Number(e.target.value) || 1 })}
                            className="h-8 text-xs"
                            title="Min count"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setRemoved(prev => new Set(prev).add(r.id))}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-2 border-t border-border bg-muted/20">
                  {addingTier === tier ? (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(v) => addDoc(Number(v), tier)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick from Document Library..." /></SelectTrigger>
                        <SelectContent>
                          {availableDocs.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">All active documents already added</div>}
                          {availableDocs.map(d => (
                            <SelectItem key={d.id} value={String(d.id)}>{d.name_en} · {d.name_th}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => setAddingTier(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setAddingTier(tier)}>
                      <Plus className="w-3.5 h-3.5" /> Add document
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageLibrarySheet({ open, onOpenChange, library, usageCount, onEditDoc, onToggleActive, onAddDoc }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  library: DocLibraryRow[];
  usageCount: (id: number) => number;
  onEditDoc: (id: number, patch: Partial<DocLibraryRow>) => void;
  onToggleActive: (d: DocLibraryRow) => void;
  onAddDoc: (row: Omit<DocLibraryRow, 'id' | 'created_at' | 'updated_at'>) => string | null;
}) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newEN, setNewEN] = useState('');
  const [newTH, setNewTH] = useState('');
  const [newTier, setNewTier] = useState<UITier>('Required');
  const [newNote, setNewNote] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ name_en: string; name_th: string; default_condition_note: string; default_tier: UITier }>({ name_en: '', name_th: '', default_condition_note: '', default_tier: 'Required' });

  const filtered = library.filter(d => {
    const q = search.toLowerCase();
    return !q || d.name_en.toLowerCase().includes(q) || d.name_th.includes(search);
  });

  const handleAdd = () => {
    if (!newEN.trim() || !newTH.trim()) { setAddError('Both EN and TH names are required'); return; }
    const tierMap: Record<UITier, DocTier> = { Required: 'Required Base', Conditional: 'Conditional', Optional: 'Optional' };
    const err = onAddDoc({ name_en: newEN.trim(), name_th: newTH.trim(), category: 'A', default_tier: tierMap[newTier], default_condition_note: newNote.trim(), is_active: true });
    if (err) { setAddError(err); return; }
    setAddError(null); setShowAdd(false);
    setNewEN(''); setNewTH(''); setNewNote('');
    toast({ title: 'Document added', description: 'Available in scenario edit dropdowns.' });
  };

  const startEdit = (d: DocLibraryRow) => {
    setEditingId(d.id);
    setDraft({ name_en: d.name_en, name_th: d.name_th, default_condition_note: d.default_condition_note, default_tier: normalizeTier(d.default_tier) });
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const tierMap: Record<UITier, DocTier> = { Required: 'Required Base', Conditional: 'Conditional', Optional: 'Optional' };
    onEditDoc(editingId, { name_en: draft.name_en.trim(), name_th: draft.name_th.trim(), default_condition_note: draft.default_condition_note, default_tier: tierMap[draft.default_tier] });
    toast({ title: 'Document updated', description: 'Changes apply to all scenarios that reference this document.' });
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Library className="w-4 h-4" /> Document Library</SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">Master list. Editing names or notes here updates every scenario that references the document.</p>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by EN / TH name..." className="pl-8 h-9" />
            </div>
            <Button size="sm" onClick={() => setShowAdd(s => !s)} className="gap-1"><Plus className="w-4 h-4" /> Add Document</Button>
          </div>

          {showAdd && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Name (EN)</label>
                  <Input value={newEN} onChange={(e) => setNewEN(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Name (TH)</label>
                  <Input value={newTH} onChange={(e) => setNewTH(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Default Tier</label>
                  <Select value={newTier} onValueChange={(v) => setNewTier(v as UITier)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Required', 'Conditional', 'Optional'] as UITier[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Default Condition Note</label>
                  <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
              {addError && <p className="text-xs text-destructive">{addError}</p>}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setAddError(null); }}>Cancel</Button>
                <Button size="sm" onClick={handleAdd}>Save</Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (TH)</TableHead>
                  <TableHead className="w-32">Default Tier</TableHead>
                  <TableHead className="w-24 text-center">Usage</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-40 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => {
                  const usage = usageCount(d.id);
                  const isEditing = editingId === d.id;
                  return (
                    <>
                      <TableRow key={d.id} className={!d.is_active ? 'opacity-60' : ''}>
                        <TableCell className="font-medium text-sm">{d.name_en}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.name_th}</TableCell>
                        <TableCell><Badge variant="outline" className={tierColor[normalizeTier(d.default_tier)]}>{normalizeTier(d.default_tier)}</Badge></TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={usage > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                            {usage} {usage === 1 ? 'rule' : 'rules'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {d.is_active
                            ? <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                            : <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Inactive</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => isEditing ? setEditingId(null) : startEdit(d)}>
                              {isEditing ? 'Close' : <><Pencil className="w-3 h-3 mr-1" />Edit</>}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => onToggleActive(d)}
                              title={d.is_active && usage > 0 ? `Cannot deactivate — used by ${usage} active rule(s)` : ''}
                            >
                              {d.is_active ? 'Deactivate' : 'Reactivate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isEditing && (
                        <TableRow key={d.id + '-edit'} className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={6} className="p-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground">Name (EN)</label>
                                <Input value={draft.name_en} onChange={e => setDraft(p => ({ ...p, name_en: e.target.value }))} className="h-8 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Name (TH)</label>
                                <Input value={draft.name_th} onChange={e => setDraft(p => ({ ...p, name_th: e.target.value }))} className="h-8 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Default Tier</label>
                                <Select value={draft.default_tier} onValueChange={v => setDraft(p => ({ ...p, default_tier: v as UITier }))}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {(['Required', 'Conditional', 'Optional'] as UITier[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Default Condition Note</label>
                                <Input value={draft.default_condition_note} onChange={e => setDraft(p => ({ ...p, default_condition_note: e.target.value }))} className="h-8 text-sm" />
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-[11px] text-muted-foreground">Edits cascade to all {usage} scenario reference{usage !== 1 ? 's' : ''}.</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                <Button size="sm" onClick={saveEdit}>Save</Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
