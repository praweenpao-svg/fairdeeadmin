import { useEffect, useMemo, useState } from 'react';
import { FileStack, Search, Pencil, Plus, X, Library, ChevronDown, ChevronRight, Shield, ShieldCheck, AlertCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { TablePagination } from '@/components/ui/table-pagination';
import { toast } from '@/hooks/use-toast';
import {
  mockDocLibrary,
  mockMatrixRules,
  
  mockInsurers,
  mockVehicleCodes,
  CONDITION_FIELDS,
  OPERATORS_FOR_TYPE,
  emptyGroup,
  newLeaf,
  
  migrateLegacyConditions,
  type DocTier,
  type SaleType,
  type InsuranceClass,
  type PaymentType,
  type DocMatrixRule,
  type DocLibraryRow,
  
  type ConditionGroup,
  type ConditionLeaf,
  type ConditionNode,
  type ConditionFieldKey,
  type ConditionOperator,
  type LogicOp,
} from '@/data/mockDocumentMatrix';


const formatThb = (n: number) => new Intl.NumberFormat('en-US').format(n);
const insurerName = (id: string) => mockInsurers.find(i => i.id === id)?.name ?? id;
const vehicleName = (id: string) => mockVehicleCodes.find(v => v.id === id)?.name ?? id;

const OP_LABEL: Record<ConditionOperator, string> = {
  in: 'in', not_in: 'not in', equals: '=', not_equals: '≠',
  is_true: 'is true', is_false: 'is false',
  '<': '<', '<=': '≤', '=': '=', '>=': '≥', '>': '>', between: 'between',
};

function fieldDef(key: ConditionFieldKey) {
  return CONDITION_FIELDS.find(f => f.key === key)!;
}

function leafLabel(leaf: ConditionLeaf): string {
  const def = fieldDef(leaf.field);
  const renderVal = (): string => {
    const v = leaf.value;
    if (def.type === 'multi-select') {
      const arr = (Array.isArray(v) ? v : []) as string[];
      if (arr.length === 0) return '∅';
      const names = arr.map(id => {
        if (leaf.field === 'insurer') return insurerName(id);
        if (leaf.field === 'vehicle_code') return vehicleName(id);
        return def.options?.find(o => o.value === id)?.label ?? id;
      });
      return names.length <= 2 ? names.join(', ') : `${names.length} items`;
    }
    if (def.type === 'select') return def.options?.find(o => o.value === v)?.label ?? String(v ?? '');
    if (def.type === 'boolean') return '';
    if (def.type === 'number') {
      if (leaf.operator === 'between' && Array.isArray(v)) return `${formatThb(Number(v[0]))} – ${formatThb(Number(v[1]))} ${def.unit ?? ''}`.trim();
      return `${formatThb(Number(v ?? 0))} ${def.unit ?? ''}`.trim();
    }
    return String(v ?? '');
  };
  const valStr = renderVal();
  return valStr ? `${def.label} ${OP_LABEL[leaf.operator]} ${valStr}` : `${def.label} ${OP_LABEL[leaf.operator]}`;
}

function summarizeTree(node: ConditionNode, depth = 0): string {
  if (node.kind === 'leaf') return leafLabel(node);
  if (node.children.length === 0) return '';
  const parts = node.children.map(c => summarizeTree(c, depth + 1)).filter(Boolean);
  const joined = parts.join(` ${node.op} `);
  return depth === 0 ? joined : `(${joined})`;
}

function ConditionChips({ rule }: { rule: DocMatrixRule }) {
  const tree = migrateLegacyConditions(rule);
  if (!tree || tree.children.length === 0) return null;
  const summary = summarizeTree(tree);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-normal max-w-full">
        <span className="font-semibold mr-1">IF</span>
        <span className="truncate">{summary}</span>
      </Badge>
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

interface Combination {
  sale_type: SaleType;
  insurance_class: InsuranceClass;
  payment_type: PaymentType;
}

const allCombinations: Combination[] = (() => {
  const out: Combination[] = [];
  for (const s of SALE_TYPES) for (const c of CLASSES) for (const p of PAYMENTS) {
    out.push({ sale_type: s, insurance_class: c, payment_type: p });
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

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Combination | null>(null);
  const [activeTab, setActiveTab] = useState<string>('library');
  const [showAddDoc, setShowAddDoc] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const docById = useMemo(() => Object.fromEntries(library.map(d => [d.id, d])), [library]);

  const matchAll = (sel: string[], v: string) => sel.length === 0 || sel.includes(v);

  const filteredCombos = useMemo(() => allCombinations.filter(c =>
    matchAll(fSale, c.sale_type) &&
    matchAll(fClass, c.insurance_class) &&
    matchAll(fPayment, c.payment_type)
  ), [fSale, fClass, fPayment]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [fSale, fClass, fPayment, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredCombos.length / rowsPerPage));
  const pagedCombos = filteredCombos.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const rulesFor = (c: Combination) => rules.filter(r =>
    r.is_active &&
    r.sale_type === c.sale_type &&
    r.insurance_class === c.insurance_class &&
    r.payment_type === c.payment_type
  );

  const comboKey = (c: Combination) => `${c.sale_type}-${c.insurance_class}-${c.payment_type}`;

  // Saving from edit modal
  const handleSaveScenario = (combo: Combination, nextRules: DocMatrixRule[]) => {
    setRules(prev => {
      const others = prev.filter(r => !(r.sale_type === combo.sale_type && r.insurance_class === combo.insurance_class && r.payment_type === combo.payment_type));
      return [...others, ...nextRules];
    });
    toast({ title: 'Scenario updated', description: `${combo.sale_type} · ${CLASS_LABEL[combo.insurance_class]} · ${combo.payment_type}` });
  };

  // Library mutations
  const usageCount = (docId: number) => rules.filter(r => r.document_id === docId && r.is_active).length;
  const handleEditDoc = (id: number, patch: Partial<DocLibraryRow>) => {
    setLibrary(prev => prev.map(d => d.id === id ? { ...d, ...patch, updated_at: new Date().toISOString().slice(0, 16).replace('T', ' ') } : d));
  };
  const handleDeleteDoc = (doc: DocLibraryRow) => {
    if (usageCount(doc.id) > 0) {
      toast({ title: 'Cannot delete', description: `${doc.name_en} is referenced by ${usageCount(doc.id)} active matrix rule(s). Remove it from those scenarios first.`, variant: 'destructive' });
      return;
    }
    if (!window.confirm(`Delete "${doc.name_en}"? This cannot be undone.`)) return;
    setLibrary(prev => prev.filter(d => d.id !== doc.id));
    toast({ title: 'Document deleted', description: doc.name_en });
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
          </div>
        </div>
      </header>

      <div className="px-6 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="library" className="gap-2"><Library className="w-4 h-4" />Library</TabsTrigger>
              <TabsTrigger value="matrix" className="gap-2"><FileStack className="w-4 h-4" />Matrix</TabsTrigger>
            </TabsList>
            {activeTab === 'library' && isSuperAdmin && (
              <Button size="sm" onClick={() => setShowAddDoc(s => !s)} className="gap-1">
                <Plus className="w-4 h-4" /> Add Document
              </Button>
            )}
          </div>

          <TabsContent value="matrix" className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MultiSelectFilter label="Sale Type" selected={fSale} onChange={setFSale} options={SALE_TYPES.map(s => ({ v: s, l: s }))} />
                <MultiSelectFilter label="Class" selected={fClass} onChange={setFClass} options={CLASSES.map(c => ({ v: c, l: CLASS_LABEL[c] }))} />
                <MultiSelectFilter label="Payment Type" selected={fPayment} onChange={setFPayment} options={PAYMENTS.map(p => ({ v: p, l: p }))} />
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {(fSale.length + fClass.length + fPayment.length) > 0 && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setFSale([]); setFClass([]); setFPayment([]); }}>Clear filters</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8" />
                    <TableHead>Sale Type</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Conditional</TableHead>
                    <TableHead className="text-center">Optional</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Last Updated By</TableHead>
                    {isSuperAdmin && <TableHead className="text-right w-24">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedCombos.map(c => renderRow(c, expanded, setExpanded, rulesFor, comboKey, isSuperAdmin, setEditing, docById))}
                  {filteredCombos.length === 0 && (
                    <TableRow><TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center text-sm text-muted-foreground py-8">No scenarios match the filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredCombos.length > 0 && (
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
          </TabsContent>

          <TabsContent value="library" className="mt-4">
            <LibraryPanel
              library={library}
              usageCount={usageCount}
              onEditDoc={handleEditDoc}
              onDeleteDoc={handleDeleteDoc}
              onAddDoc={handleAddDoc}
              isSuperAdmin={isSuperAdmin}
              showAdd={showAddDoc}
              setShowAdd={setShowAddDoc}
            />
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
      <TableRow key={key} className="cursor-pointer hover:bg-primary/5" onClick={() => setExpanded(isOpen ? null : key)}>
        <TableCell className="text-muted-foreground">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
        <TableCell className="font-medium">{c.sale_type}</TableCell>
        <TableCell>{CLASS_LABEL[c.insurance_class]}</TableCell>
        <TableCell>{c.payment_type}</TableCell>
        
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
          <TableCell colSpan={isSuperAdmin ? 10 : 9} className="p-4">
            <ExpandedRowDetail rules={rs} docById={docById} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function MultiSelectFilter({ label, selected, onChange, options }: { label: string; selected: string[]; onChange: (v: string[]) => void; options: { v: string; l: string }[] }) {
  const summary = selected.length === 0 ? 'All' : selected.map(v => options.find(o => o.v === v)?.l ?? v).join(', ');
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
                      {r.min_count > 1 && <div className="text-[11px] text-muted-foreground italic mt-0.5">min {r.min_count}</div>}
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

  useEffect(() => { setStaged(rules); setRemoved(new Set()); setAddingTier(null); setErrors([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [combination?.sale_type, combination?.insurance_class, combination?.payment_type]);

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

      document_id: docId,
      tier: (tier === 'Required' ? 'Required Base' : tier === 'Conditional' ? 'Conditional' : 'Optional') as DocTier,
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

  const treeKey = (n?: ConditionGroup): string => {
    if (!n || n.children.length === 0) return '';
    const stringify = (node: ConditionNode): string => {
      if (node.kind === 'leaf') {
        const v = Array.isArray(node.value) ? [...node.value].map(String).sort().join(',') : String(node.value ?? '');
        return `${node.field}:${node.operator}:${v}`;
      }
      const kids = node.children.map(stringify).sort().join('|');
      return `${node.op}(${kids})`;
    };
    return stringify(n);
  };

  const ruleScopeKey = (r: DocMatrixRule) => {
    const tree = r.conditions ?? migrateLegacyConditions(r);
    return `${r.document_id}|${treeKey(tree)}`;
  };

  const validateTree = (node: ConditionNode, errs: string[], docName: string) => {
    if (node.kind === 'group') {
      if (node.children.length === 0) errs.push(`"${docName}" has an empty condition group.`);
      node.children.forEach(c => validateTree(c, errs, docName));
      return;
    }
    const def = CONDITION_FIELDS.find(f => f.key === node.field);
    if (!def) return;
    const v = node.value;
    if (def.type === 'multi-select' && (!Array.isArray(v) || v.length === 0)) {
      errs.push(`"${docName}" condition ${def.label} ${OP_LABEL[node.operator]} needs at least one value.`);
    }
    if (def.type === 'select' && (v === undefined || v === '' || v === null)) {
      errs.push(`"${docName}" condition ${def.label} needs a value.`);
    }
    if (def.type === 'number') {
      if (node.operator === 'between') {
        if (!Array.isArray(v) || v.length !== 2 || Number(v[0]) > Number(v[1])) {
          errs.push(`"${docName}" between range is invalid.`);
        }
      } else if (v === undefined || v === '' || Number.isNaN(Number(v)) || Number(v) < 0) {
        errs.push(`"${docName}" ${def.label} value must be ≥ 0.`);
      }
    }
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const seen = new Map<string, number>();
    visible.forEach(r => {
      const k = ruleScopeKey(r);
      seen.set(k, (seen.get(k) ?? 0) + 1);
    });
    seen.forEach((count, k) => {
      if (count > 1) {
        const docId = Number(k.split('|')[0]);
        errs.push(`"${docById[docId]?.name_en}" has duplicate rules with identical conditions. Differentiate or remove duplicates.`);
      }
    });
    visible.forEach(r => {
      const docName = docById[r.document_id]?.name_en ?? `#${r.document_id}`;
      if (!Number.isFinite(r.min_count) || r.min_count < 1) errs.push(`"${docName}" has invalid min_count (must be ≥ 1).`);
      if (r.conditions && r.conditions.children.length > 0) {
        validateTree(r.conditions, errs, docName);
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
                      <div key={r.id} className="px-3 py-2.5 space-y-2">
                        <div className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-9">
                            <div className="text-sm font-medium">{d?.name_en}</div>
                            <div className="text-xs text-muted-foreground">{d?.name_th}</div>
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
                        {tier === 'Conditional' && (
                          <RuleConditionEditor rule={r} onChange={(patch) => updateRule(r.id, patch)} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-2 border-t border-border bg-muted/20">
                  {addingTier === tier ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const tierDocs = availableDocs.filter(d => normalizeTier(d.default_tier) === tier);
                        return (
                          <Select onValueChange={(v) => addDoc(Number(v), tier)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={`Pick from ${tier} documents...`} /></SelectTrigger>
                            <SelectContent>
                              {tierDocs.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No {tier} documents in library</div>}
                              {tierDocs.map(d => (
                                <SelectItem key={d.id} value={String(d.id)}>{d.name_en} · {d.name_th}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
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

// ===================== Condition Tree Editor (CleverTap-style) =====================

function RuleConditionEditor({ rule, onChange }: { rule: DocMatrixRule; onChange: (patch: Partial<DocMatrixRule>) => void }) {
  const tree: ConditionGroup = rule.conditions ?? migrateLegacyConditions(rule) ?? emptyGroup('AND');

  const commit = (next: ConditionGroup) => {
    // When tree becomes the source of truth, clear legacy fields to avoid drift.
    onChange({
      conditions: next,
      insurer_ids: undefined,
      vehicle_codes: undefined,
      sum_insured_op: undefined,
      sum_insured_value: undefined,
    });
  };

  const isEmpty = tree.children.length === 0;

  if (isEmpty) {
    return (
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
        onClick={() => commit({ ...tree, children: [newLeaf('insurer')] })}>
        <Plus className="w-3 h-3" /> Add condition
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 px-2.5 py-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <ConditionGroupEditor group={tree} onChange={commit} depth={0} />
        </div>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-muted-foreground shrink-0"
          onClick={() => commit(emptyGroup('AND'))}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function ConditionGroupEditor({ group, onChange, depth }: {
  group: ConditionGroup;
  onChange: (g: ConditionGroup) => void;
  depth: number;
}) {
  const updateChild = (idx: number, child: ConditionNode) => {
    const next = [...group.children];
    next[idx] = child;
    onChange({ ...group, children: next });
  };
  const removeChild = (idx: number) => {
    const next = group.children.filter((_, i) => i !== idx);
    onChange({ ...group, children: next });
  };
  const addLeaf = () => onChange({ ...group, children: [...group.children, newLeaf('insurer')] });
  const addGroup = () => onChange({ ...group, children: [...group.children, emptyGroup(group.op === 'AND' ? 'OR' : 'AND')] });

  const borderColor = group.op === 'AND' ? 'border-blue-300' : 'border-purple-300';
  const bgColor = group.op === 'AND' ? 'bg-blue-50/40' : 'bg-purple-50/40';
  const opBadge = group.op === 'AND'
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-purple-100 text-purple-700 border-purple-200';

  return (
    <div className={`rounded-md border ${borderColor} ${bgColor} p-2 space-y-1.5`}>
      <div className="flex items-center gap-2">
        <Select value={group.op} onValueChange={(v) => onChange({ ...group, op: v as LogicOp })}>
          <SelectTrigger className={`h-6 w-[68px] text-[10px] font-bold uppercase ${opBadge}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground">
          Match {group.op === 'AND' ? 'ALL' : 'ANY'} of the following
        </span>
      </div>

      <div className="space-y-1.5 pl-2 border-l-2 border-dashed border-border/60">
        {group.children.map((child, idx) => (
          <div key={child.id} className="flex items-start gap-1.5">
            <div className="flex-1 min-w-0">
              {child.kind === 'leaf' ? (
                <ConditionLeafEditor leaf={child} onChange={(l) => updateChild(idx, l)} />
              ) : (
                <ConditionGroupEditor group={child} onChange={(g) => updateChild(idx, g)} depth={depth + 1} />
              )}
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => removeChild(idx)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {group.children.length === 0 && (
          <div className="text-[11px] text-muted-foreground italic px-1">Empty group</div>
        )}
      </div>

      <div className="flex items-center gap-1 pt-0.5">
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1" onClick={addLeaf}>
          <Plus className="w-3 h-3" /> Condition
        </Button>
        {depth < 2 && (
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1" onClick={addGroup}>
            <Plus className="w-3 h-3" /> Group
          </Button>
        )}
      </div>
    </div>
  );
}

function ConditionLeafEditor({ leaf, onChange }: { leaf: ConditionLeaf; onChange: (l: ConditionLeaf) => void }) {
  const def = CONDITION_FIELDS.find(f => f.key === leaf.field)!;
  const ops = OPERATORS_FOR_TYPE[def.type];

  const setField = (key: ConditionFieldKey) => {
    const newDef = CONDITION_FIELDS.find(f => f.key === key)!;
    const newOp = OPERATORS_FOR_TYPE[newDef.type][0];
    let v: ConditionLeaf['value'];
    if (newDef.type === 'multi-select') v = [];
    else if (newDef.type === 'select') v = newDef.options?.[0]?.value;
    else if (newDef.type === 'number') v = 0;
    onChange({ ...leaf, field: key, operator: newOp, value: v });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap rounded-md bg-background border border-border px-2 py-1.5">
      {/* Field */}
      <Select value={leaf.field} onValueChange={(v) => setField(v as ConditionFieldKey)}>
        <SelectTrigger className="h-7 w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONDITION_FIELDS.map(f => (
            <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select value={leaf.operator} onValueChange={(v) => {
        const op = v as ConditionOperator;
        // Switching to/from between resets value shape
        let val = leaf.value;
        if (op === 'between' && !Array.isArray(val)) val = [0, 0];
        if (op !== 'between' && Array.isArray(val) && def.type === 'number') val = Number(val[0]) || 0;
        onChange({ ...leaf, operator: op, value: val });
      }}>
        <SelectTrigger className="h-7 w-[88px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ops.map(op => <SelectItem key={op} value={op}>{OP_LABEL[op]}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Value editor */}
      <LeafValueEditor leaf={leaf} onChange={onChange} />
    </div>
  );
}

function LeafValueEditor({ leaf, onChange }: { leaf: ConditionLeaf; onChange: (l: ConditionLeaf) => void }) {
  const def = CONDITION_FIELDS.find(f => f.key === leaf.field)!;

  if (def.type === 'boolean') return null;

  if (def.type === 'select') {
    return (
      <Select value={String(leaf.value ?? '')} onValueChange={(v) => onChange({ ...leaf, value: v })}>
        <SelectTrigger className="h-7 min-w-[140px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {def.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (def.type === 'number') {
    if (leaf.operator === 'between') {
      const arr = (Array.isArray(leaf.value) ? leaf.value : [0, 0]) as number[];
      return (
        <div className="flex items-center gap-1">
          <Input type="number" min={0} step={50000} value={arr[0] ?? 0} className="h-7 w-28 text-xs"
            onChange={(e) => onChange({ ...leaf, value: [Number(e.target.value) || 0, arr[1] ?? 0] })} />
          <span className="text-[10px] text-muted-foreground">and</span>
          <Input type="number" min={0} step={50000} value={arr[1] ?? 0} className="h-7 w-28 text-xs"
            onChange={(e) => onChange({ ...leaf, value: [arr[0] ?? 0, Number(e.target.value) || 0] })} />
          {def.unit && <span className="text-[10px] text-muted-foreground">{def.unit}</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Input type="number" min={0} step={50000} value={Number(leaf.value ?? 0)} className="h-7 w-32 text-xs"
          onChange={(e) => onChange({ ...leaf, value: Number(e.target.value) || 0 })} />
        {def.unit && <span className="text-[10px] text-muted-foreground">{def.unit}</span>}
      </div>
    );
  }

  // multi-select
  const arr = (Array.isArray(leaf.value) ? leaf.value : []) as string[];
  const options: { value: string; label: string }[] =
    leaf.field === 'insurer'
      ? mockInsurers.map(i => ({ value: i.id, label: i.name }))
      : leaf.field === 'vehicle_code'
        ? mockVehicleCodes.map(v => ({ value: v.id, label: v.name + (v.is_ev ? ' (EV)' : '') }))
        : (def.options ?? []);

  const summary = arr.length === 0 ? 'Select…'
    : arr.length === 1 ? (options.find(o => o.value === arr[0])?.label ?? arr[0])
    : `${arr.length} selected`;

  const evIds = mockVehicleCodes.filter(v => v.is_ev).map(v => v.id);
  const allEvSelected = leaf.field === 'vehicle_code' && arr.length > 0 && arr.every(id => evIds.includes(id)) && evIds.every(id => arr.includes(id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs font-normal gap-1 min-w-[140px] justify-between">
          <span className="truncate">{summary}</span>
          <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        {leaf.field === 'vehicle_code' && (
          <>
            <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
              <Checkbox checked={allEvSelected} onCheckedChange={(c) => onChange({ ...leaf, value: c ? evIds : [] })} />
              <span className="text-sm">All EV models (preset)</span>
            </label>
            <div className="border-t border-border my-1" />
          </>
        )}
        <div className="max-h-56 overflow-y-auto">
          {options.map(o => {
            const on = arr.includes(o.value);
            return (
              <label key={o.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                <Checkbox checked={on} onCheckedChange={(c) => {
                  const next = c ? [...arr, o.value] : arr.filter(x => x !== o.value);
                  onChange({ ...leaf, value: next });
                }} />
                <span className="text-sm">{o.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LibraryPanel({ library, usageCount, onEditDoc, onDeleteDoc, onAddDoc, isSuperAdmin, showAdd, setShowAdd }: {
  library: DocLibraryRow[];
  usageCount: (id: number) => number;
  onEditDoc: (id: number, patch: Partial<DocLibraryRow>) => void;
  onDeleteDoc: (d: DocLibraryRow) => void;
  onAddDoc: (row: Omit<DocLibraryRow, 'id' | 'created_at' | 'updated_at'>) => string | null;
  isSuperAdmin: boolean;
  showAdd: boolean;
  setShowAdd: (v: boolean | ((s: boolean) => boolean)) => void;
}) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [newEN, setNewEN] = useState('');
  const [newTH, setNewTH] = useState('');
  const [newTier, setNewTier] = useState<UITier>('Required');
  const [newNote, setNewNote] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ name_en: string; name_th: string; default_tier: UITier }>({ name_en: '', name_th: '', default_tier: 'Required' });

  const totalPages = Math.max(1, Math.ceil(library.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paged = library.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

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
    setDraft({ name_en: d.name_en, name_th: d.name_th, default_tier: normalizeTier(d.default_tier) });
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const tierMap: Record<UITier, DocTier> = { Required: 'Required Base', Conditional: 'Conditional', Optional: 'Optional' };
    onEditDoc(editingId, { name_en: draft.name_en.trim(), name_th: draft.name_th.trim(), default_tier: tierMap[draft.default_tier] });
    toast({ title: 'Document updated', description: 'Changes apply to all scenarios that reference this document.' });
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
          <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) setAddError(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name (EN)</label>
                  <Input value={newEN} onChange={(e) => setNewEN(e.target.value)} className="h-9 text-sm bg-card" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Name (TH)</label>
                  <Input value={newTH} onChange={(e) => setNewTH(e.target.value)} className="h-9 text-sm bg-card" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Default Tier</label>
                  <Select value={newTier} onValueChange={(v) => setNewTier(v as UITier)}>
                    <SelectTrigger className="h-9 text-sm bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Required', 'Conditional', 'Optional'] as UITier[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {addError && <p className="text-xs text-destructive">{addError}</p>}
              <DialogFooter>
                <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setAddError(null); }}>Cancel</Button>
                <Button size="sm" onClick={handleAdd}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (TH)</TableHead>
                  <TableHead className="w-32">Default Tier</TableHead>
                  <TableHead className="w-24 text-center">Usage</TableHead>
                  <TableHead className="w-40 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(d => {
                  const usage = usageCount(d.id);
                  const isEditing = editingId === d.id;
                  return (
                    <>
                      <TableRow key={d.id} className="hover:bg-primary/5">
                        <TableCell className="font-medium text-sm">{d.name_en}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.name_th}</TableCell>
                        <TableCell><Badge variant="outline" className={tierColor[normalizeTier(d.default_tier)]}>{normalizeTier(d.default_tier)}</Badge></TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={usage > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                            {usage} {usage === 1 ? 'rule' : 'rules'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => isEditing ? setEditingId(null) : startEdit(d)}>
                              {isEditing ? 'Close' : <><Pencil className="w-3 h-3 mr-1" />Edit</>}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isEditing && (
                        <TableRow key={d.id + '-edit'} className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={5} className="p-3">
                            <div className="grid grid-cols-3 gap-2">
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
                            </div>
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                              <Button size="sm" onClick={saveEdit}>Save</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
        {library.length > 0 && (
          <TablePagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={library.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(1); }}
          />
        )}
          </div>
    </div>
  );
}
