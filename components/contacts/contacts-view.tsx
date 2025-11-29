"use client";

import { useState } from "react";
import { ContactsHeader, ViewMode } from "./contacts-header";
import { ContactsTable } from "./contacts-table";
import { ContactsKanban } from "./contacts-kanban";
import { ContactStatus } from "@/lib/cadence";
import { Contact, Tag } from "@prisma/client";

interface ContactWithDerived extends Contact {
  tags: { tag: Tag }[];
  lastEventDate: Date | null;
  status: ContactStatus;
}

interface ContactsViewProps {
  contacts: ContactWithDerived[];
  tags: Tag[];
}

export function ContactsView({ contacts, tags }: ContactsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <div className="space-y-6">
      <ContactsHeader
        tags={tags}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {viewMode === "list" ? (
        <ContactsTable contacts={contacts} tags={tags} />
      ) : (
        <ContactsKanban contacts={contacts} />
      )}
    </div>
  );
}
