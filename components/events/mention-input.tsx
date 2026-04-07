"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

interface MentionInputProps {
  contacts: { id: string; name: string }[];
  defaultValue?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  rows?: number;
}

/**
 * Convert raw mention syntax to display HTML.
 * @[Name](id) → <span data-mention-id="id" class="...">@Name</span>
 */
function rawToHtml(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '<span data-mention-id="$2" class="mention-token" contenteditable="false">@$1</span>'
  );
}

/**
 * Serialize contenteditable HTML back to raw mention syntax.
 */
function htmlToRaw(container: HTMLElement): string {
  let result = "";

  for (const node of container.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.mentionId) {
        const name = (el.textContent || "").replace(/^@/, "");
        result += `@[${name}](${el.dataset.mentionId})`;
      } else if (el.tagName === "BR") {
        result += "\n";
      } else {
        // Recurse into other elements (e.g., divs created by Enter key)
        const inner = htmlToRaw(el);
        result += inner;
        // Divs from Enter key in contenteditable add a newline
        if (el.tagName === "DIV" && result.length > 0 && !result.endsWith("\n")) {
          result = result + "\n";
        }
      }
    }
  }

  return result;
}

/**
 * Get current word being typed at cursor (text after last @ with no spaces).
 * Returns { query, startOffset } or null if not in a mention context.
 */
function getMentionQuery(container: HTMLElement): { query: string; startOffset: number; textNode: Text } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  const node = range.startContainer;

  if (node.nodeType !== Node.TEXT_NODE) return null;

  const text = node.textContent || "";
  const cursorPos = range.startOffset;
  const beforeCursor = text.slice(0, cursorPos);

  // Find the last @ that isn't inside a mention span
  const atIndex = beforeCursor.lastIndexOf("@");
  if (atIndex === -1) return null;

  const afterAt = beforeCursor.slice(atIndex + 1);
  // If there's a space after @, not a mention query
  if (afterAt.includes(" ") || afterAt.includes("\n")) return null;

  return {
    query: afterAt,
    startOffset: atIndex,
    textNode: node as Text,
  };
}

export function MentionInput({
  contacts,
  defaultValue = "",
  name,
  id,
  placeholder,
  rows = 3,
}: MentionInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEmpty, setIsEmpty] = useState(!defaultValue);
  const mentionContext = useRef<{ textNode: Text; startOffset: number } | null>(null);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 8);

  // Sync hidden input with editor content
  const syncHiddenInput = useCallback(() => {
    if (editorRef.current && hiddenRef.current) {
      const raw = htmlToRaw(editorRef.current);
      hiddenRef.current.value = raw;
      setIsEmpty(!raw.trim());
    }
  }, []);

  // Initialize editor content from defaultValue
  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = rawToHtml(defaultValue);
      if (hiddenRef.current) {
        hiddenRef.current.value = defaultValue;
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(() => {
    syncHiddenInput();

    // Check for mention query
    if (!editorRef.current) return;
    const ctx = getMentionQuery(editorRef.current);

    if (ctx) {
      setMentionQuery(ctx.query);
      setSelectedIndex(0);
      setShowPopover(true);
      mentionContext.current = { textNode: ctx.textNode, startOffset: ctx.startOffset };
    } else {
      setShowPopover(false);
      mentionContext.current = null;
    }
  }, [syncHiddenInput]);

  const insertMention = useCallback(
    (contact: { id: string; name: string }) => {
      const ctx = mentionContext.current;
      if (!ctx || !editorRef.current) return;

      const { textNode, startOffset } = ctx;
      const text = textNode.textContent || "";
      const sel = window.getSelection();
      const cursorPos = sel?.getRangeAt(0).startOffset || text.length;

      // Split text node: before @, mention span, after cursor
      const before = text.slice(0, startOffset);
      const after = text.slice(cursorPos);

      // Create mention span
      const mentionSpan = document.createElement("span");
      mentionSpan.dataset.mentionId = contact.id;
      mentionSpan.className = "mention-token";
      mentionSpan.contentEditable = "false";
      mentionSpan.textContent = `@${contact.name}`;

      // Create text nodes
      const beforeNode = document.createTextNode(before);
      const afterNode = document.createTextNode(after ? " " + after : " ");

      // Replace the text node with our new nodes
      const parent = textNode.parentNode;
      if (parent) {
        parent.insertBefore(beforeNode, textNode);
        parent.insertBefore(mentionSpan, textNode);
        parent.insertBefore(afterNode, textNode);
        parent.removeChild(textNode);

        // Set cursor after the space
        const range = document.createRange();
        range.setStart(afterNode, 1);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }

      setShowPopover(false);
      mentionContext.current = null;
      syncHiddenInput();
      editorRef.current.focus();
    },
    [syncHiddenInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showPopover || filteredContacts.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredContacts.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filteredContacts[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowPopover(false);
      }
    },
    [showPopover, filteredContacts, selectedIndex, insertMention]
  );

  // Prevent Enter from creating divs when popover is closed
  const handleKeyDownBase = useCallback(
    (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      if (e.key === "Enter" && !showPopover) {
        e.preventDefault();
        // Insert a <br> instead of a div
        document.execCommand("insertLineBreak");
        syncHiddenInput();
      }
    },
    [handleKeyDown, showPopover, syncHiddenInput]
  );

  const minHeight = rows * 24;

  return (
    <div className="relative">
      {/* Placeholder */}
      {isEmpty && placeholder && (
        <div
          className="absolute top-[9px] left-[13px] text-muted-foreground pointer-events-none text-sm"
        >
          {placeholder}
        </div>
      )}

      {/* Contenteditable editor */}
      <div
        ref={editorRef}
        id={id}
        contentEditable
        className="border border-input bg-transparent rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 whitespace-pre-wrap break-words overflow-y-auto"
        style={{ minHeight: `${minHeight}px` }}
        onInput={handleInput}
        onKeyDown={handleKeyDownBase}
        onBlur={() => {
          // Delay to allow click on popover items
          setTimeout(() => setShowPopover(false), 200);
        }}
        onFocus={() => {
          // Re-check for mention context on focus
          if (editorRef.current) {
            const ctx = getMentionQuery(editorRef.current);
            if (ctx) {
              setMentionQuery(ctx.query);
              setShowPopover(true);
              mentionContext.current = { textNode: ctx.textNode, startOffset: ctx.startOffset };
            }
          }
        }}
        suppressContentEditableWarning
      />

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue} />

      {/* Mention popover */}
      {showPopover && filteredContacts.length > 0 && (
        <div className="absolute z-50 mt-1 w-64 border rounded-md bg-popover shadow-md max-h-48 overflow-y-auto">
          {filteredContacts.map((contact, i) => (
            <button
              key={contact.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                i === selectedIndex ? "bg-accent" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                insertMention(contact);
              }}
            >
              {contact.name}
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        .mention-token {
          color: var(--color-teal-600, #0d9488);
          font-weight: 500;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
