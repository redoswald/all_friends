import type { Contact, Tag, Event, ContactField, ImportantDate, ContactRelationship } from "@prisma/client";
import type { ContactStatus } from "@/lib/cadence";

export type { Contact, Tag, Event, ContactField, ImportantDate, ContactRelationship };

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

// Contact Field Types
export type ContactFieldType = "EMAIL" | "PHONE" | "SOCIAL" | "CUSTOM";

export const CONTACT_FIELD_TYPE_LABELS: Record<ContactFieldType, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  SOCIAL: "Social",
  CUSTOM: "Custom",
};

export const SOCIAL_MEDIA_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp", protocol: "https://wa.me/" },
  { value: "telegram", label: "Telegram", protocol: "https://t.me/" },
  { value: "twitter", label: "Twitter/X", protocol: "https://twitter.com/" },
  { value: "linkedin", label: "LinkedIn", protocol: "https://linkedin.com/in/" },
  { value: "instagram", label: "Instagram", protocol: "https://instagram.com/" },
  { value: "facebook", label: "Facebook", protocol: "https://facebook.com/" },
  { value: "signal", label: "Signal", protocol: null },
  { value: "other", label: "Other", protocol: null },
] as const;

export const PHONE_LABELS = ["Mobile", "Home", "Work", "Other"] as const;
export const EMAIL_LABELS = ["Personal", "Work", "Other"] as const;

// Important Date Types
export type ImportantDateType = "BIRTHDAY" | "ANNIVERSARY" | "CUSTOM";

export const IMPORTANT_DATE_TYPE_LABELS: Record<ImportantDateType, string> = {
  BIRTHDAY: "Birthday",
  ANNIVERSARY: "Anniversary",
  CUSTOM: "Custom",
};

// Relationship Types
export type RelationshipType =
  | "SPOUSE"
  | "PARTNER"
  | "PARENT"
  | "CHILD"
  | "SIBLING"
  | "FRIEND"
  | "COLLEAGUE"
  | "BOSS";

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  SPOUSE: "Spouse",
  PARTNER: "Partner",
  PARENT: "Parent",
  CHILD: "Child",
  SIBLING: "Sibling",
  FRIEND: "Friend",
  COLLEAGUE: "Colleague",
  BOSS: "Boss",
};

// Inverse relationships for bidirectional creation
export const INVERSE_RELATIONSHIPS: Record<RelationshipType, RelationshipType> = {
  SPOUSE: "SPOUSE",
  PARTNER: "PARTNER",
  PARENT: "CHILD",
  CHILD: "PARENT",
  SIBLING: "SIBLING",
  FRIEND: "FRIEND",
  COLLEAGUE: "COLLEAGUE",
  BOSS: "COLLEAGUE",
};

// Extended interfaces for new features
export interface ContactFieldWithId extends ContactField {
  id: string;
}

export interface ImportantDateWithId extends ImportantDate {
  id: string;
}

export interface ContactRelationshipWithRelated extends ContactRelationship {
  relatedContact: { id: string; name: string };
}

export interface ContactWithAllRelations extends Contact {
  tags: { tag: Tag }[];
  events: { event: Event }[];
  fields: ContactField[];
  importantDates: ImportantDate[];
  relationships: ContactRelationshipWithRelated[];
  relatedRelationships: (ContactRelationship & { contact: { id: string; name: string } })[];
}
