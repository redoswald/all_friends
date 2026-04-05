/**
 * Fuzzy contact name matching — 5-tier strategy:
 * 1. Exact name match (case-insensitive)
 * 2. Exact nickname match (case-insensitive)
 * 3. Substring match on name
 * 4. First-name-only match (only if unique)
 * 5. No match — warning with closest candidates
 */

/**
 * Resolve multiple contact names (e.g., for log_event).
 * Fetches all contacts once, then matches each name.
 * Returns { matched: [{name, id, contact}], warnings: [string] }
 */
export async function resolveContactNames(supabase, userId, names) {
  const { data: contacts } = await supabase
    .from("Contact")
    .select("id, name, nickname")
    .eq("userId", userId)
    .eq("isSelf", false)
    .eq("isArchived", false);

  const allContacts = contacts || [];
  const matched = [];
  const warnings = [];

  for (const inputName of names) {
    const result = matchContact(inputName, allContacts);
    if (result.match) {
      matched.push({
        inputName,
        id: result.match.id,
        name: result.match.name,
      });
    } else if (result.candidates.length > 0) {
      warnings.push(
        `Could not find contact "${inputName}" — did you mean: ${result.candidates.map((c) => c.name).join(", ")}?`
      );
    } else {
      warnings.push(`Could not find contact "${inputName}"`);
    }
  }

  return { matched, warnings };
}

/**
 * Resolve a single contact by ID or name.
 * Returns { contact, warning } where contact may be null.
 */
export async function resolveContactByNameOrId(
  supabase,
  userId,
  { contactId, name }
) {
  if (contactId) {
    const { data } = await supabase
      .from("Contact")
      .select("*")
      .eq("id", contactId)
      .eq("userId", userId)
      .single();
    if (data) return { contact: data, warning: null };
    return { contact: null, warning: `Contact with ID "${contactId}" not found` };
  }

  if (!name) {
    return { contact: null, warning: "Either contact_id or name is required" };
  }

  const { data: contacts } = await supabase
    .from("Contact")
    .select("*")
    .eq("userId", userId)
    .eq("isSelf", false);

  const allContacts = contacts || [];
  const result = matchContact(name, allContacts);

  if (result.match) {
    return { contact: result.match, warning: null };
  }
  if (result.candidates.length > 0) {
    return {
      contact: null,
      warning: `Could not find "${name}" — did you mean: ${result.candidates.map((c) => c.name).join(", ")}?`,
    };
  }
  return { contact: null, warning: `Could not find contact "${name}"` };
}

/**
 * 5-tier matching against a list of contacts.
 * Returns { match: contact | null, candidates: contact[] }
 */
function matchContact(inputName, contacts) {
  const lower = inputName.toLowerCase().trim();

  // 1. Exact name match
  const exact = contacts.find((c) => c.name.toLowerCase() === lower);
  if (exact) return { match: exact, candidates: [] };

  // 2. Exact nickname match
  const nickname = contacts.find(
    (c) => c.nickname && c.nickname.toLowerCase() === lower
  );
  if (nickname) return { match: nickname, candidates: [] };

  // 3. Substring match on name
  const substrings = contacts.filter((c) =>
    c.name.toLowerCase().includes(lower)
  );
  if (substrings.length === 1) return { match: substrings[0], candidates: [] };
  if (substrings.length > 1) return { match: null, candidates: substrings };

  // 4. First-name match
  const firstNameMatches = contacts.filter(
    (c) => c.name.toLowerCase().split(" ")[0] === lower
  );
  if (firstNameMatches.length === 1)
    return { match: firstNameMatches[0], candidates: [] };
  if (firstNameMatches.length > 1)
    return { match: null, candidates: firstNameMatches };

  // 5. No match — return closest by prefix
  const prefixMatches = contacts
    .filter((c) => c.name.toLowerCase().startsWith(lower.charAt(0)))
    .slice(0, 5);

  return { match: null, candidates: prefixMatches };
}
