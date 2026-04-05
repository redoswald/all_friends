"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ChevronLeft, ChevronRight, Plus, Plane, Eye, EyeOff, Calendar as CalendarIcon } from "lucide-react";
import { Event, Contact, Tag } from "@prisma/client";
import { EVENT_TYPE_LABELS, EventType } from "@/types";
import { cn } from "@/lib/utils";
import { LogEventForm } from "@/components/events/log-event-form";
import { EditEventForm } from "@/components/events/edit-event-form";
import { EditOOODialog } from "@/components/calendar/edit-ooo-dialog";
import { CreateOOODialog } from "@/components/calendar/create-ooo-dialog";
import { formatDateForInput } from "@/lib/date-utils";

interface ContactWithTags extends Contact {
  tags: { tag: Tag }[];
}

interface EventWithContacts extends Event {
  contacts: {
    contact: ContactWithTags;
  }[];
}

interface ContactDueDate {
  id: string;
  name: string;
  cadenceDays: number | null;
  tags: { tag: Tag }[];
  dueDate: Date;
  isFutureDueDate: boolean;
}

interface OOOBlock {
  id: string;
  contactId: string;
  contactName: string;
  isSelf: boolean;
  startDate: Date;
  endDate: Date;
  label: string | null;
  destination: string | null;
}

