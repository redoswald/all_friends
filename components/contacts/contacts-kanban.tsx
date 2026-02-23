"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactStatus, getStatusText } from "@/lib/cadence";
import { FUNNEL_STAGE_LABELS, FunnelStage } from "@/types";
import { Contact, Tag } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ContactWithDerived extends Contact {
  tags: { tag: Tag }[];
  lastEventDate: Date | null;
  status: ContactStatus;
}

interface ContactsKanbanProps {
  contacts: ContactWithDerived[];
}

const STAGE_ORDER: FunnelStage[] = [
  "PROSPECT",
  "ACQUAINTANCE",
  "DEVELOPING",
  "ESTABLISHED",
  "CLOSE",
  "DORMANT",
];

const STAGE_COLORS: Record<FunnelStage, string> = {
  PROSPECT: "border-t-slate-400",
  ACQUAINTANCE: "border-t-blue-400",
  DEVELOPING: "border-t-cyan-400",
  ESTABLISHED: "border-t-green-400",
  CLOSE: "border-t-emerald-500",
  DORMANT: "border-t-gray-300",
};

export function ContactsKanban({ contacts }: ContactsKanbanProps) {
  const router = useRouter();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<FunnelStage | null>(null);

  // Group contacts by funnel stage
  const contactsByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = contacts.filter((c) => c.funnelStage === stage);
    return acc;
  }, {} as Record<FunnelStage, ContactWithDerived[]>);

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDragging(contactId);
    e.dataTransfer.setData("contactId", contactId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: FunnelStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(stage);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = async (e: React.DragEvent, stage: FunnelStage) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId");
    setDragging(null);
    setDragOver(null);

    if (!contactId) return;

    // Find the contact to check if stage actually changed
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact || contact.funnelStage === stage) return;

    // Update the contact's funnel stage
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funnelStage: stage }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update contact stage:", error);
    }
  };

  const formatLastSeen = (date: Date | null, daysSince: number | null) => {
    if (!date) return "Never";
    if (daysSince === 0) return "Today";
    if (daysSince === 1) return "Yesterday";
    return `${daysSince}d ago`;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
      {STAGE_ORDER.map((stage) => (
        <div
          key={stage}
          className={cn(
            "flex-shrink-0 w-64 sm:w-72 bg-gray-50 rounded-lg",
            dragOver === stage && "ring-2 ring-blue-400 ring-inset"
          )}
          onDragOver={(e) => handleDragOver(e, stage)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, stage)}
        >
          {/* Column header */}
          <div className={cn("p-3 border-t-4 rounded-t-lg", STAGE_COLORS[stage])}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{FUNNEL_STAGE_LABELS[stage]}</h3>
              <Badge variant="secondary" className="text-xs">
                {contactsByStage[stage].length}
              </Badge>
            </div>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
            {contactsByStage[stage].map((contact) => (
              <Card
                key={contact.id}
                draggable
                onDragStart={(e) => handleDragStart(e, contact.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
                  dragging === contact.id && "opacity-50"
                )}
              >
                <Link href={`/contacts/${contact.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{contact.name}</p>
                      {contact.nickname && (
                        <p className="text-xs text-gray-500 truncate">
                          ({contact.nickname})
                        </p>
                      )}
                    </div>
                    {contact.cadenceDays && (
                      <Badge
                        variant={
                          contact.status.hasUpcomingEvent
                            ? "outline"
                            : contact.status.isOverdue
                              ? "destructive"
                              : "default"
                        }
                        className={cn(
                          "text-[10px] px-1.5 py-0 flex-shrink-0",
                          contact.status.hasUpcomingEvent
                            ? "border-teal-400 text-teal-500 bg-transparent"
                            : contact.status.isDue
                              ? "bg-amber-500 hover:bg-amber-500"
                              : contact.status.isDueSoon
                                ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-400"
                                : contact.status.isOverdue
                                  ? ""
                                  : "bg-green-500 hover:bg-green-500"
                        )}
                      >
                        {getStatusText(contact.status)}
                      </Badge>
                    )}
                  </div>

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.tags.slice(0, 2).map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                          style={
                            tag.color
                              ? { backgroundColor: `${tag.color}20`, color: tag.color }
                              : undefined
                          }
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="text-[10px] text-gray-300">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Last seen */}
                  <p className="text-[10px] text-gray-300 mt-2">
                    {formatLastSeen(contact.lastEventDate, contact.status.daysSinceLastEvent)}
                  </p>
                </Link>
              </Card>
            ))}

            {contactsByStage[stage].length === 0 && (
              <div className="text-center py-8 text-gray-300 text-sm">
                No contacts
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
