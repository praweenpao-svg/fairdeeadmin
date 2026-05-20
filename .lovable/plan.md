# OPS Dashboard alignment to Sections 12–16

The spec covers a lot of surface area (page chrome, sidebar cards, primary/secondary CTAs, step gating, Update Sale flow, Chatwoot tab bar, Upload Documents modal). The current code already covers a chunk of this — I want to confirm scope with you before touching ~5,800 lines of OPS code.

## What I propose to build in this pass

Pass 1 — Page chrome & CTA logic (Section 12)
1. Header / Top Bar / Sidebar scroll behaviour
   - Header fixed; Top Bar (SaleDetailBar) scrolls with page; Left Sidebar (SalesDetailPanel) scrolls with page.
2. Step tab gating (R-04)
   - Step 2 locked until Step 1 Next validates; Step 3 locked until Step 2 Next validates. Revisiting earlier steps does not relock later ones.
3. Primary CTA engine (US-02 / R-05–R-10)
   - Active Rework → "History & Activity Log"
   - Active Endorsement → "Update Sale"
   - Both → co-primary
   - Default → Status→Action map per VMI status incl. Print-by-FairDee vs e-Policy variants and no-CTA states (Delivered, Cancelled, Rework, e-Policy Uploaded).
4. Secondary CTA / More Actions menu (US-03)
   - Always-visible Secondary button with fixed groups: PAYMENT, POLICY ISSUANCE, DOCS & COMMS, HISTORY & ACTIVITY LOG, UPDATE SALE, FINANCE.
   - Conditional rules: Send Billing Report locked until Send Summary fired once; Manual KYC only on Installment; Purchase Policy ↔ Fetch Policy swap after first call.
5. Send Summary to Agent (US-04)
   - Greyed when Step 1 completely unfilled; preview modal; send count badge; unlocks Send Billing Report.
6. Sidebar Card 1 — Action Status (US-05)
   - Render VMI/CMI status + owner, Payment, KYC. Hide CMI rows for VMI-only sales.
   - Manual override dropdown only allows Pending Issuance (from Pending Review) and Rework Required (from any). All other statuses render read-only.

Pass 2 — Steps 1 & 2 polish (Section 13)
7. Wire Step 1 → Step 2 unlock via a real validation summary (required basic-info fields + required-tier doc slots for current scenario), with inline error list.
8. Step 2 → Step 3 validation (OCR fields + outstanding required docs warning banner).
9. Read-only lock when Sale ID exists (Steps 1 & 2 become reference-only).
10. Step 2 source tags (portal / custom / chatwoot / NID / car_reg / payment / manual) shown as ⓘ tooltip on each field; manual edit flips to manual_saved.

Pass 3 — Update Sale: Internal Information Update (Section 14)
11. New route/modal `Update Sale → Internal Information Update`:
    - 17 sections as collapsible toggles, off by default.
    - Each field shows "Current: [value]".
    - Review screen shows only toggled-on sections with [Old] → [New] per changed field.
    - Back preserves edits; Confirm writes audit entries + toast.
    - Driver slot management (1 fixed, 2–5 deletable, max 5).
    - Documents mirror of Step 1 with previews.

Pass 4 — Chatwoot variant (Section 15)
12. Behind a `chatwoot` mode flag on OpsDashboard:
    - Quotation search bar.
    - Quotation tab bar with license plate label, ✓ tick when Sale ID exists, ×, +, active highlight.
    - Entry routing: no package → Comparison Sheet (`/comparison-sheet` placeholder), has package → OPS Dashboard.
    - Completed quotation info banner.

Pass 5 — Upload Documents modal (Section 16)
13. New Upload Documents modal:
    - Split upload zones: 🔒 Internal (Admin only) and 🌐 External (Admin + Agent), accepting JPEG/PNG/PDF.
    - Download half split into Internal Documents and External Documents sections, always shown (empty state when empty), count badges, sync indicator on External rows.
    - × removes; External removal cascades to mock agent-app surface.

## Out of scope for this pass
- Real OCR, real insurer API calls, real agent-app sync — kept as mock state.
- Document Matrix expansion beyond what already exists in `data/documentRequirements.ts` / `mockDocumentMatrix.ts`.
- New design directions — this is a behavioural / structural alignment, not a visual redesign.

## Technical notes
- Primary/Secondary CTA logic centralised in `SaleDetailBar.tsx` (already partly there) + a new `useOpsCtas` hook so More Actions and Primary share the same source of truth.
- Step gating state lifted into `OpsDashboard` (replaces ad-hoc tab logic in `ContentTabs`).
- Sale-ID lock = boolean on `SaleDetail`; gates editability across Step 1/2 components.
- Update Sale flow = new `src/components/ops/UpdateSaleDialog.tsx` + supporting section components; reuses existing form primitives.
- Chatwoot tab bar = new `src/components/ops/ChatwootQuotationTabs.tsx`, mounted only when `mode === 'chatwoot'`.
- Upload Documents modal = new `src/components/ops/UploadDocumentsModal.tsx` replacing/extending current upload entrypoint.

## Question before I start
This is ~5 passes of work. Do you want me to:
- **(A)** Execute all 5 passes in one go (large diff, longer turnaround), or
- **(B)** Ship Pass 1 (page chrome + CTA engine + sidebar Card 1) first so you can review, then continue?

My recommendation: **B** — Pass 1 is where the spec diverges most from the current build, and getting CTA behaviour right unblocks the rest.