interface CalendarViewProps {
  events: EventWithContacts[];
  contactDueDates: ContactDueDate[];
  contacts: { id: string; name: string }[];
  selfContact: { id: string; name: string } | null;
  oooBlocks: OOOBlock[];
  year: number;
  month: number;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_OF_WEEK_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getContactColor(contact: ContactWithTags): string {
  const firstTag = contact.tags[0]?.tag;
  return firstTag?.color || "#6b7280";
}

function getTagColor(tags: { tag: Tag }[]): string {
  const firstTag = tags[0]?.tag;
  return firstTag?.color || "#6b7280";
}

function toDateKey(d: Date): string {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.toDateString();
}

export function CalendarView({ events, contactDueDates, contacts, selfContact, oooBlocks, year, month }: CalendarViewProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventWithContacts | null>(null);
  const [editingOOO, setEditingOOO] = useState<OOOBlock | null>(null);
  const [creatingOOODate, setCreatingOOODate] = useState<Date | null>(null);
  const [creatingOOOSelf, setCreatingOOOSelf] = useState(false);
  const [showOOO, setShowOOO] = useState(true);
  const [expandedOOOWeeks, setExpandedOOOWeeks] = useState<Set<number>>(new Set());

  const MAX_VISIBLE_OOO_BARS = 3;

  const toggleOOOWeekExpand = (weekIndex: number) => {
    setExpandedOOOWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekIndex)) {
        next.delete(weekIndex);
      } else {
        next.add(weekIndex);
      }
      return next;
    });
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleEventClick = (event: EventWithContacts, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
  };

  const handleEventSuccess = () => {
    setDialogOpen(false);
    setSelectedDate(null);
    router.refresh();
  };

  const handleEditSuccess = () => {
    setEditingEvent(null);
    router.refresh();
  };

  // Build calendar grid
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = lastOfMonth.getDate();

  const prevMonthDays = startDay;
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();

  const weeks: { date: Date; isCurrentMonth: boolean }[][] = [];
  let currentWeek: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = prevMonthDays - 1; i >= 0; i--) {
    currentWeek.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  let nextMonthDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({
      date: new Date(year, month + 1, nextMonthDay++),
      isCurrentMonth: false,
    });
  }
  weeks.push(currentWeek);

  while (weeks.length < 6) {
    currentWeek = [];
    for (let i = 0; i < 7; i++) {
      currentWeek.push({
        date: new Date(year, month + 1, nextMonthDay++),
        isCurrentMonth: false,
      });
    }
    weeks.push(currentWeek);
  }

  // Group events by date string
  const eventsByDate = new Map<string, EventWithContacts[]>();
  events.forEach((event) => {
    const dateKey = toDateKey(event.date);
    const existing = eventsByDate.get(dateKey) || [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  });

  // Group due dates by date string
  const dueDatesByDate = new Map<string, ContactDueDate[]>();
  contactDueDates.forEach((contact) => {
    const dateKey = toDateKey(contact.dueDate);
    const existing = dueDatesByDate.get(dateKey) || [];
    existing.push(contact);
    dueDatesByDate.set(dateKey, existing);
  });

  // Build set of dates that have self-OOO (for day cell tinting)
  const selfOOODates = new Set<string>();
  if (showOOO) {
    oooBlocks.filter((b) => b.isSelf).forEach((block) => {
      const start = new Date(block.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(block.endDate);
      end.setHours(0, 0, 0, 0);
      const cursor = new Date(start);
      while (cursor <= end) {
        selfOOODates.add(cursor.toDateString());
        cursor.setDate(cursor.getDate() + 1);
      }
    });
  }

  // Calculate OOO bars for a given week (returns bars with column start/span)
  function getOOOBarsForWeek(week: { date: Date; isCurrentMonth: boolean }[]) {
    if (!showOOO || oooBlocks.length === 0) return [];

    const weekStart = new Date(week[0].date);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(week[6].date);
    weekEnd.setHours(23, 59, 59, 999);

    const bars: {
      block: OOOBlock;
      colStart: number; // 0-indexed
      colSpan: number;
      isStart: boolean; // does the bar start in this week?
      isEnd: boolean; // does the bar end in this week?
    }[] = [];

    oooBlocks.forEach((block) => {
      const blockStart = new Date(block.startDate);
      blockStart.setHours(0, 0, 0, 0);
      const blockEnd = new Date(block.endDate);
      blockEnd.setHours(0, 0, 0, 0);

      // Does this block overlap this week?
      if (blockEnd < weekStart || blockStart > weekEnd) return;

      const visibleStart = blockStart < weekStart ? weekStart : blockStart;
      const visibleEnd = blockEnd > weekEnd ? weekEnd : blockEnd;

      const colStart = Math.round((visibleStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      const colEnd = Math.round((visibleEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      const colSpan = colEnd - colStart + 1;

      bars.push({
        block,
        colStart,
        colSpan,
        isStart: blockStart >= weekStart,
        isEnd: blockEnd <= weekEnd,
      });
    });

    // Sort: self first, then by start column
    bars.sort((a, b) => {
      if (a.block.isSelf !== b.block.isSelf) return a.block.isSelf ? -1 : 1;
      return a.colStart - b.colStart;
    });

    return bars;
  }

  const navigateMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    router.push(`/calendar?year=${newYear}&month=${newMonth}`);
  };

  const goToToday = () => {
    const now = new Date();
    router.push(`/calendar?year=${now.getFullYear()}&month=${now.getMonth()}`);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-base sm:text-lg font-medium ml-1 sm:ml-2">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {oooBlocks.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showOOO ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setShowOOO(!showOOO)}
                    className={cn(
                      "gap-1.5",
                      showOOO && "border-sky-300 text-sky-700"
                    )}
                  >
                    {showOOO ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    <Plane className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">OOO</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showOOO ? "Hide OOO bars" : "Show OOO bars"}
                </TooltipContent>
              </Tooltip>
            )}
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm font-medium text-gray-500"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{DAYS_OF_WEEK_SHORT[i]}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, weekIndex) => {
            const oooBars = getOOOBarsForWeek(week);

            return (
              <div key={weekIndex} className="border-b last:border-b-0">
                {/* OOO bars row */}
                {oooBars.length > 0 && (() => {
                  const isExpanded = expandedOOOWeeks.has(weekIndex);
                  const needsCollapse = oooBars.length > MAX_VISIBLE_OOO_BARS;
                  const visibleBars = needsCollapse && !isExpanded
                    ? oooBars.slice(0, MAX_VISIBLE_OOO_BARS - 1)
                    : oooBars;
                  const hiddenCount = oooBars.length - visibleBars.length;

                  return (
                  <div className="grid grid-cols-7 relative">
                    {visibleBars.map((bar) => (
                      <Tooltip key={bar.block.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-5 flex items-center gap-1 px-1.5 text-[10px] sm:text-xs font-medium cursor-pointer truncate hover:brightness-95 transition-all",
                              bar.block.isSelf
                                ? "bg-sky-200 text-sky-900"
                                : "bg-sky-100 text-sky-800",
                              bar.isStart && "rounded-l-sm ml-0.5",
                              bar.isEnd && "rounded-r-sm mr-0.5",
                            )}
                            style={{
                              gridColumn: `${bar.colStart + 1} / span ${bar.colSpan}`,
                            }}
                            onClick={() => setEditingOOO(bar.block)}
                          >
                            <Plane className="h-3 w-3 flex-shrink-0 hidden sm:block" />
                            <span className="truncate">
                              {bar.block.contactName}
                              {bar.block.destination && ` → ${bar.block.destination}`}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {bar.block.contactName} — {bar.block.label || "Away"}
                            </p>
                            {bar.block.destination && (
                              <p className="text-xs text-sky-600">→ {bar.block.destination}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(bar.block.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" – "}
                              {new Date(bar.block.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {needsCollapse && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="h-5 flex items-center gap-1 px-1.5 text-[10px] sm:text-xs font-medium cursor-pointer truncate bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors rounded-sm mx-0.5"
                            style={{ gridColumn: "1 / span 7" }}
                            onClick={() => toggleOOOWeekExpand(weekIndex)}
                          >
                            <Plane className="h-3 w-3 flex-shrink-0 hidden sm:block" />
                            {isExpanded
                              ? "Show less"
                              : `+${hiddenCount} more away`
                            }
                          </div>
                        </TooltipTrigger>
                        {!isExpanded && (
                          <TooltipContent side="bottom">
                            <div className="space-y-1">
                              {oooBars.slice(MAX_VISIBLE_OOO_BARS - 1).map((bar) => (
                                <p key={bar.block.id} className="text-xs">
                                  {bar.block.contactName}
                                  {bar.block.destination && ` → ${bar.block.destination}`}
                                </p>
                              ))}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                  );
                })()}

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {week.map(({ date, isCurrentMonth }, dayIndex) => {
                    const dateKey = date.toDateString();
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const dayDueDates = dueDatesByDate.get(dateKey) || [];
                    const hasSelfOOO = selfOOODates.has(dateKey);
                    const isToday = date.toDateString() === today.toDateString();
                    const isPast = date < today;

                    return (
                      <ContextMenu key={dayIndex}>
                        <ContextMenuTrigger asChild>
                      <div
                        className={cn(
                          "min-h-[60px] sm:min-h-[100px] p-0.5 sm:p-1 border-r last:border-r-0 group cursor-pointer hover:bg-gray-100 transition-colors",
                          !isCurrentMonth && "bg-gray-50 hover:bg-gray-100",
                          isToday && !hasSelfOOO && "bg-blue-50 hover:bg-blue-100",
                          hasSelfOOO && "bg-sky-50/50 hover:bg-sky-100/50"
                        )}
                        onClick={() => handleDayClick(date)}
                      >
                        {/* Day number and add button */}
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <div
                            className={cn(
                              "text-xs sm:text-sm font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full",
                              !isCurrentMonth && "text-gray-300",
                              isToday && "bg-blue-600 text-white"
                            )}
                          >
                            {date.getDate()}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                            <Plus className="h-4 w-4 text-gray-300" />
                          </div>
                        </div>

                        {/* Due dates */}
                        {dayDueDates.length > 0 && (
                          <>
                            <div className="sm:hidden flex flex-wrap gap-0.5 mb-0.5">
                              {dayDueDates.slice(0, 3).map((contact) => (
                                <div
                                  key={contact.id}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    contact.isFutureDueDate
                                      ? "bg-violet-400"
                                      : "bg-amber-500"
                                  )}
                                />
                              ))}
                              {dayDueDates.length > 3 && (
                                <span className="text-[8px] text-gray-300">+{dayDueDates.length - 3}</span>
                              )}
                            </div>
                            <div className="hidden sm:block space-y-1 mb-1">
                              {dayDueDates.slice(0, 2).map((contact) => (
                                <DueDateItem
                                  key={contact.id}
                                  contact={contact}
                                  isToday={isToday}
                                />
                              ))}
                              {dayDueDates.length > 2 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-gray-500 px-1 cursor-pointer">
                                      +{dayDueDates.length - 2} more
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <div className="space-y-1">
                                      {dayDueDates.slice(2).map((contact) => (
                                        <div key={contact.id} className="text-xs">
                                          {contact.name}
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </>
                        )}

                        {/* Events */}
                        {dayEvents.length > 0 && (
                          <>
                            <div className="sm:hidden flex flex-wrap gap-0.5">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isPast ? "bg-gray-300" : "bg-blue-500"
                                  )}
                                  onClick={(e) => handleEventClick(event, e)}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <span className="text-[8px] text-gray-300">+{dayEvents.length - 3}</span>
                              )}
                            </div>
                            <div className="hidden sm:block space-y-1">
                              {dayEvents.slice(0, 3).map((event) => (
                                <EventItem
                                  key={event.id}
                                  event={event}
                                  isPast={isPast}
                                  onClick={(e) => handleEventClick(event, e)}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-xs text-gray-500 px-1">
                                  +{dayEvents.length - 3} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleDayClick(date)}>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {isPast ? "Log" : "Plan"} Event
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => {
                            setCreatingOOOSelf(false);
                            setCreatingOOODate(date);
                          }}>
                            <Plane className="h-4 w-4 mr-2" />
                            {isPast ? "Log" : "Plan"} OOO
                          </ContextMenuItem>
                          {selfContact && (
                            <ContextMenuItem onClick={() => {
                              setCreatingOOOSelf(true);
                              setCreatingOOODate(date);
                            }}>
                              <Plane className="h-4 w-4 mr-2" />
                              {isPast ? "Log" : "Plan"} OOO (self)
                            </ContextMenuItem>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Event Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Log Event for {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </DialogTitle>
            </DialogHeader>
            {selectedDate && (
              <LogEventForm
                contacts={contacts}
                defaultDate={formatDateForInput(selectedDate)}
                onSuccess={handleEventSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) setEditingEvent(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            {editingEvent && (
              <EditEventForm
                event={editingEvent}
                contacts={contacts}
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit OOO Dialog */}
        <EditOOODialog
          oooBlock={editingOOO}
          onOpenChange={(open) => { if (!open) setEditingOOO(null); }}
        />

        {/* Create OOO Dialog */}
        <CreateOOODialog
          open={!!creatingOOODate}
          onOpenChange={(open) => { if (!open) { setCreatingOOODate(null); setCreatingOOOSelf(false); } }}
          contacts={contacts}
          selfContact={selfContact}
          defaultStartDate={creatingOOODate ?? undefined}
          defaultSelf={creatingOOOSelf}
          isPast={creatingOOODate ? creatingOOODate < today : false}
        />
      </div>
    </TooltipProvider>
  );
}

interface EventItemProps {
  event: EventWithContacts;
  isPast: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function EventItem({ event, isPast, onClick }: EventItemProps) {
  const eventTitle = event.title || EVENT_TYPE_LABELS[event.eventType as EventType];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={onClick}
          className={cn(
            "text-xs p-1 rounded cursor-pointer truncate",
            isPast ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-800"
          )}
        >
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {event.contacts.slice(0, 3).map(({ contact }) => (
                <span
                  key={contact.id}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium text-white"
                  style={{ backgroundColor: getContactColor(contact) }}
                >
                  {getInitials(contact.name).charAt(0)}
                </span>
              ))}
              {event.contacts.length > 3 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium bg-gray-300 text-white">
                  +{event.contacts.length - 3}
                </span>
              )}
            </div>
            <span className="truncate">{eventTitle}</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{eventTitle}</p>
          <p className="text-xs text-gray-500">
            {EVENT_TYPE_LABELS[event.eventType as EventType]} &middot;{" "}
            {new Date(event.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            {event.contacts.map(({ contact }) => (
              <span
                key={contact.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-white"
                style={{ backgroundColor: getContactColor(contact) }}
              >
                {contact.name}
              </span>
            ))}
          </div>
          {event.notes && (
            <p className="text-xs text-gray-700 pt-1 border-t mt-1">
              {event.notes}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface DueDateItemProps {
  contact: ContactDueDate;
  isToday: boolean;
}

function DueDateItem({ contact, isToday }: DueDateItemProps) {
  const color = getTagColor(contact.tags);
  const isFuture = contact.isFutureDueDate;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "text-xs p-1 rounded cursor-pointer truncate border-l-2",
            isFuture
              ? "bg-violet-50 text-violet-700 border-violet-400"
              : isToday
                ? "bg-amber-100 text-amber-800 border-amber-500"
                : "bg-amber-50 text-amber-700 border-amber-400"
          )}
        >
          <div className="flex items-center gap-1">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium text-white flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              {getInitials(contact.name).charAt(0)}
            </span>
            <span className="truncate">{contact.name}</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {getInitials(contact.name)}
            </span>
            {contact.name}
          </p>
          <p className={cn("text-xs", isFuture ? "text-violet-600" : "text-amber-600")}>
            {isFuture ? "Plan next" : isToday ? "Due today" : "Due"} &middot; Every {contact.cadenceDays} days
          </p>
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {contact.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-white"
                  style={{ backgroundColor: tag.color || "#6b7280" }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
