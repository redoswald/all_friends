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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Event, Contact, Tag } from "@prisma/client";
import { EVENT_TYPE_LABELS, EventType } from "@/types";
import { cn } from "@/lib/utils";
import { LogEventForm } from "@/components/events/log-event-form";
import { VacationModeDialog } from "@/components/calendar/vacation-mode-dialog";
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
  isSnoozedDueDate: boolean;
}

interface CalendarViewProps {
  events: EventWithContacts[];
  contactDueDates: ContactDueDate[];
  contacts: { id: string; name: string }[];
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
  // Use first tag color, or default gray
  const firstTag = contact.tags[0]?.tag;
  return firstTag?.color || "#6b7280";
}

function getTagColor(tags: { tag: Tag }[]): string {
  const firstTag = tags[0]?.tag;
  return firstTag?.color || "#6b7280";
}

export function CalendarView({ events, contactDueDates, contacts, year, month }: CalendarViewProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleEventSuccess = () => {
    setDialogOpen(false);
    setSelectedDate(null);
    router.refresh();
  };

  // Build calendar grid
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = lastOfMonth.getDate();

  // Previous month days to show
  const prevMonthDays = startDay;
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();

  // Build weeks array
  const weeks: { date: Date; isCurrentMonth: boolean }[][] = [];
  let currentWeek: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month overflow
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    currentWeek.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month
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

  // Next month overflow
  let nextMonthDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({
      date: new Date(year, month + 1, nextMonthDay++),
      isCurrentMonth: false,
    });
  }
  weeks.push(currentWeek);

  // Add more weeks if needed (always show 6 weeks for consistency)
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
    const dateKey = new Date(event.date).toDateString();
    const existing = eventsByDate.get(dateKey) || [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  });

  // Group due dates by date string
  const dueDatesByDate = new Map<string, ContactDueDate[]>();
  contactDueDates.forEach((contact) => {
    const dueDate = new Date(contact.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const dateKey = dueDate.toDateString();
    const existing = dueDatesByDate.get(dateKey) || [];
    existing.push(contact);
    dueDatesByDate.set(dateKey, existing);
  });

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
            <div className="hidden sm:block">
              <VacationModeDialog />
            </div>
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
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map(({ date, isCurrentMonth }, dayIndex) => {
                const dateKey = date.toDateString();
                const dayEvents = eventsByDate.get(dateKey) || [];
                const dayDueDates = dueDatesByDate.get(dateKey) || [];
                const isToday = date.toDateString() === today.toDateString();
                const isPast = date < today;

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "min-h-[60px] sm:min-h-[100px] p-0.5 sm:p-1 border-r last:border-r-0 group cursor-pointer hover:bg-gray-100 transition-colors",
                      !isCurrentMonth && "bg-gray-50 hover:bg-gray-100",
                      isToday && "bg-blue-50 hover:bg-blue-100"
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

                    {/* Due dates (show before events) - hide content on very small screens, show dots instead */}
                    {dayDueDates.length > 0 && (
                      <>
                        {/* Mobile: just show colored dots */}
                        <div className="sm:hidden flex flex-wrap gap-0.5 mb-0.5">
                          {dayDueDates.slice(0, 3).map((contact) => (
                            <div
                              key={contact.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                contact.isSnoozedDueDate
                                  ? "bg-gray-300"
                                  : contact.isFutureDueDate
                                    ? "bg-violet-400"
                                    : "bg-amber-500"
                              )}
                            />
                          ))}
                          {dayDueDates.length > 3 && (
                            <span className="text-[8px] text-gray-300">+{dayDueDates.length - 3}</span>
                          )}
                        </div>
                        {/* Desktop: show full items */}
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
                        {/* Mobile: just show colored dots */}
                        <div className="sm:hidden flex flex-wrap gap-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isPast ? "bg-gray-300" : "bg-blue-500"
                              )}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-gray-300">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                        {/* Desktop: show full items */}
                        <div className="hidden sm:block space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <EventItem
                              key={event.id}
                              event={event}
                              isPast={isPast}
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
                );
              })}
            </div>
          ))}
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
      </div>
    </TooltipProvider>
  );
}

interface EventItemProps {
  event: EventWithContacts;
  isPast: boolean;
}

function EventItem({ event, isPast }: EventItemProps) {
  const eventTitle = event.title || EVENT_TYPE_LABELS[event.eventType as EventType];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "text-xs p-1 rounded cursor-pointer truncate",
            isPast ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-800"
          )}
        >
          <div className="flex items-center gap-1">
            {/* Contact initials */}
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
  const isSnoozed = contact.isSnoozedDueDate;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "text-xs p-1 rounded cursor-pointer truncate border-l-2",
            isSnoozed
              ? "bg-gray-100 text-gray-700 border-gray-300"
              : isFuture
                ? "bg-violet-50 text-violet-700 border-violet-400"
                : isToday
                  ? "bg-amber-100 text-amber-800 border-amber-500"
                  : "bg-amber-50 text-amber-700 border-amber-400"
          )}
        >
          <div className="flex items-center gap-1">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium text-white flex-shrink-0"
              style={{ backgroundColor: isSnoozed ? "#9ca3af" : color }}
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
          <p className={cn("text-xs", isSnoozed ? "text-gray-700" : isFuture ? "text-violet-600" : "text-amber-600")}>
            {isSnoozed ? "Snoozed until this date" : isFuture ? "Plan next" : isToday ? "Due today" : "Due"} &middot; Every {contact.cadenceDays} days
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
