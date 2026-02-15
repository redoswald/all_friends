"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Home, Calendar, CalendarDays } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface Contact {
  id: string;
  name: string;
  nickname: string | null;
}

const pages = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Listen for custom event from nav search button
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("open-command-palette", onOpen);
    return () => document.removeEventListener("open-command-palette", onOpen);
  }, []);

  // Fetch contacts when dialog opens
  useEffect(() => {
    if (!open) return;
    if (contacts.length > 0) return;

    fetch("/api/contacts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setContacts(data);
        }
      })
      .catch(() => {});
  }, [open, contacts.length]);

  function select(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search contacts and pages..."
    >
      <CommandInput placeholder="Search contacts, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Contacts">
          {contacts.map((contact) => (
            <CommandItem
              key={contact.id}
              value={`${contact.name} ${contact.nickname ?? ""}`}
              onSelect={() => select(`/contacts/${contact.id}`)}
            >
              <Users className="h-4 w-4 mr-2" />
              <span>{contact.name}</span>
              {contact.nickname && (
                <span className="text-muted-foreground ml-1">
                  ({contact.nickname})
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Pages">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem
                key={page.href}
                value={page.label}
                onSelect={() => select(page.href)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {page.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
