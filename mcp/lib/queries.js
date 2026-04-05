/**
 * Shared Supabase query helpers used by both read and write tools.
 */

import { calculateContactStatus } from "./cadence.js";
import { formatDateForOutput } from "./dates.js";

/**
 * Fetch contacts with tags and OOO periods.
 * Supports optional filters: search, tag, stage, metroArea, overdueOnly, includeArchived.
 */
export async function fetchContactsWithMeta(supabase, userId, filters = {}) {
  let query = supabase
    .from("Contact")
    .select("*, ContactTag(tagId, Tag:tagId(id, name, color)), ContactOOOPeriod(*)")
    .eq("userId", userId)
    .eq("isSelf", false);

  if (!filters.includeArchived) {
    query = query.eq("isArchived", false);
  }

  if (filters.stage) {
    query = query.eq("funnelStage", filters.stage);
  }

  if (filters.metroArea) {
    query = query.ilike("metroArea", `%${filters.metroArea}%`);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,nickname.ilike.%${filters.search}%`
    );
  }

  query = query.order("name");

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  let contacts = data || [];

  // Filter by tag name (post-query since it's a joined table)
  if (filters.tag) {
    const tagLower = filters.tag.toLowerCase();
    contacts = contacts.filter((c) =>
      (c.ContactTag || []).some(
        (ct) => ct.Tag && ct.Tag.name.toLowerCase() === tagLower
      )
    );
  }

  return contacts;
}

/**
 * Fetch the most recent past event for each contact (by contact IDs).
 * Returns a Map of contactId -> { event, otherContactNames }
 */
export async function fetchLatestEventsForContacts(
  supabase,
  userId,
  contactIds
) {
  if (contactIds.length === 0) return new Map();

  const now = new Date().toISOString();

  // Fetch past EventContact rows for these contacts, joined to events
  const { data: eventContacts } = await supabase
    .from("EventContact")
    .select("contactId, event:eventId(id, title, date, eventType, location, userId)")
    .in("contactId", contactIds)
    .order("event(date)", { ascending: false });

  const result = new Map();

  for (const ec of eventContacts || []) {
    if (!ec.event || ec.event.userId !== userId) continue;
    if (new Date(ec.event.date) > new Date(now)) continue;
    if (result.has(ec.contactId)) continue; // already have the latest
    result.set(ec.contactId, {
      id: ec.event.id,
      title: ec.event.title,
      date: ec.event.date,
      eventType: ec.event.eventType,
      location: ec.event.location,
    });
  }

  return result;
}

/**
 * Fetch the next future event for each contact.
 * Returns a Map of contactId -> event
 */
export async function fetchNextEventsForContacts(
  supabase,
  userId,
  contactIds
) {
  if (contactIds.length === 0) return new Map();

  const now = new Date().toISOString();

  const { data: eventContacts } = await supabase
    .from("EventContact")
    .select("contactId, event:eventId(id, title, date, eventType, location, userId)")
    .in("contactId", contactIds)
    .order("event(date)", { ascending: true });

  const result = new Map();

  for (const ec of eventContacts || []) {
    if (!ec.event || ec.event.userId !== userId) continue;
    if (new Date(ec.event.date) <= new Date(now)) continue;
    if (result.has(ec.contactId)) continue; // already have the nearest future
    result.set(ec.contactId, {
      id: ec.event.id,
      title: ec.event.title,
      date: ec.event.date,
      eventType: ec.event.eventType,
      location: ec.event.location,
    });
  }

  return result;
}

/**
 * Compute cadence statuses for a list of contacts.
 * Returns contacts enriched with .status and .lastEvent fields.
 */
export function computeContactStatuses(
  contacts,
  latestEventsMap,
  nextEventsMap
) {
  return contacts.map((contact) => {
    const lastEvent = latestEventsMap.get(contact.id);
    const nextEvent = nextEventsMap.get(contact.id);
    const oooPeriods = contact.ContactOOOPeriod || [];

    const status = calculateContactStatus(
      lastEvent?.date ? new Date(lastEvent.date) : null,
      contact.cadenceDays,
      nextEvent?.date ? new Date(nextEvent.date) : null,
      oooPeriods
    );

    return { ...contact, status, lastEvent: lastEvent || null };
  });
}

/**
 * Fetch the user's self-contact (for self-OOO).
 */
export async function fetchSelfContact(supabase, userId) {
  const { data } = await supabase
    .from("Contact")
    .select("id, name, ContactOOOPeriod(*)")
    .eq("userId", userId)
    .eq("isSelf", true)
    .single();

  return data;
}

/**
 * Format a contact with its tags into a clean object for API response.
 */
export function formatContactTags(contact) {
  return (contact.ContactTag || [])
    .map((ct) => ct.Tag?.name)
    .filter(Boolean);
}

/**
 * Build OOO status object from a contact's OOO periods.
 */
export function buildOOOStatus(oooPeriods) {
  if (!oooPeriods || oooPeriods.length === 0) return null;

  const now = new Date();
  const current = oooPeriods.find(
    (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
  );

  if (!current) {
    const upcoming = oooPeriods.find((p) => new Date(p.startDate) > now);
    if (!upcoming) return null;
    return {
      status: "upcoming",
      label: upcoming.label,
      destination: upcoming.destination,
      startDate: formatDateForOutput(upcoming.startDate),
      returnDate: formatDateForOutput(upcoming.endDate),
    };
  }

  return {
    status: "away",
    label: current.label,
    destination: current.destination,
    returnDate: formatDateForOutput(current.endDate),
  };
}
