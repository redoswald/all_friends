import Link from "next/link";

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

export function RenderedNotes({ notes, className }: { notes: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(MENTION_REGEX.source, "g");

  while ((match = regex.exec(notes)) !== null) {
    if (match.index > lastIndex) {
      parts.push(notes.slice(lastIndex, match.index));
    }
    const [, name, contactId] = match;
    parts.push(
      <Link
        key={`${contactId}-${match.index}`}
        href={`/contacts/${contactId}`}
        className="text-teal-600 hover:underline font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        @{name}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < notes.length) {
    parts.push(notes.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
