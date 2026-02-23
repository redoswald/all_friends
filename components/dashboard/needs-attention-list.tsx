"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Users, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { getStatusText, ContactStatus } from "@/lib/cadence";
import { FUNNEL_STAGE_LABELS, FunnelStage } from "@/types";
import { Tag } from "@prisma/client";

interface ContactWithStatus {
  id: string;
  name: string;
  funnelStage: string;
  lastEventDate: Date | null;
  tags: { tag: Tag }[];
  status: ContactStatus;
}

interface NeedsAttentionListProps {
  contacts: ContactWithStatus[];
  totalContacts: number;
}

const SNOOZE_OPTIONS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

export function NeedsAttentionList({ contacts, totalContacts }: NeedsAttentionListProps) {
  const router = useRouter();
  const [snoozing, setSnoozing] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const handleSnooze = async (contactId: string, days: number) => {
    setSnoozing(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      if (res.ok) {
        toast.success("Contact snoozed");
        setOpenPopover(null);
        window.location.reload();
      } else {
        toast.error("Failed to snooze contact");
      }
    } catch (error) {
      console.error("Failed to snooze:", error);
    } finally {
      setSnoozing(null);
    }
  };

  if (contacts.length === 0) {
    if (totalContacts === 0) {
      return (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to get started!"
          actionLabel="Add Contact"
          actionHref="/contacts"
        />
      );
    }
    return (
      <EmptyState
        icon={PartyPopper}
        title="You're all caught up!"
        description="No contacts need attention right now."
      />
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-accent-50 transition-colors border gap-2"
        >
          <Link
            href={`/contacts/${contact.id}`}
            className="flex items-center gap-3 flex-1 min-w-0 group"
          >
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                contact.status.isOverdue ? "bg-accent-300" : "bg-amber-500"
              }`}
            />
            <div className="min-w-0">
              <p className="font-medium truncate group-hover:text-accent-400">{contact.name}</p>
              <p className="text-sm text-gray-500 truncate">
                {FUNNEL_STAGE_LABELS[contact.funnelStage as FunnelStage]}
                {contact.lastEventDate && (
                  <span className="hidden sm:inline">
                    {" · "}
                    Last seen {contact.status.daysSinceLastEvent} days ago
                  </span>
                )}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Hide tags on mobile */}
            <div className="hidden md:flex items-center gap-2">
              {contact.tags.slice(0, 2).map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
            <Popover
              open={openPopover === contact.id}
              onOpenChange={(open) => setOpenPopover(open ? contact.id : null)}
            >
              <PopoverTrigger asChild>
                <button
                  className="focus:outline-none"
                  disabled={snoozing === contact.id}
                >
                  <Badge
                    variant="default"
                    className={
                      contact.status.isOverdue
                        ? "bg-accent-300 hover:bg-accent-400 cursor-pointer whitespace-nowrap"
                        : "bg-amber-500 hover:bg-amber-600 cursor-pointer whitespace-nowrap"
                    }
                  >
                    {snoozing === contact.id ? "Snoozing..." : getStatusText(contact.status)}
                  </Badge>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <p className="text-sm font-medium mb-2 px-2">Snooze for...</p>
                <div className="space-y-1">
                  {SNOOZE_OPTIONS.map((option) => (
                    <Button
                      key={option.days}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start hover:text-accent-400 hover:bg-accent-50"
                      onClick={() => handleSnooze(contact.id, option.days)}
                      disabled={snoozing === contact.id}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      ))}
    </div>
  );
}
