import type { Contact, Tag, Event } from "@prisma/client";
import type { ContactStatus } from "@/lib/cadence";

export type { Contact, Tag, Event };

// Define enum types as string literals since SQLite doesn't support enums
export type FunnelStage =
  | "PROSPECT"
  | "ACQUAINTANCE"
  | "DEVELOPING"
  | "ESTABLISHED"
  | "CLOSE"
  | "DORMANT";

export type EventType =
  | "HANGOUT"
  | "CALL"
  | "MESSAGE"
  | "EVENT"
  | "OTHER";

export interface ContactWithRelations extends Contact {
  tags: { tag: Tag }[];
  events: { event: Event }[];
}

export interface ContactWithDerived extends ContactWithRelations {
  lastEventDate: Date | null;
  status: ContactStatus;
}

export interface EventWithContacts extends Event {
  contacts: { contact: Contact }[];
}

export interface TagWithCount extends Tag {
  _count: {
    contacts: number;
  };
}

export interface DashboardStats {
  totalContacts: number;
  eventsThisMonth: number;
  overdueContacts: number;
  dueContacts: number;
}

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  PROSPECT: "Prospect",
  ACQUAINTANCE: "Acquaintance",
  DEVELOPING: "Developing",
  ESTABLISHED: "Established",
  CLOSE: "Close",
  DORMANT: "Dormant",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  HANGOUT: "Hangout",
  CALL: "Call",
  MESSAGE: "Message",
  EVENT: "Event",
  OTHER: "Other",
};
