"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Users, PartyPopper } from "lucide-react";
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

export function NeedsAttentionList({ contacts, totalContacts }: NeedsAttentionListProps) {
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
        <Link
          key={contact.id}
          href={`/contacts/${contact.id}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-accent-50 transition-colors border gap-2"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0 group">
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
          </div>
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
            <Badge
              variant="default"
              className={
                contact.status.isOverdue
                  ? "bg-accent-300 whitespace-nowrap"
                  : "bg-amber-500 whitespace-nowrap"
              }
            >
              {getStatusText(contact.status)}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
