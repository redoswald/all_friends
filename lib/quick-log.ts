import type { EventType } from "@/types";

export const QUICK_LOG_EVENT = "open-quick-log";

// Minimal event shape the sheet needs for edit mode — structurally satisfied
// by EventWithContacts wherever the timeline dispatches it.
export interface QuickLogEditEvent {
  id: string;
  title: string | null;
  date: string | Date;
  eventType: string;
  notes: string | null;
  location: string | null;
  contacts: { contact: { id: string; name: string } }[];
}

export interface QuickLogDetail {
  contactIds?: string[];
  eventType?: EventType;
  event?: QuickLogEditEvent;
}

/**
 * Open the globally-mounted quick-log sheet (mobile). Same cross-tree
 * custom-event idiom as "open-command-palette".
 */
export function openQuickLog(detail: QuickLogDetail = {}) {
  document.dispatchEvent(new CustomEvent(QUICK_LOG_EVENT, { detail }));
}
