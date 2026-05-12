import { useMemo, useState } from 'react';
import { FileStack, History, Search, Eye, EyeOff, Pencil, Plus, X, Library, ChevronDown, ChevronRight, Shield, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  mockDocLibrary,
  mockMatrixRules,
  mockAuditLog,
  type DocTier,
  type SaleType,
  type InsuranceClass,
  type PaymentType,
  type CarType,
  type DocMatrixRule,
  type DocLibraryRow,
} from '@/data/mockDocumentMatrix';

// PRD tiers: Required · Conditional · Optional
type UITier = 'Required' | 'Conditional' | 'Optional';
const normalizeTier = (t: DocTier): UITier => {
  if (t === 'Required Base') return 'Required';
  if (t === 'Sale-Type Specific') return 'Conditional';
  if (t === 'Conditional') return 'Conditional';
  return 'Optional';
};

const tierColor: Record<UITier, string> = {
  'Required': 'bg-red-100 text-red-700 border-red-200',
  'Conditional': 'bg-amber-100 text-amber-700 border-amber-200',
  'Optional': 'bg-slate-100 text-slate-600 border-slate-200',
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

  // Filters
  const [fSale, setFSale] = useState<string>('all');
  const [fClass, setFClass] = useState<string>('all');
  const [fPayment, setFPayment] = useState<string>('all');
  const [fCar, setFCar] = useState<string>('all');

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Combination | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const docById = useMemo(() => Object.fromEntries(mockDocLibrary.map(d => [d.id, d])), []);

  const filteredCombos = useMemo(() => allCombinations.filter(c =>
    (fSale === 'all' || c.sale_type === fSale) &&
    (fClass === 'all' || c.insurance_class === fClass) &&
    (fPayment === 'all' || c.payment_type === fPayment) &&
    (fCar === 'all' || c.car_type === fCar)
  ), [fSale, fClass, fPayment, fCar]);

  const rulesFor = (c: Combination) => mockMatrixRules.filter(r =>
    r.is_active &&
    r.sale_type === c.sale_type &&
    r.insurance_class === c.insurance_class &&
    r.payment_type === c.payment_type &&
    r.car_type === c.car_type
  );

  const comboKey = (c: Combination) => `${c.sale_type}-${c.insurance_class}-${c.payment_type}-${c.car_type}`;

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
            {/* Role switcher (demo) */}
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted/40">
              <button
                onClick={() => setRole('super_admin')}
                className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 ${isSuperAdmin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
              </button>
              <button
                onClick={() => setRole('admin')}
                className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 ${!isSuperAdmin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'}`}
              >
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
            {/* Filters */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FilterField label="Sale Type" value={fSale} onChange={setFSale} options={[{ v: 'all', l: 'All' }, ...SALE_TYPES.map(s => ({ v: s, l: s }))]} />
                <FilterField label="Class" value={fClass} onChange={setFClass} options={[{ v: 'all', l: 'All' }, ...CLASSES.map(c => ({ v: c, l: CLASS_LABEL[c] }))]} />
                <FilterField label="Payment Type" value={fPayment} onChange={setFPayment} options={[{ v: 'all', l: 'All' }, ...PAYMENTS.map(p => ({ v: p, l: p }))]} />
                <FilterField label="Car Type" value={fCar} onChange={setFCar} options={[{ v: 'all', l: 'All' }, ...CAR_TYPES.map(c => ({ v: c, l: c }))]} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Showing</span>
                <Badge variant="outline">{filteredCombos.length} of {allCombinations.length} scenarios</Badge>
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
                  {filteredCombos.map(c => {
                    const key = comboKey(c);
                    const rules = rulesFor(c);
                    const counts = { Required: 0, Conditional: 0, Optional: 0 } as Record<UITier, number>;
                    rules.forEach(r => counts[normalizeTier(r.tier)]++);
                    const lastUpdated = rules.length ? rules.map(r => r.updated_at).sort().slice(-1)[0] : '—';
                    const lastBy = rules.length ? rules.find(r => r.updated_at === lastUpdated)?.updated_by ?? '—' : '—';
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
                              <ExpandedRowDetail rules={rules} docById={docById} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                  {filteredCombos.length === 0 && (
                    <TableRow><TableCell colSpan={isSuperAdmin ? 11 : 10} className="text-center text-sm text-muted-foreground py-8">No scenarios match the filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="text-xs text-muted-foreground px-1">
              Schema dimensions: <code>sale_type × class × payment_type × car_type</code> = <strong>3 × 5 × 2 × 3 = 90</strong> scenarios.
            </div>
          </TabsContent>

          {/* ---------------- AUDIT ---------------- */}
          <TabsContent value="audit" className="mt-4">
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
                  {[...mockAuditLog].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(log => (
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

      {/* Edit Modal */}
      <EditScenarioModal
        combination={editing}
        onClose={() => setEditing(null)}
        rules={editing ? rulesFor(editing) : []}
        docById={docById}
      />

      {/* Manage Library Sheet */}
      <ManageLibrarySheet open={libraryOpen} onOpenChange={setLibraryOpen} />
    </div>
  );
}

// ---------------- Sub-components ----------------

function FilterField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
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

function EditScenarioModal({ combination, onClose, rules, docById }: { combination: Combination | null; onClose: () => void; rules: DocMatrixRule[]; docById: Record<number, DocLibraryRow> }) {
  const [staged, setStaged] = useState<DocMatrixRule[]>([]);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [addingTier, setAddingTier] = useState<UITier | null>(null);

  // Reset staged state when combination changes
  useMemo(() => { setStaged(rules); setRemoved(new Set()); setAddingTier(null); }, [combination?.sale_type, combination?.insurance_class, combination?.payment_type, combination?.car_type]);

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

  const usedDocIds = new Set(visible.map(r => r.document_id));
  const availableDocs = mockDocLibrary.filter(d => d.is_active && !usedDocIds.has(d.id));

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
          <Button onClick={onClose}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageLibrarySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newEN, setNewEN] = useState('');
  const [newTH, setNewTH] = useState('');
  const [newTier, setNewTier] = useState<UITier>('Required');
  const [newNote, setNewNote] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const filtered = mockDocLibrary.filter(d => {
    const q = search.toLowerCase();
    return !q || d.name_en.toLowerCase().includes(q) || d.name_th.includes(search);
  });

  const handleAdd = () => {
    if (!newEN.trim() || !newTH.trim()) { setAddError('Both EN and TH names are required'); return; }
    const dup = mockDocLibrary.find(d => d.name_en.toLowerCase() === newEN.toLowerCase().trim() || d.name_th === newTH.trim());
    if (dup) { setAddError('Document with this name already exists'); return; }
    setAddError(null);
    setShowAdd(false);
    setNewEN(''); setNewTH(''); setNewNote('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Library className="w-4 h-4" /> Document Library</SheetTitle>
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
                  <TableHead className="w-20 text-center">Status</TableHead>
                  <TableHead className="w-32">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id} className={!d.is_active ? 'opacity-60' : ''}>
                    <TableCell className="font-medium text-sm">{d.name_en}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.name_th}</TableCell>
                    <TableCell><Badge variant="outline" className={tierColor[normalizeTier(d.default_tier)]}>{normalizeTier(d.default_tier)}</Badge></TableCell>
                    <TableCell className="text-center">
                      {d.is_active
                        ? <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                        : <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.updated_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
