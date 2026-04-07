/**
 * Mention parsing utilities for event notes.
 * Mentions are stored as @[Name](contactId) in the notes text.
 */

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Extract all mentioned contact IDs from a notes string (deduplicated).
 */
export function extractMentionedContactIds(text: string | null): string[] {
  if (!text) return [];
  const ids: string[] = [];
  let match;
  const regex = new RegExp(MENTION_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    ids.push(match[2]);
  }
  return [...new Set(ids)];
}

/**
 * Convert raw mention syntax to display text: @[Joseph](id) → @Joseph
 */
export function mentionsToDisplayText(text: string): string {
  return text.replace(MENTION_REGEX, "@$1");
}
