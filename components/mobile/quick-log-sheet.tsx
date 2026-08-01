"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { MentionInput } from "@/components/events/mention-input";
import {
  Users,
  Phone,
  MessageCircle,
  Calendar,
  MoreHorizontal,
  Plus,
  X,
  Search,
  TextCursorInput,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, SessionExpiredError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { EventType, FunnelStage } from "@/types";
import type { QuickLogEditEvent } from "@/lib/quick-log";
import {
  formatDateForInput,
  getTodayForInput,
  isDateOnlyEvent,
} from "@/lib/date-utils";

interface PickerContact {
  id: string;
  name: string;
  nickname: string | null;
  funnelStage: FunnelStage;
  lastEventDate: string | null;
  status: {
    isDue: boolean;
    isOverdue: boolean;
    daysSinceLastEvent: number | null;
  };
}

interface SelectedPerson {
  type: "existing" | "new";
  id?: string;
  name: string;
}

type WhenChoice = "today" | "yesterday" | "custom";

interface QuickLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillContactIds?: string[];
  prefillEventType?: EventType;
  editEvent?: QuickLogEditEvent | null;
}

const EVENT_TYPE_OPTIONS: {
  value: EventType;
  label: string;
  icon: typeof Users;
  selected: string;
}[] = [
  { value: "HANGOUT", label: "Hangout", icon: Users, selected: "bg-accent-50 text-accent-500 ring-accent-500" },
  { value: "CALL", label: "Call", icon: Phone, selected: "bg-teal-50 text-teal-500 ring-teal-500" },
  { value: "MESSAGE", label: "Message", icon: MessageCircle, selected: "bg-amber-50 text-amber-600 ring-amber-500" },
  { value: "EVENT", label: "Event", icon: Calendar, selected: "bg-teal-50 text-teal-400 ring-teal-400" },
  { value: "OTHER", label: "Other", icon: MoreHorizontal, selected: "bg-gray-100 text-gray-500 ring-gray-400" },
];

const STAGE_AVATAR_CLASSES: Record<string, string> = {
  CLOSE: "bg-accent-50 text-accent-500",
  ESTABLISHED: "bg-teal-50 text-teal-500",
  DEVELOPING: "bg-teal-100 text-teal-400",
  ACQUAINTANCE: "bg-amber-50 text-amber-600",
  PROSPECT: "bg-gray-100 text-gray-400",
  DORMANT: "bg-gray-100 text-gray-500",
};

function getYesterdayForInput(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateForInput(d);
}

