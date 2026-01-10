import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cadenceDays: z.number().int().positive().optional().nullable(),
  funnelStage: z.enum([
    "PROSPECT",
    "ACQUAINTANCE",
    "DEVELOPING",
    "ESTABLISHED",
    "CLOSE",
    "DORMANT",
  ]).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

// Parse date string as local date and convert to UTC noon
// This avoids timezone issues where "2025-11-28" could become Nov 27 in some timezones
function parseLocalDateToUTC(dateStr: string): Date {
  // If it's already an ISO string with time, parse directly
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  // For YYYY-MM-DD format, treat as local date at noon UTC
  // This ensures the date stays the same regardless of timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export const createEventSchema = z.object({
  title: z.string().optional().nullable(),
  date: z.string().transform(parseLocalDateToUTC),
  eventType: z.enum(["HANGOUT", "CALL", "MESSAGE", "EVENT", "OTHER"]).optional(),
  notes: z.string().optional().nullable(),
  contactIds: z.array(z.string()).optional().default([]),
  newContactNames: z.array(z.string()).optional().default([]),
}).refine(
  (data) => data.contactIds.length > 0 || data.newContactNames.length > 0,
  { message: "At least one contact is required" }
);

export const updateEventSchema = z.object({
  title: z.string().optional().nullable(),
  date: z.string().transform(parseLocalDateToUTC).optional(),
  eventType: z.enum(["HANGOUT", "CALL", "MESSAGE", "EVENT", "OTHER"]).optional(),
  notes: z.string().optional().nullable(),
  contactIds: z.array(z.string()).optional(),
  newContactNames: z.array(z.string()).optional().default([]),
});

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional().nullable(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;

// Contact Field Schemas
export const createContactFieldSchema = z.object({
  fieldType: z.enum(["EMAIL", "PHONE", "SOCIAL", "CUSTOM"]),
  label: z.string().optional().nullable(),
  value: z.string().min(1, "Value is required"),
  protocol: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

export const updateContactFieldSchema = createContactFieldSchema.partial();

export type CreateContactFieldInput = z.infer<typeof createContactFieldSchema>;
export type UpdateContactFieldInput = z.infer<typeof updateContactFieldSchema>;

// Important Date Schemas
export const createImportantDateSchema = z.object({
  dateType: z.enum(["BIRTHDAY", "ANNIVERSARY", "CUSTOM"]),
  label: z.string().optional().nullable(),
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
});

export const updateImportantDateSchema = createImportantDateSchema.partial();

export type CreateImportantDateInput = z.infer<typeof createImportantDateSchema>;
export type UpdateImportantDateInput = z.infer<typeof updateImportantDateSchema>;

// Contact Relationship Schemas
export const createRelationshipSchema = z.object({
  relatedId: z.string().min(1, "Related contact is required"),
  relationshipType: z.enum([
    "SPOUSE",
    "PARTNER",
    "PARENT",
    "CHILD",
    "SIBLING",
    "FRIEND",
    "COLLEAGUE",
    "BOSS",
  ]),
});

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;

// OOO Period Schemas
export const createOOOPeriodSchema = z.object({
  startDate: z.string().transform(parseLocalDateToUTC),
  endDate: z.string().transform(parseLocalDateToUTC),
  label: z.string().max(100).optional().nullable(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "End date must be on or after start date" }
);

export const updateOOOPeriodSchema = z.object({
  startDate: z.string().transform(parseLocalDateToUTC).optional(),
  endDate: z.string().transform(parseLocalDateToUTC).optional(),
  label: z.string().max(100).optional().nullable(),
});

export type CreateOOOPeriodInput = z.infer<typeof createOOOPeriodSchema>;
export type UpdateOOOPeriodInput = z.infer<typeof updateOOOPeriodSchema>;
