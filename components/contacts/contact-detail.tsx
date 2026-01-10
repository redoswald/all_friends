"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Plus, Calendar, Plane } from "lucide-react";
import { ContactStatus, getStatusText, CADENCE_OPTIONS, getAnnualFrequencyText } from "@/lib/cadence";
import { FUNNEL_STAGE_LABELS, EVENT_TYPE_LABELS } from "@/types";
import { Contact, Tag, Event, ContactField, ImportantDate, ContactRelationship, ContactOOOPeriod } from "@prisma/client";
import { FunnelStage, EventType } from "@/types";
import { EditContactForm } from "./edit-contact-form";
import { LogEventForm } from "@/components/events/log-event-form";
import { EditEventForm } from "@/components/events/edit-event-form";
import { SetAwayDialog } from "./set-away-dialog";
import { ContactFieldsSection } from "./contact-fields-section";
import { ImportantDatesSection } from "./important-dates-section";
import { RelationshipsSection } from "./relationships-section";
import { OOOPeriodsSection } from "./ooo-periods-section";
import { formatDate } from "@/lib/date-utils";

interface RelationshipWithRelated extends ContactRelationship {
  relatedContact: { id: string; name: string };
}

interface RelationshipFromOthers extends ContactRelationship {
  contact: { id: string; name: string };
}

interface ContactWithRelations extends Contact {
  tags: { tag: Tag }[];
  events: {
    event: Event & {
      contacts: { contact: { id: string; name: string } }[];
    };
  }[];
  fields: ContactField[];
  importantDates: ImportantDate[];
  relationships: RelationshipWithRelated[];
  relatedRelationships: RelationshipFromOthers[];
  oooPeriods: ContactOOOPeriod[];
  lastEventDate: Date | null;
  status: ContactStatus;
  snoozedUntil: Date | null;
}

interface ContactDetailProps {
  contact: ContactWithRelations;
  tags: Tag[];
  contacts: { id: string; name: string }[];
}

type EventWithContacts = Event & {
  contacts: { contact: { id: string; name: string } }[];
};

export function ContactDetail({ contact, tags, contacts }: ContactDetailProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [awayDialogOpen, setAwayDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithContacts | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/contacts");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const getCadenceLabel = (days: number | null) => {
    if (!days) return "No target";
    const option = CADENCE_OPTIONS.find((o) => o.value === days);
    return option ? option.label : `${days} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/contacts">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold truncate">{contact.name}</h1>
            {contact.nickname && (
              <p className="text-gray-500 text-sm truncate">({contact.nickname})</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log Event</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Log Event</DialogTitle>
              </DialogHeader>
              <LogEventForm
                contacts={contacts}
                defaultContactIds={[contact.id]}
                onSuccess={() => {
                  setEventDialogOpen(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAwayDialogOpen(true)}>
                <Plane className="h-4 w-4 mr-2" />
                {contact.status.isAway ? "Update Away" : "Set Away"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onSelect={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <EditContactForm
            contact={contact}
            tags={tags}
            onSuccess={() => {
              setEditDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
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

      <SetAwayDialog
        contactId={contact.id}
        contactName={contact.name}
        currentOOOPeriod={contact.status.currentOOOPeriod ? {
          id: contact.oooPeriods.find(p =>
            new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date()
          )?.id || "",
          endDate: contact.status.currentOOOPeriod.endDate,
          label: contact.status.currentOOOPeriod.label,
        } : null}
        open={awayDialogOpen}
        onOpenChange={setAwayDialogOpen}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {contact.relationship && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium">{contact.relationship}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Stage</p>
                  <p className="font-medium">
                    {FUNNEL_STAGE_LABELS[contact.funnelStage as FunnelStage]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cadence</p>
                  <p className="font-medium">
                    {getCadenceLabel(contact.cadenceDays)}
                    {contact.cadenceDays && (
                      <span className="text-gray-500 font-normal ml-1">
                        ({getAnnualFrequencyText(contact.cadenceDays)})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Seen</p>
                  <p className="font-medium">
                    {contact.lastEventDate
                      ? `${contact.status.daysSinceLastEvent} days ago`
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {contact.status.isAway && contact.status.currentOOOPeriod ? (
                    <Badge
                      variant="outline"
                      className="border-purple-400 text-purple-600 bg-purple-50"
                    >
                      <Plane className="h-3 w-3 mr-1" />
                      Away until {new Date(contact.status.currentOOOPeriod.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {contact.status.currentOOOPeriod.label && ` (${contact.status.currentOOOPeriod.label})`}
                    </Badge>
                  ) : contact.snoozedUntil && new Date(contact.snoozedUntil) > new Date() ? (
                    <Badge
                      variant="outline"
                      className="border-gray-400 text-gray-600 bg-gray-50"
                    >
                      Snoozed until {new Date(contact.snoozedUntil).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  ) : contact.status.hasUpcomingEvent ? (
                    <Badge
                      variant="outline"
                      className="border-blue-500 text-blue-600"
                    >
                      {getStatusText(contact.status)}
                    </Badge>
                  ) : contact.status.hasCadence ? (
                    <Badge
                      variant={contact.status.isOverdue ? "destructive" : "outline"}
                      className={
                        contact.status.isDue && !contact.status.isOverdue
                          ? "border-amber-500 text-amber-600"
                          : !contact.status.isOverdue && !contact.status.isDue
                          ? "border-green-500 text-green-600"
                          : ""
                      }
                    >
                      {getStatusText(contact.status)}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">No cadence set</span>
                  )}
                </div>
              </div>

              {contact.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          style={
                            tag.color
                              ? { backgroundColor: `${tag.color}20`, color: tag.color }
                              : undefined
                          }
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {contact.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                    <p className="whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <ContactFieldsSection
            contactId={contact.id}
            fields={contact.fields}
          />

          <ImportantDatesSection
            contactId={contact.id}
            dates={contact.importantDates}
          />

          <RelationshipsSection
            contactId={contact.id}
            contactName={contact.name}
            relationships={contact.relationships}
            relatedRelationships={contact.relatedRelationships}
            allContacts={contacts}
          />

          <OOOPeriodsSection
            contactId={contact.id}
            periods={contact.oooPeriods}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event History</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.events.length === 0 ? (
                <p className="text-gray-500 text-sm">No events logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {contact.events.map(({ event }) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Calendar className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {event.title || EVENT_TYPE_LABELS[event.eventType as EventType]}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {EVENT_TYPE_LABELS[event.eventType as EventType]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.date)}
                        </p>
                        {event.contacts.length > 1 && (
                          <p className="text-sm text-gray-500">
                            with{" "}
                            {event.contacts
                              .filter((c) => c.contact.id !== contact.id)
                              .map((c) => c.contact.name)
                              .join(", ")}
                          </p>
                        )}
                        {event.notes && (
                          <p className="text-sm mt-1 text-gray-600">{event.notes}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                            onSelect={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Events</span>
                <span className="font-medium">{contact.events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium">
                  {new Date(contact.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
