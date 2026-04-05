import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { resolveContactNames, resolveContactByNameOrId } from "../lib/fuzzy.js";
import { parseLocalDateToUTC, todayAtNoonUTC, formatDateForOutput } from "../lib/dates.js";
import { normalizeMetroArea } from "../lib/metro.js";
import {
  fetchLatestEventsForContacts,
  fetchNextEventsForContacts,
  computeContactStatuses,
  formatContactTags,
} from "../lib/queries.js";

export function registerWriteTools(server, supabase, userId) {
  // ─── log_event ──────────────────────────────────────────────
  server.tool(
    "log_event",
    "Log a social interaction — a hangout, call, text, or other contact with one or more people. Use when the user says things like 'I just had coffee with Alex', 'I texted Sarah yesterday', or 'log that I saw Marcus and Jamie at the bar on Friday.' This updates the cadence clock for all involved contacts.",
    {
      contact_names: z.array(z.string()).describe("Names of people involved"),
      date: z.string().optional().describe("ISO date (defaults to today)"),
      event_type: z.string().optional().describe("HANGOUT, CALL, MESSAGE, EVENT, OTHER"),
      title: z.string().optional().describe("Short description"),
      notes: z.string().optional().describe("What you discussed"),
      location: z.string().optional().describe("Where it happened"),
      action_items: z.array(z.string()).optional().describe("Follow-up items"),
    },
    async (params) => {
      const { matched, warnings } = await resolveContactNames(
        supabase,
        userId,
        params.contact_names
      );

      if (matched.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "No contacts matched",
                warnings,
              }),
            },
          ],
        };
      }

      const eventDate = params.date
        ? parseLocalDateToUTC(params.date)
        : todayAtNoonUTC();

      const eventId = createId();

      // Insert event
      const { error: eventError } = await supabase.from("Event").insert({
        id: eventId,
        userId,
        title: params.title || null,
        date: eventDate.toISOString(),
        eventType: params.event_type || "HANGOUT",
        notes: params.notes || null,
        location: params.location || null,
      });

      if (eventError) throw eventError;

      // Insert EventContact rows
      const eventContacts = matched.map((m) => ({
        eventId,
        contactId: m.id,
      }));

      const { error: ecError } = await supabase
        .from("EventContact")
        .insert(eventContacts);

      if (ecError) throw ecError;

      // Insert action items
      let actionItemsCreated = 0;
      if (params.action_items && params.action_items.length > 0) {
        const items = params.action_items.map((desc) => ({
          id: createId(),
          eventId,
          description: desc,
          completed: false,
        }));

        const { error: aiError } = await supabase
          .from("ActionItem")
          .insert(items);

        if (aiError) throw aiError;
        actionItemsCreated = items.length;
      }

      // Compute new cadence status for matched contacts
      const matchedIds = matched.map((m) => m.id);

      // Fetch full contact data for cadence computation
      const { data: fullContacts } = await supabase
        .from("Contact")
        .select("*, ContactOOOPeriod(*)")
        .in("id", matchedIds);

      const latestEvents = await fetchLatestEventsForContacts(
        supabase,
        userId,
        matchedIds
      );
      const nextEvents = await fetchNextEventsForContacts(
        supabase,
        userId,
        matchedIds
      );
      const enriched = computeContactStatuses(
        fullContacts || [],
        latestEvents,
        nextEvents
      );

      const contactsUpdated = enriched.map((c) => ({
        name: c.name,
        newDaysUntilDue: c.status.daysUntilDue,
      }));

      const result = {
        event: {
          id: eventId,
          title: params.title || null,
          date: formatDateForOutput(eventDate),
          location: params.location || null,
          contacts: matched.map((m) => m.name),
        },
        contactsUpdated,
        actionItemsCreated,
        warnings,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── add_contact ────────────────────────────────────────────
  server.tool(
    "add_contact",
    "Add a new person to the relationship manager. Use when the user mentions someone new they want to track, like 'add my new coworker Priya — we should hang out monthly' or 'I met someone named Jordan at the party, add them as a prospect.'",
    {
      name: z.string().describe("Full name"),
      nickname: z.string().optional().describe("Familiar name"),
      notes: z.string().optional().describe("Notes about them"),
      relationship: z.string().optional().describe("How you know them"),
      cadence_days: z.number().optional().describe("Days between contact"),
      stage: z.string().optional().describe("Funnel stage (default ACQUAINTANCE)"),
      metro_area: z.string().optional().describe("Where they live"),
      tags: z.array(z.string()).optional().describe("Tag names (created if new)"),
    },
    async (params) => {
      const contactId = createId();
      const metroArea = normalizeMetroArea(params.metro_area);

      const { error: contactError } = await supabase.from("Contact").insert({
        id: contactId,
        userId,
        name: params.name,
        nickname: params.nickname || null,
        notes: params.notes || null,
        relationship: params.relationship || null,
        cadenceDays: params.cadence_days || null,
        funnelStage: params.stage || "ACQUAINTANCE",
        metroArea,
      });

      if (contactError) throw contactError;

      // Handle tags
      const tagNames = params.tags || [];
      const appliedTags = [];

      for (const tagName of tagNames) {
        // Check if tag exists
        let { data: existingTag } = await supabase
          .from("Tag")
          .select("id, name")
          .eq("userId", userId)
          .eq("name", tagName)
          .single();

        if (!existingTag) {
          const tagId = createId();
          const { data: newTag, error: tagError } = await supabase
            .from("Tag")
            .insert({ id: tagId, userId, name: tagName })
            .select()
            .single();

          if (tagError) throw tagError;
          existingTag = newTag;
        }

        // Link tag to contact
        await supabase
          .from("ContactTag")
          .insert({ contactId, tagId: existingTag.id });

        appliedTags.push(existingTag.name);
      }

      const result = {
        id: contactId,
        name: params.name,
        nickname: params.nickname || null,
        funnelStage: params.stage || "ACQUAINTANCE",
        cadenceDays: params.cadence_days || null,
        metroArea,
        tags: appliedTags,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── update_contact ─────────────────────────────────────────
  server.tool(
    "update_contact",
    "Update an existing contact's information — their cadence, funnel stage, notes, location, or tags. Use when the user says things like 'move Alex to Close', 'change Marcus's cadence to every two weeks', 'Alex moved to New York', or 'add the tag DC to Sarah.'",
    {
      contact_id: z.string().optional().describe("Contact ID"),
      name: z.string().optional().describe("Contact name (fuzzy matched)"),
      updates: z
        .object({
          cadenceDays: z.number().nullable().optional(),
          funnelStage: z.string().optional(),
          notes: z.string().nullable().optional(),
          nickname: z.string().nullable().optional(),
          relationship: z.string().nullable().optional(),
          metroArea: z.string().nullable().optional(),
          location: z.string().nullable().optional(),
        })
        .describe("Fields to update"),
      add_tags: z.array(z.string()).optional().describe("Tags to add"),
      remove_tags: z.array(z.string()).optional().describe("Tags to remove"),
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

      // Build update
      const updateData = {};
      const updates = params.updates || {};

      if (updates.cadenceDays !== undefined) updateData.cadenceDays = updates.cadenceDays;
      if (updates.funnelStage !== undefined) updateData.funnelStage = updates.funnelStage;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.nickname !== undefined) updateData.nickname = updates.nickname;
      if (updates.relationship !== undefined) updateData.relationship = updates.relationship;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.metroArea !== undefined) {
        updateData.metroArea = normalizeMetroArea(updates.metroArea);
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("Contact")
          .update(updateData)
          .eq("id", contact.id);
        if (error) throw error;
      }

      // Add tags
      for (const tagName of params.add_tags || []) {
        let { data: existingTag } = await supabase
          .from("Tag")
          .select("id")
          .eq("userId", userId)
          .eq("name", tagName)
          .single();

        if (!existingTag) {
          const { data: newTag } = await supabase
            .from("Tag")
            .insert({ id: createId(), userId, name: tagName })
            .select()
            .single();
          existingTag = newTag;
        }

        if (existingTag) {
          await supabase
            .from("ContactTag")
            .upsert({ contactId: contact.id, tagId: existingTag.id });
        }
      }

      // Remove tags
      for (const tagName of params.remove_tags || []) {
        const { data: tag } = await supabase
          .from("Tag")
          .select("id")
          .eq("userId", userId)
          .eq("name", tagName)
          .single();

        if (tag) {
          await supabase
            .from("ContactTag")
            .delete()
            .eq("contactId", contact.id)
            .eq("tagId", tag.id);
        }
      }

      // Re-fetch and return
      const { data: updated } = await supabase
        .from("Contact")
        .select("*, ContactTag(Tag:tagId(name, color)), ContactOOOPeriod(*)")
        .eq("id", contact.id)
        .single();

      const latestEvents = await fetchLatestEventsForContacts(supabase, userId, [contact.id]);
      const nextEvents = await fetchNextEventsForContacts(supabase, userId, [contact.id]);
      const [enriched] = computeContactStatuses(
        [updated],
        latestEvents,
        nextEvents
      );

      const result = {
        id: updated.id,
        name: updated.name,
        nickname: updated.nickname,
        funnelStage: updated.funnelStage,
        cadenceDays: updated.cadenceDays,
        metroArea: updated.metroArea,
        tags: formatContactTags(updated),
        cadenceStatus: {
          daysUntilDue: enriched.status.daysUntilDue,
          isOverdue: enriched.status.isOverdue,
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── complete_action_item ───────────────────────────────────
  server.tool(
    "complete_action_item",
    "Mark an action item as completed. Use when the user says they've done a follow-up, like 'I sent Alex that real estate contact.'",
    {
      action_item_id: z.string().optional().describe("Action item ID"),
      description_search: z.string().optional().describe("Fuzzy match on description"),
    },
    async (params) => {
      let actionItem = null;

      if (params.action_item_id) {
        const { data } = await supabase
          .from("ActionItem")
          .select("*, event:eventId(title, userId, EventContact(contact:contactId(name)))")
          .eq("id", params.action_item_id)
          .single();

        if (data && data.event?.userId === userId) {
          actionItem = data;
        }
      } else if (params.description_search) {
        // Search open action items
        const { data: items } = await supabase
          .from("ActionItem")
          .select("*, event:eventId(title, userId, EventContact(contact:contactId(name)))")
          .eq("completed", false)
          .ilike("description", `%${params.description_search}%`);

        const userItems = (items || []).filter(
          (ai) => ai.event?.userId === userId
        );

        if (userItems.length === 1) {
          actionItem = userItems[0];
        } else if (userItems.length > 1) {
          const candidates = userItems.map((ai) => ({
            id: ai.id,
            description: ai.description,
            fromEvent: ai.event?.title,
          }));
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Multiple matches found. Please specify by ID.",
                  candidates,
                }),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `No open action items matching "${params.description_search}"`,
                }),
              },
            ],
          };
        }
      }

      if (!actionItem) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "Action item not found" }),
            },
          ],
        };
      }

      // Mark complete
      const { error } = await supabase
        .from("ActionItem")
        .update({ completed: true })
        .eq("id", actionItem.id);

      if (error) throw error;

      const result = {
        id: actionItem.id,
        description: actionItem.description,
        completed: true,
        fromEvent: actionItem.event?.title,
        contacts: (actionItem.event?.EventContact || [])
          .map((ec) => ec.contact?.name)
          .filter(Boolean),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
