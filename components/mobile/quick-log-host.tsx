"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { QuickLogSheet } from "@/components/mobile/quick-log-sheet";
import { QUICK_LOG_EVENT, type QuickLogDetail } from "@/lib/quick-log";

/**
 * Mounted once in the app layout: renders the mobile FAB and the single
 * quick-log sheet instance, opened via openQuickLog() from anywhere.
 */
export function QuickLogHost() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<QuickLogDetail>({});

  useEffect(() => {
    const handler = (e: Event) => {
      setDetail((e as CustomEvent<QuickLogDetail>).detail ?? {});
      setOpen(true);
    };
    document.addEventListener(QUICK_LOG_EVENT, handler);
    return () => document.removeEventListener(QUICK_LOG_EVENT, handler);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Log a moment"
        onClick={() => {
          setDetail({});
          setOpen(true);
        }}
        className="md:hidden fixed right-5 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-[0_4px_12px_rgba(209,69,69,0.35)] transition-transform active:scale-[0.92]"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <QuickLogSheet
        open={open}
        onOpenChange={setOpen}
        prefillContactIds={detail.contactIds}
        prefillEventType={detail.eventType}
        editEvent={detail.event ?? null}
      />
    </>
  );
}