export function QuickLogSheet({
  open,
  onOpenChange,
  prefillContactIds = [],
  prefillEventType,
  editEvent = null,
}: QuickLogSheetProps) {
  const router = useRouter();
  const isEdit = !!editEvent;

  const [contacts, setContacts] = useState<PickerContact[] | null>(null);
  const [selected, setSelected] = useState<SelectedPerson[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState<EventType>("HANGOUT");
  const [when, setWhen] = useState<WhenChoice>("today");
  const [customDate, setCustomDate] = useState(getTodayForInput());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Edit-mode contacts may not be seeded until the contact list loads, so
  // remember whether we already did it for this open.
  const seededRef = useRef(false);

  const loadContacts = useCallback(() => {
    apiFetch("/api/contacts")
      .then((res) => (res.ok ? res.json() : []))
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  // Seed all state each time the sheet opens.
  useEffect(() => {
    if (!open) {
      seededRef.current = false;
      return;
    }
    setSearchTerm("");
    setError(null);
    setSaving(false);
    if (editEvent) {
      setEventType(editEvent.eventType as EventType);
      const dateStr = formatDateForInput(editEvent.date);
      if (dateStr === getTodayForInput()) setWhen("today");
      else if (dateStr === getYesterdayForInput()) setWhen("yesterday");
      else setWhen("custom");
      setCustomDate(dateStr);
      setDetailsOpen(!!(editEvent.title || editEvent.notes || editEvent.location));
      setSelected(
        editEvent.contacts.map(({ contact }) => ({
          type: "existing",
          id: contact.id,
          name: contact.name,
        }))
      );
    } else {
      setEventType(prefillEventType ?? "HANGOUT");
      setWhen("today");
      setCustomDate(getTodayForInput());
      setDetailsOpen(false);
      setSelected([]);
      seededRef.current = prefillContactIds.length === 0;
    }
    if (!contacts) loadContacts();
    apiFetch("/api/events/locations")
      .then((res) => (res.ok ? res.json() : []))
      .then(setLocationSuggestions)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Resolve prefilled contact ids once the list is available.
  useEffect(() => {
    if (!open || isEdit || seededRef.current || !contacts) return;
    setSelected(
      prefillContactIds.flatMap((id) => {
        const c = contacts.find((pc) => pc.id === id);
        return c ? [{ type: "existing" as const, id, name: c.nickname || c.name }] : [];
      })
    );
    seededRef.current = true;
  }, [open, isEdit, contacts, prefillContactIds]);

  const suggestions = useMemo(() => {
    if (!contacts) return [];
    const available = contacts.filter(
      (c) => !selected.some((s) => s.type === "existing" && s.id === c.id)
    );
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return [...available]
        .sort((a, b) => {
          const aDue = a.status.isDue || a.status.isOverdue ? 1 : 0;
          const bDue = b.status.isDue || b.status.isOverdue ? 1 : 0;
          if (aDue !== bDue) return bDue - aDue;
          const aDate = a.lastEventDate ? new Date(a.lastEventDate).getTime() : 0;
          const bDate = b.lastEventDate ? new Date(b.lastEventDate).getTime() : 0;
          return bDate - aDate;
        })
        .slice(0, 6);
    }
    return available
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.nickname?.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [contacts, selected, searchTerm]);

  const showCreateOption =
    !!searchTerm.trim() &&
    !!contacts &&
    !contacts.some((c) => c.name.toLowerCase() === searchTerm.trim().toLowerCase()) &&
    !selected.some((s) => s.name.toLowerCase() === searchTerm.trim().toLowerCase());

  const addPerson = (contact: PickerContact) => {
    setSelected((prev) => [
      ...prev,
      { type: "existing", id: contact.id, name: contact.nickname || contact.name },
    ]);
    setSearchTerm("");
  };

  const addNewPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSelected((prev) => [...prev, { type: "new", name: trimmed }]);
    setSearchTerm("");
  };

  const removePerson = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.length === 0 || saving) return;
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const dateStr =
      when === "today"
        ? getTodayForInput()
        : when === "yesterday"
          ? getYesterdayForInput()
          : customDate;

    // When editing a timed event without changing its day, omit `date`
    // entirely so the stored time survives (a bare YYYY-MM-DD would reset it).
    const keepOriginalDate =
      isEdit &&
      !isDateOnlyEvent(editEvent!.date) &&
      dateStr === formatDateForInput(editEvent!.date);

    const payload = {
      title: (formData.get("title") as string)?.trim() || null,
      eventType,
      notes: (formData.get("notes") as string)?.trim() || null,
      location: (formData.get("location") as string)?.trim() || null,
      contactIds: selected.filter((s) => s.type === "existing").map((s) => s.id!),
      newContactNames: selected.filter((s) => s.type === "new").map((s) => s.name),
      ...(keepOriginalDate ? {} : { date: dateStr }),
    };

    try {
      const res = await apiFetch(isEdit ? `/api/events/${editEvent!.id}` : "/api/events", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.error || "Failed to save");
      }
      toast.success(isEdit ? "Moment updated" : "Moment logged");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      if (!(err instanceof SessionExpiredError)) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }

  const saveLabel =
    selected.length === 0
      ? "Pick someone first"
      : isEdit
        ? "Save changes"
        : selected.length === 1
          ? `Log moment with ${selected[0].name}`
          : `Log moment with ${selected.length} people`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="rounded-t-2xl p-0 gap-0 max-h-[92dvh] flex flex-col"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-gray-200" />
        <SheetHeader className="px-4 pt-1 pb-2">
          <SheetTitle>{isEdit ? "Edit moment" : "Log a moment"}</SheetTitle>
          <SheetDescription className="sr-only">
            Pick who it was with, what kind of moment, and when.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4">
          <div className="space-y-6 pb-4">
            {/* Who */}
            <section className="space-y-2">
              <h3 className="font-semibold">Who was it with?</h3>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.map((person, index) => (
                    <button
                      key={person.type === "existing" ? person.id : `new-${index}`}
                      type="button"
                      onClick={() => removePerson(index)}
                      className="flex min-h-10 items-center gap-1.5 rounded-full bg-accent-50 py-1.5 pl-3 pr-2 text-sm"
                    >
                      {person.name}
                      {person.type === "new" && (
                        <span className="text-xs text-gray-500">(new)</span>
                      )}
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search people"
                  value={searchTerm}
                  autoComplete="off"
                  autoCorrect="off"
                  className="h-11 pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (showCreateOption) addNewPerson(searchTerm);
                    }
                  }}
                />
              </div>
              <div className="overflow-hidden rounded-xl border">
                {showCreateOption && (
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center gap-2 border-b px-3 py-2 text-left text-sm text-accent-400"
                    onClick={() => addNewPerson(searchTerm)}
                  >
                    <Plus className="h-4 w-4" />
                    Create &quot;{searchTerm.trim()}&quot;
                  </button>
                )}
                {contacts === null ? (
                  <p className="px-3 py-3 text-sm text-gray-500">Loading people…</p>
                ) : suggestions.length === 0 && !showCreateOption ? (
                  <p className="px-3 py-3 text-sm text-gray-500">
                    {searchTerm.trim()
                      ? `No one named "${searchTerm.trim()}" yet`
                      : "No people yet — search to create someone"}
                  </p>
                ) : (
                  suggestions.map((contact, i) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => addPerson(contact)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left",
                        i > 0 && "border-t"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          STAGE_AVATAR_CLASSES[contact.funnelStage] ?? "bg-gray-100 text-gray-500"
                        )}
                      >
                        {(contact.nickname || contact.name).charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {contact.nickname || contact.name}
                        </span>
                        {contact.status.daysSinceLastEvent !== null && (
                          <span className="block text-xs text-gray-500">
                            Last seen {contact.status.daysSinceLastEvent}d ago
                          </span>
                        )}
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-accent-400" />
                    </button>
                  ))
                )}
              </div>
            </section>

            {/* What */}
            <section className="space-y-3">
              <h3 className="font-semibold">What kind of moment?</h3>
              <div className="flex justify-between gap-1">
                {EVENT_TYPE_OPTIONS.map(({ value, label, icon: Icon, selected: selectedClasses }) => {
                  const isSelected = eventType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEventType(value)}
                      className="flex flex-1 flex-col items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                          isSelected
                            ? cn("ring-2", selectedClasses)
                            : "bg-gray-100 text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          isSelected ? "text-foreground" : "text-gray-500"
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* When */}
            <section className="space-y-3">
              <h3 className="font-semibold">When?</h3>
              <div className="flex gap-2">
                {(
                  [
                    { value: "today", label: "Today" },
                    { value: "yesterday", label: "Yesterday" },
                    {
                      value: "custom",
                      label:
                        when === "custom"
                          ? new Date(`${customDate}T12:00:00`).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Other…",
                    },
                  ] as { value: WhenChoice; label: string }[]
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setWhen(value)}
                    className={cn(
                      "min-h-11 rounded-full px-4 text-sm font-medium transition-colors",
                      when === value
                        ? "bg-accent-500 text-white"
                        : "border bg-background text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {when === "custom" && (
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => e.target.value && setCustomDate(e.target.value)}
                  className="h-11"
                />
              )}
            </section>

            {/* Details fold */}
            <section className="space-y-3">
              {!detailsOpen ? (
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="flex min-h-11 items-center gap-2 text-accent-400"
                >
                  <TextCursorInput className="h-4 w-4" />
                  Add a note, place, or title
                </button>
              ) : (
                <>
                  <h3 className="font-semibold">Details</h3>
                  <MentionInput
                    name="notes"
                    placeholder="Add a note…"
                    rows={3}
                    contacts={contacts ?? []}
                    defaultValue={editEvent?.notes ?? undefined}
                  />
                  <Input
                    name="location"
                    placeholder="Where was it?"
                    list="quick-log-locations"
                    defaultValue={editEvent?.location ?? undefined}
                    className="h-11"
                  />
                  {locationSuggestions.length > 0 && (
                    <datalist id="quick-log-locations">
                      {locationSuggestions.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  )}
                  <Input
                    name="title"
                    placeholder="Title (optional)"
                    defaultValue={editEvent?.title ?? undefined}
                    className="h-11"
                  />
                </>
              )}
            </section>

            {error && <p className="text-sm text-error">{error}</p>}
          </div>

          {/* Sticky save bar */}
          <div className="sticky bottom-0 -mx-4 border-t bg-background/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
            <button
              type="submit"
              disabled={selected.length === 0 || saving}
              className={cn(
                "min-h-12 w-full rounded-3xl text-base font-medium text-white transition-all active:scale-[0.97]",
                selected.length === 0 || saving
                  ? "bg-gray-300"
                  : "bg-accent-500 shadow-[var(--shadow-accent)]"
              )}
            >
              {saving ? "Saving…" : saveLabel}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
