import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReworkReason, ReworkPartyType, PolicyScopeType, PipelineStage, AutomationType } from '@/types/pipeline';
import { useReworkReasonsStore, slugifyReasonKey, uniqueReasonKey } from '@/stores/reworkReasonsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const partyTypeOptions: { value: ReworkPartyType; label: string }[] = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
];

const policyScopeOptions: { value: PolicyScopeType; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'vmi', label: 'VMI Only' },
  { value: 'cmi', label: 'CMI Only' },
];

const stageOptions: { value: PipelineStage; label: string }[] = [
  { value: 'to_pay', label: 'To Pay Premium' },
  { value: 'to_report', label: 'To Report Sale' },
  { value: 'to_issue', label: 'To Issue Policy' },
  { value: 'to_deliver', label: 'To Deliver Policy' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancellation' },
];

type FormData = Partial<ReworkReason>;

const defaultForm: FormData = {
  descriptionEn: '',
  descriptionTh: '',
  partyType: 'external',
  policyScope: 'both',
  stages: ['to_pay', 'to_report', 'to_issue', 'to_deliver', 'completed'],
  automationEnabled: false,
  automationType: undefined,
  automationDays: undefined,
  targetReasonId: undefined,
};

export default function ReworkReasons() {
  const { reasons, addReason, updateReason, deleteReason } = useReworkReasonsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ReworkReason | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...defaultForm });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [partyFilter, setPartyFilter] = useState<string>('all');

  const openDialog = (r?: ReworkReason) => {
    if (r) { setEditing(r); setForm({ ...r }); }
    else { setEditing(null); setForm({ ...defaultForm }); }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!form.descriptionEn?.trim()) {
      toast({ title: 'Validation Error', description: 'Description (EN) is required.', variant: 'destructive' });
      return;
    }
    if (!form.descriptionTh?.trim()) {
      toast({ title: 'Validation Error', description: 'Description (TH) is required.', variant: 'destructive' });
      return;
    }
    if (!(form.stages || []).length) {
      toast({ title: 'Validation Error', description: 'At least one stage is required.', variant: 'destructive' });
      return;
    }
    if (form.automationEnabled && form.automationType === 'auto_reassign') {
      if (!form.automationDays || form.automationDays <= 0) {
        toast({ title: 'Validation Error', description: 'Threshold must be a positive whole number.', variant: 'destructive' });
        return;
      }
    }

    const key = uniqueReasonKey(form.descriptionEn!, reasons, editing?.id);

    if (editing) {
      updateReason(editing.id, { ...form, key } as Partial<ReworkReason>);
      toast({ title: 'Reason updated', description: `${form.descriptionEn} saved.` });
    } else {
      const newReason: ReworkReason = {
        id: `reason-${Date.now()}`,
        key,
        descriptionEn: form.descriptionEn!,
        descriptionTh: form.descriptionTh!,
        partyType: form.partyType || 'external',
        policyScope: form.policyScope || 'both',
        stages: form.stages || [],
        automationEnabled: form.automationEnabled || false,
        automationType: form.automationEnabled ? (form.automationType || 'auto_reassign') : undefined,
        automationDays: form.automationEnabled ? form.automationDays : undefined,
        targetReasonId: form.automationEnabled && form.automationType !== 'auto_resolve' ? form.targetReasonId : undefined,
      };
      addReason(newReason);
      toast({ title: 'Reason created', description: `${newReason.descriptionEn} (${newReason.key})` });
    }
    setIsOpen(false);
  };

  const toggleStage = (s: PipelineStage) => {
    const cur = form.stages || [];
    setForm({ ...form, stages: cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s] });
  };

  const filtered = partyFilter === 'all' ? reasons : reasons.filter(r => r.partyType === partyFilter);
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const previewKey = form.descriptionEn ? uniqueReasonKey(form.descriptionEn, reasons, editing?.id) : '';

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rework Reasons</h2>
          <p className="text-sm text-muted-foreground">
            Manage rework reason entities. Assignment logic is configured separately on the Assignment Config page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={partyFilter} onValueChange={(v) => { setPartyFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parties</SelectItem>
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" /> Add Reason
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Rework Reason' : 'Add Rework Reason'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Description (EN)</Label>
                  <Input className="bg-card" value={form.descriptionEn || ''} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="e.g., Docs Missing" />
                  {previewKey && (
                    <p className="text-xs text-muted-foreground">
                      Unique key: <span className="font-mono text-foreground">{previewKey}</span>
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Description (TH)</Label>
                  <Input className="bg-card" value={form.descriptionTh || ''} onChange={(e) => setForm({ ...form, descriptionTh: e.target.value })} placeholder="กรอกคำอธิบายภาษาไทย" />
                </div>
                <div className="grid gap-2">
                  <Label>Party Type</Label>
                  <Select value={form.partyType || 'external'} onValueChange={(v) => setForm({ ...form, partyType: v as ReworkPartyType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {partyTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Policy Scope</Label>
                  <Select value={form.policyScope || 'both'} onValueChange={(v) => setForm({ ...form, policyScope: v as PolicyScopeType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {policyScopeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Stages <span className="text-xs text-muted-foreground font-normal">(controls where this reason is selectable)</span></Label>
                  <div className="border rounded-md p-3 space-y-2">
                    {stageOptions.map(s => (
                      <div key={s.value} className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded" onClick={() => toggleStage(s.value)}>
                        <Checkbox checked={(form.stages || []).includes(s.value)} onCheckedChange={() => toggleStage(s.value)} />
                        <span className="text-sm">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <Label>Enable Automation</Label>
                      <p className="text-xs text-muted-foreground">Automatically act on stale rework items</p>
                    </div>
                    <Switch
                      checked={form.automationEnabled || false}
                      onCheckedChange={(v) => setForm({ ...form, automationEnabled: v, automationType: v ? (form.automationType || 'auto_reassign') : undefined })}
                    />
                  </div>
                  {form.automationEnabled && (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Automation Type</Label>
                        <Select
                          value={form.automationType || 'auto_reassign'}
                          onValueChange={(v) => setForm({ ...form, automationType: v as AutomationType, targetReasonId: v === 'auto_resolve' ? undefined : form.targetReasonId })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto_reassign">Auto-Reassign</SelectItem>
                            <SelectItem value="auto_resolve">Auto-Resolve</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(form.automationType || 'auto_reassign') === 'auto_reassign' && (
                        <>
                          <div className="grid gap-2">
                            <Label>Threshold (Days)</Label>
                            <Input type="number" min={1} value={form.automationDays || ''} onChange={(e) => setForm({ ...form, automationDays: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Enter number of days" />
                          </div>
                          <div className="grid gap-2">
                            <Label>Target Reason</Label>
                            <Select value={form.targetReasonId || '__none__'} onValueChange={(v) => setForm({ ...form, targetReasonId: v === '__none__' ? undefined : v })}>
                              <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Select target reason</SelectItem>
                                {reasons.filter(r => r.id !== editing?.id).map(r => (
                                  <SelectItem key={r.id} value={r.id}>{r.descriptionEn}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="data-table-header px-4 py-3 text-left">Key</th>
                <th className="data-table-header px-4 py-3 text-left min-w-[260px]">Description</th>
                <th className="data-table-header px-4 py-3 text-center">Party</th>
                <th className="data-table-header px-4 py-3 text-center">VMI/CMI</th>
                <th className="data-table-header px-4 py-3 text-left">Stages</th>
                <th className="data-table-header px-4 py-3 text-center">Automation</th>
                <th className="data-table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.id} className="data-table-row">
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{r.key}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{r.descriptionEn}</div>
                      <div className="text-xs text-muted-foreground">{r.descriptionTh}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {r.partyType === 'external' ? 'External' : 'Internal'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.policyScope === 'vmi' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : r.policyScope === 'cmi' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                      {r.policyScope === 'vmi' ? 'VMI' : r.policyScope === 'cmi' ? 'CMI' : 'Both'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(r.stages || []).map(s => stageOptions.find(o => o.value === s)?.label || s).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {r.automationEnabled ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {r.automationType === 'auto_resolve' ? 'Resolve' : `Reassign ${r.automationDays ? `· ${r.automationDays}d` : ''}`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(r)} className="h-8 w-8 p-0">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No rework reasons yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          rowsPerPage={perPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rework Reason</AlertDialogTitle>
            <AlertDialogDescription>
              Existing assignment configurations referencing this reason will keep their copied values. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) { deleteReason(deleteTarget); setDeleteTarget(null); } }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
