import { useState, useCallback, useEffect } from 'react';
import { ReworkReason } from '@/types/pipeline';
import { mockReworkConfigs } from '@/data/mockLeads';

/**
 * Generate a slug-style unique key from an English description.
 * Example: "Docs Missing" -> "docs_missing".
 */
export function slugifyReasonKey(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'reason';
}

/** Generate a unique key, suffixing -2/-3 etc. on collision. */
export function uniqueReasonKey(base: string, existing: ReworkReason[], excludeId?: string): string {
  const baseSlug = slugifyReasonKey(base);
  const taken = new Set(existing.filter(r => r.id !== excludeId).map(r => r.key));
  if (!taken.has(baseSlug)) return baseSlug;
  let i = 2;
  while (taken.has(`${baseSlug}_${i}`)) i++;
  return `${baseSlug}_${i}`;
}

// === Auto-migrate: extract reasons from existing rework-type configs ===
function buildInitialReasons(): ReworkReason[] {
  const seen = new Map<string, ReworkReason>();
  const reasons: ReworkReason[] = [];
  for (const c of mockReworkConfigs) {
    if (c.configType !== 'rework') continue;
    const dedupeKey = `${(c.descriptionEn || '').trim().toLowerCase()}|${(c.descriptionTh || '').trim().toLowerCase()}|${c.partyType}|${c.policyScope}`;
    if (seen.has(dedupeKey)) continue;
    const baseKey = slugifyReasonKey(c.descriptionEn || c.descriptionTh || c.id);
    const taken = new Set(reasons.map(r => r.key));
    let key = baseKey;
    let i = 2;
    while (taken.has(key)) { key = `${baseKey}_${i++}`; }
    const reason: ReworkReason = {
      id: `reason-${c.id}`,
      key,
      descriptionEn: c.descriptionEn,
      descriptionTh: c.descriptionTh,
      partyType: c.partyType,
      policyScope: c.policyScope,
      stages: c.stages,
      automationEnabled: c.automationEnabled,
      automationType: c.automationType,
      automationDays: c.automationDays,
      targetReasonId: undefined, // migrated below after all reasons exist
    };
    seen.set(dedupeKey, reason);
    reasons.push(reason);
  }
  return reasons;
}

let globalReasons: ReworkReason[] = buildInitialReasons();
const listeners: Set<() => void> = new Set();
function notify() { listeners.forEach(l => l()); }

export function useReworkReasonsStore() {
  const [reasons, setReasonsState] = useState<ReworkReason[]>(globalReasons);

  useEffect(() => {
    const listener = () => setReasonsState([...globalReasons]);
    listeners.add(listener);
    listener();
    return () => { listeners.delete(listener); };
  }, []);

  const addReason = useCallback((reason: ReworkReason) => {
    globalReasons = [...globalReasons, reason];
    notify();
  }, []);

  const updateReason = useCallback((id: string, patch: Partial<ReworkReason>) => {
    globalReasons = globalReasons.map(r => r.id === id ? { ...r, ...patch } : r);
    notify();
  }, []);

  const deleteReason = useCallback((id: string) => {
    globalReasons = globalReasons.filter(r => r.id !== id);
    notify();
  }, []);

  const getReason = useCallback((id?: string) => globalReasons.find(r => r.id === id), []);

  return { reasons, addReason, updateReason, deleteReason, getReason };
}

/** Read-only accessor for non-hook contexts (e.g., one-off transforms). */
export function getAllReworkReasons(): ReworkReason[] {
  return globalReasons;
}
