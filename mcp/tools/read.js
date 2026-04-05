import { z } from "zod";
import {
  fetchContactsWithMeta,
  fetchLatestEventsForContacts,
  fetchNextEventsForContacts,
  computeContactStatuses,
  fetchSelfContact,
  formatContactTags,
  buildOOOStatus,
} from "../lib/queries.js";
import { formatDateForOutput } from "../lib/dates.js";
import { resolveContactByNameOrId } from "../lib/fuzzy.js";
import { daysBetween } from "../lib/cadence.js";

export function registerReadTools(server, supabase, userId) {
  // ─── get_contacts ───────────────────────────────────────────
  server.tool(
    "get_contacts",
    "Search and list contacts from the All Friends relationship manager. Returns contacts with their tags, cadence status, last event date, funnel stage, location, and OOO status. Use this when the user asks about their contacts, wants to find someone specific, or asks broad questions about their social circle.",
    {
      search: z.string().optional().describe("Fuzzy match on name or nickname"),
      tag: z.string().optional().describe("Filter by tag name"),
      stage: z.string().optional().describe("Filter by funnel stage"),
      metro_area: z.string().optional().describe("Filter by metro area"),
      overdue_only: z.boolean().optional().describe("Only return overdue contacts"),
      include_archived: z.boolean().optional().describe("Include archived contacts"),
      limit: z.number().optional().describe("Max results (default 25, max 100)"),
    },
    async (params) => {
      const limit = Math.min(params.limit || 25, 100);

      const contacts = await fetchContactsWithMeta(supabase, userId, {
        search: params.search,
        tag: params.tag,
        stage: params.stage,
        metroArea: params.metro_area,
        includeArchived: params.include_archived,
      });

      const contactIds = contacts.map((c) => c.id);
      const [latestEvents, nextEvents] = await Promise.all([
        fetchLatestEventsForContacts(supabase, userId, contactIds),
        fetchNextEventsForContacts(supabase, userId, contactIds),
      ]);

      let enriched = computeContactStatuses(contacts, latestEvents, nextEvents);

      if (params.overdue_only) {
        enriched = enriched.filter((c) => c.status.isOverdue);
      }

      // Sort: overdue non-OOO first, then due-soon, then OOO, then alphabetical
      enriched.sort((a, b) => {
        const aOverdue = a.status.isOverdue && !a.status.isAway;
        const bOverdue = b.status.isOverdue && !b.status.isAway;
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

        const aDueSoon = (a.status.isDue || a.status.isDueSoon) && !a.status.isAway;
        const bDueSoon = (b.status.isDue || b.status.isDueSoon) && !b.status.isAway;
        if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1;

        if (a.status.isAway !== b.status.isAway)
          return a.status.isAway ? 1 : -1;

        return a.name.localeCompare(b.name);
      });

      const results = enriched.slice(0, limit).map((c) => ({
        id: c.id,
        name: c.name,
        nickname: c.nickname,
        notes: c.notes,
        cadenceDays: c.cadenceDays,
        funnelStage: c.funnelStage,
        metroArea: c.metroArea,
        tags: formatContactTags(c),
        lastEventDate: formatDateForOutput(c.lastEvent?.date),
        lastEventTitle: c.lastEvent?.title,
        lastEventLocation: c.lastEvent?.location,
        daysSinceLastEvent: c.status.daysSinceLastEvent,
        daysUntilDue: c.status.daysUntilDue,
        isOverdue: c.status.isOverdue,
        ooo: buildOOOStatus(c.ContactOOOPeriod),
      }));

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // ─── get_contact_detail ─────────────────────────────────────
  server.tool(
    "get_contact_detail",
    "Get full details about a specific contact, including their complete event history, tags, action items, cadence status, OOO periods, relationships, and important dates. Use this when the user asks about a specific person, wants to prepare for seeing someone, or asks 'what did I last talk about with [name]?'",
    {
      contact_id: z.string().optional().describe("Contact ID"),
      name: z.string().optional().describe("Contact name (fuzzy matched)"),
    },
    async (params) => {
      const { contact, warning } = await resolveContactByNameOrId(
        supabase,
        userId,
        { contactId: params.contact_id, name: params.name }
      );

      if (!contact) {
        return { content: [{ type: "text", text: warning }] };
      }

      // Fetch tags
      const { data: tagRows } = await supabase
        .from("ContactTag")
        .select("Tag:tagId(name, color)")
        .eq("contactId", contact.id);

      // Fetch OOO periods
      const { data: oooPeriods } = await supabase
        .from("ContactOOOPeriod")
        .select("*")
        .eq("contactId", contact.id)
        .order("startDate", { ascending: false });

      // Fetch relationships (both directions)
      const { data: rels1 } = await supabase
        .from("ContactRelationship")
        .select("relatedId, relationshipType, RelatedContact:relatedId(name)")
        .eq("contactId", contact.id);

      const { data: rels2 } = await supabase
        .from("ContactRelationship")
        .select("contactId, relationshipType, SourceContact:contactId(name)")
        .eq("relatedId", contact.id);

      const relationships = [
        ...(rels1 || []).map((r) => ({
          name: r.RelatedContact?.name,
          type: r.relationshipType,
        })),
        ...(rels2 || []).map((r) => ({
          name: r.SourceContact?.name,
          type: r.relationshipType,
        })),
      ];

      // Fetch important dates
      const { data: importantDates } = await supabase
        .from("ImportantDate")
        .select("*")
        .eq("contactId", contact.id);

      // Fetch events (20 most recent) with other contacts and action items
      const { data: eventContacts } = await supabase
        .from("EventContact")
        .select("event:eventId(id, title, date, eventType, notes, location, userId, ActionItem(*)), contactId")
        .eq("contactId", contact.id)
        .order("event(date)", { ascending: false })
        .limit(20);

      // For each event, fetch other contacts
      const events = [];
      const seenEventIds = new Set();

      for (const ec of eventContacts || []) {
        if (!ec.event || ec.event.userId !== userId) continue;
        if (seenEventIds.has(ec.event.id)) continue;
        seenEventIds.add(ec.event.id);

        const { data: otherECs } = await supabase
          .from("EventContact")
          .select("contact:contactId(name)")
          .eq("eventId", ec.event.id)
          .neq("contactId", contact.id);

        events.push({
          id: ec.event.id,
          title: ec.event.title,
          date: formatDateForOutput(ec.event.date),
          eventType: ec.event.eventType,
          location: ec.event.location,
          notes: ec.event.notes,
          otherContacts: (otherECs || []).map((oc) => oc.contact?.name).filter(Boolean),
          actionItems: (ec.event.ActionItem || []).map((ai) => ({
            id: ai.id,
            description: ai.description,
            completed: ai.completed,
          })),
        });
      }

      // Total event count
      const { count: totalEvents } = await supabase
        .from("EventContact")
        .select("eventId", { count: "exact", head: true })
        .eq("contactId", contact.id);

      const firstEventDate =
        events.length > 0
          ? events[events.length - 1].date
          : null;

      // Cadence status
      const latestEvents = await fetchLatestEventsForContacts(supabase, userId, [contact.id]);
      const nextEvents = await fetchNextEventsForContacts(supabase, userId, [contact.id]);
      const [enriched] = computeContactStatuses(
        [{ ...contact, ContactOOOPeriod: oooPeriods || [] }],
        latestEvents,
        nextEvents
      );

      const now = new Date();
      const currentOOO = (oooPeriods || []).find(
        (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
      );
      const upcomingOOO = (oooPeriods || []).filter(
        (p) => new Date(p.startDate) > now
      );

      const result = {
        contact: {
          id: contact.id,
          name: contact.name,
          nickname: contact.nickname,
          notes: contact.notes,
          metroArea: contact.metroArea,
          location: contact.location,
          funnelStage: contact.funnelStage,
          relationship: contact.relationship,
        },
        tags: (tagRows || []).map((t) => t.Tag?.name).filter(Boolean),
        cadenceStatus: {
          cadenceDays: contact.cadenceDays,
          daysSinceLastEvent: enriched.status.daysSinceLastEvent,
          daysUntilDue: enriched.status.daysUntilDue,
          isOverdue: enriched.status.isOverdue,
        },
        ooo: {
          current: currentOOO
            ? {
                label: currentOOO.label,
                destination: currentOOO.destination,
                startDate: formatDateForOutput(currentOOO.startDate),
                endDate: formatDateForOutput(currentOOO.endDate),
              }
            : null,
          upcoming: upcomingOOO.map((p) => ({
            startDate: formatDateForOutput(p.startDate),
            endDate: formatDateForOutput(p.endDate),
            label: p.label,
            destination: p.destination,
          })),
        },
        relationships,
        importantDates: (importantDates || []).map((d) => ({
          type: d.dateType,
          label: d.label,
          month: d.month,
          day: d.day,
          year: d.year,
        })),
        events,
        totalEvents: totalEvents || events.length,
        firstEventDate,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── get_upcoming ───────────────────────────────────────────
  server.tool(
    "get_upcoming",
    "Get planned future events and relevant OOO periods. Use when the user asks 'who am I seeing this week?', 'what's on my social calendar?', 'who's traveling?', or anything about upcoming plans.",
    {
      days_ahead: z.number().optional().describe("Days to look ahead (default 14, max 90)"),
    },
    async (params) => {
      const daysAhead = Math.min(params.days_ahead || 14, 90);
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + daysAhead);

      // Fetch future events
      const { data: eventRows } = await supabase
        .from("Event")
        .select("id, title, date, eventType, location, EventContact(contact:contactId(name, metroArea))")
        .eq("userId", userId)
        .gte("date", now.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true });

      const events = (eventRows || []).map((e) => ({
        id: e.id,
        title: e.title,
        date: formatDateForOutput(e.date),
        eventType: e.eventType,
        location: e.location,
        contacts: (e.EventContact || []).map((ec) => ({
          name: ec.contact?.name,
          metroArea: ec.contact?.metroArea,
        })),
      }));

      // Fetch OOO periods overlapping the window
      const selfContact = await fetchSelfContact(supabase, userId);
      const selfOOO = (selfContact?.ContactOOOPeriod || [])
        .filter(
          (p) =>
            new Date(p.startDate) <= endDate && new Date(p.endDate) >= now
        )
        .map((p) => ({
          startDate: formatDateForOutput(p.startDate),
          endDate: formatDateForOutput(p.endDate),
          label: p.label,
          destination: p.destination,
        }));

      const { data: oooContacts } = await supabase
        .from("ContactOOOPeriod")
        .select("startDate, endDate, label, destination, contact:contactId(name, userId, isSelf)")
        .lte("startDate", endDate.toISOString())
        .gte("endDate", now.toISOString());

      const contactOOO = (oooContacts || [])
        .filter((p) => p.contact?.userId === userId && !p.contact?.isSelf)
        .map((p) => ({
          contactName: p.contact?.name,
          startDate: formatDateForOutput(p.startDate),
          endDate: formatDateForOutput(p.endDate),
          label: p.label,
          destination: p.destination,
        }));

      const result = {
        events,
        ooo: {
          self: selfOOO,
          contacts: contactOOO,
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── get_social_summary ─────────────────────────────────────
  server.tool(
    "get_social_summary",
    "Get a high-level summary of the user's relationship health. Returns overdue contacts (OOO-aware), upcoming events, who's currently away, who's returning soon, open action items, upcoming birthdays, and funnel stage distribution. Use this for morning briefings, weekly reviews, or when the user asks something general like 'how am I doing with keeping up with people?'",
    {},
    async () => {
      const now = new Date();

      // Fetch all active contacts with cadence
      const contacts = await fetchContactsWithMeta(supabase, userId);
      const contactIds = contacts.map((c) => c.id);

      const [latestEvents, nextEvents] = await Promise.all([
        fetchLatestEventsForContacts(supabase, userId, contactIds),
        fetchNextEventsForContacts(supabase, userId, contactIds),
      ]);

      const enriched = computeContactStatuses(contacts, latestEvents, nextEvents);

      // Partition contacts
      const overdue = enriched
        .filter((c) => c.status.isOverdue && !c.status.isAway)
        .sort((a, b) => (a.status.daysUntilDue || 0) - (b.status.daysUntilDue || 0))
        .slice(0, 10)
        .map((c) => ({
          name: c.name,
          daysSinceLastEvent: c.status.daysSinceLastEvent,
          cadenceDays: c.cadenceDays,
          metroArea: c.metroArea,
        }));

      const dueSoon = enriched
        .filter((c) => (c.status.isDue || c.status.isDueSoon) && !c.status.isAway)
        .sort((a, b) => (a.status.daysUntilDue || 0) - (b.status.daysUntilDue || 0))
        .slice(0, 10)
        .map((c) => ({
          name: c.name,
          daysUntilDue: c.status.daysUntilDue,
          cadenceDays: c.cadenceDays,
          metroArea: c.metroArea,
        }));

      const currentlyAway = enriched
        .filter((c) => c.status.isAway)
        .map((c) => ({
          name: c.name,
          destination: c.status.currentOOOPeriod?.destination,
          returnDate: formatDateForOutput(c.status.currentOOOPeriod?.endDate),
          label: c.status.currentOOOPeriod?.label,
        }));

      const sevenDaysOut = new Date(now);
      sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

      const returningThisWeek = currentlyAway.filter((c) => {
        if (!c.returnDate) return false;
        return new Date(c.returnDate) <= sevenDaysOut;
      });

      // Self OOO
      const selfContact = await fetchSelfContact(supabase, userId);
      const selfPeriods = selfContact?.ContactOOOPeriod || [];
      const selfCurrent = selfPeriods.find(
        (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
      );
      const selfNext = selfPeriods
        .filter((p) => new Date(p.startDate) > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

      // Upcoming events (next 7 days)
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: upcomingEventRows } = await supabase
        .from("Event")
        .select("title, date, location, EventContact(contact:contactId(name))")
        .eq("userId", userId)
        .gte("date", now.toISOString())
        .lte("date", weekEnd.toISOString())
        .order("date", { ascending: true });

      const upcomingEvents = (upcomingEventRows || []).map((e) => ({
        title: e.title,
        date: formatDateForOutput(e.date),
        location: e.location,
        contacts: (e.EventContact || []).map((ec) => ec.contact?.name).filter(Boolean),
      }));

      // Upcoming birthdays (next 30 days)
      const { data: allBirthdays } = await supabase
        .from("ImportantDate")
        .select("day, month, year, contact:contactId(name, userId)")
        .eq("dateType", "BIRTHDAY");

      const upcomingBirthdays = (allBirthdays || [])
        .filter((b) => b.contact?.userId === userId)
        .map((b) => {
          const thisYear = new Date(now.getFullYear(), b.month - 1, b.day);
          const nextYear = new Date(now.getFullYear() + 1, b.month - 1, b.day);
          const nextOccurrence = thisYear >= now ? thisYear : nextYear;
          const daysAway = daysBetween(now, nextOccurrence);
          return {
            name: b.contact?.name,
            date: `${["January","February","March","April","May","June","July","August","September","October","November","December"][b.month - 1]} ${b.day}`,
            daysAway,
          };
        })
        .filter((b) => b.daysAway <= 30 && b.daysAway >= 0)
        .sort((a, b) => a.daysAway - b.daysAway);

      // Open action items
      const { data: actionItems } = await supabase
        .from("ActionItem")
        .select("id, description, event:eventId(title, EventContact(contact:contactId(name, userId)))")
        .eq("completed", false);

      const openActionItems = (actionItems || [])
        .filter((ai) => {
          const contacts = ai.event?.EventContact || [];
          return contacts.some((ec) => ec.contact?.userId === userId);
        })
        .map((ai) => ({
          id: ai.id,
          description: ai.description,
          fromEvent: ai.event?.title,
          contact: (ai.event?.EventContact || [])
            .map((ec) => ec.contact?.name)
            .filter(Boolean)
            .join(", "),
        }));

      // Stage distribution
      const stageDistribution = {};
      for (const c of contacts) {
        stageDistribution[c.funnelStage] =
          (stageDistribution[c.funnelStage] || 0) + 1;
      }

      // Stats
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const { count: eventsThisMonth } = await supabase
        .from("Event")
        .select("id", { count: "exact", head: true })
        .eq("userId", userId)
        .gte("date", thisMonthStart.toISOString());

      const { count: eventsLastMonth } = await supabase
        .from("Event")
        .select("id", { count: "exact", head: true })
        .eq("userId", userId)
        .gte("date", lastMonthStart.toISOString())
        .lt("date", thisMonthStart.toISOString());

      const result = {
        overdue,
        dueSoon,
        currentlyAway,
        returningThisWeek,
        selfOOO: {
          current: selfCurrent
            ? {
                label: selfCurrent.label,
                destination: selfCurrent.destination,
                endDate: formatDateForOutput(selfCurrent.endDate),
              }
            : null,
          next: selfNext
            ? {
                startDate: formatDateForOutput(selfNext.startDate),
                endDate: formatDateForOutput(selfNext.endDate),
                label: selfNext.label,
              }
            : null,
        },
        upcomingEvents,
        upcomingBirthdays,
        openActionItems,
        stageDistribution,
        stats: {
          totalContacts: contacts.length,
          eventsThisMonth: eventsThisMonth || 0,
          eventsLastMonth: eventsLastMonth || 0,
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
