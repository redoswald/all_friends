"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/types";
import { Event, Contact } from "@prisma/client";
import { EventType } from "@/types";
import { EditEventForm } from "./edit-event-form";
import { formatDate } from "@/lib/date-utils";

interface EventWithContacts extends Event {
  contacts: { contact: Contact }[];
}

interface EventsListProps {
  events: EventWithContacts[];
  contacts: { id: string; name: string }[];
}

export function EventsList({ events, contacts }: EventsListProps) {
  const router = useRouter();
  const [editingEvent, setEditingEvent] = useState<EventWithContacts | null>(null);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No events logged yet. Log your first event to start tracking!
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  // Group events by month
  const groupedEvents: { [key: string]: EventWithContacts[] } = {};
  events.forEach((event) => {
    const monthKey = new Date(event.date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    if (!groupedEvents[monthKey]) {
      groupedEvents[monthKey] = [];
    }
    groupedEvents[monthKey].push(event);
  });

  return (
    <div className="space-y-8">
      {Object.entries(groupedEvents).map(([month, monthEvents]) => (
        <div key={month}>
          <h2 className="text-sm font-medium text-gray-500 mb-3">{month}</h2>
          <div className="space-y-3">
            {monthEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full mt-1">
                        <Calendar className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {event.title || EVENT_TYPE_LABELS[event.eventType as EventType]}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {EVENT_TYPE_LABELS[event.eventType as EventType]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(event.date)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.contacts.map(({ contact }) => (
                            <Link
                              key={contact.id}
                              href={`/contacts/${contact.id}`}
                            >
                              <Badge
                                variant="secondary"
                                className="text-xs hover:bg-gray-200"
                              >
                                {contact.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                        {event.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingEvent(event)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onSelect={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <EditEventForm
              event={editingEvent}
              contacts={contacts}
              onSuccess={() => {
                setEditingEvent(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
