import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { LogicControllerSection } from './LogicControllerSection';
import { useOpsLogic } from './OpsLogicContext';

/**
 * Floating dev-only FAB that opens the Logic Controller in a side sheet.
 * Visible always for prototype purposes. Marked clearly as a dev tool so
 * end-users (or screenshots) understand it isn't part of the real product.
 */
export function DevLogicControllerFab() {
  const [open, setOpen] = React.useState(false);
  const { logic, setLogic, reset } = useOpsLogic();

  return (
    <>
      <Button
        type="button"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-background"
        title="Dev: Logic Controller"
        aria-label="Open Logic Controller (dev tool)"
      >
        <Wrench className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-3">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-primary" />
              Logic Controller
              <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wide border border-border rounded px-1.5 py-0.5">
                Prototype Dev Tool
              </span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Drives Step 1 form behaviour & required document list. Not visible to end users — only used for screenshots & QA.
            </SheetDescription>
          </SheetHeader>

          <LogicControllerSection
            value={logic}
            onChange={setLogic}
            onReset={reset}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
