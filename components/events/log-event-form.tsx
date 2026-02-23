"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { EVENT_TYPE_LABELS } from "@/types";
import { getTodayForInput } from "@/lib/date-utils";

interface LogEventFormProps {
  contacts: { id: string; name: string }[];
  defaultContactIds?: string[];
  defaultDate?: string; // YYYY-MM-DD format
  onSuccess: () => void;
}

// Track both existing contacts (by id) and new contacts (by name)
interface SelectedContact {
  type: "existing" | "new";
  id?: string;
  name: string;
}

export function LogEventForm({
  contacts,
  defaultContactIds = [],
  defaultDate,
  onSuccess,
}: LogEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>(
    defaultContactIds.map((id) => {
      const contact = contacts.find((c) => c.id === id);
      return { type: "existing", id, name: contact?.name || "" };
    })
  );
  const [searchTerm, setSearchTerm] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedContacts.length === 0) {
      setError("Please select at least one contact");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const existingContactIds = selectedContacts
      .filter((c) => c.type === "existing")
      .map((c) => c.id!);
    const newContactNames = selectedContacts
      .filter((c) => c.type === "new")
      .map((c) => c.name);

    const data = {
      title: (formData.get("title") as string) || null,
      date: formData.get("date") as string,
      eventType: formData.get("eventType") as string,
      notes: (formData.get("notes") as string) || null,
      contactIds: existingContactIds,
      newContactNames: newContactNames,
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to log event");
      }

      toast.success("Event logged");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const addExistingContact = (contact: { id: string; name: string }) => {
    if (!selectedContacts.some((c) => c.type === "existing" && c.id === contact.id)) {
      setSelectedContacts((prev) => [...prev, { type: "existing", id: contact.id, name: contact.name }]);
    }
    setSearchTerm("");
  };

  const addNewContact = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName && !selectedContacts.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setSelectedContacts((prev) => [...prev, { type: "new", name: trimmedName }]);
    }
    setSearchTerm("");
  };

  const removeContact = (index: number) => {
    setSelectedContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedContacts.some((sc) => sc.type === "existing" && sc.id === c.id)
  );

  const showCreateOption = searchTerm.trim() &&
    !contacts.some((c) => c.name.toLowerCase() === searchTerm.trim().toLowerCase()) &&
    !selectedContacts.some((c) => c.name.toLowerCase() === searchTerm.trim().toLowerCase());

  const dateForInput = defaultDate || getTodayForInput();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Contacts *</Label>
        {selectedContacts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedContacts.map((contact, index) => (
              <Badge
                key={contact.type === "existing" ? contact.id : `new-${index}`}
                variant={contact.type === "new" ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => removeContact(index)}
              >
                {contact.name}
                {contact.type === "new" && <span className="ml-1 text-xs">(new)</span>}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
        <Input
          placeholder="Search or type a new name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && showCreateOption) {
              e.preventDefault();
              addNewContact(searchTerm);
            }
          }}
        />
        {searchTerm && (
          <div className="border rounded-md max-h-40 overflow-y-auto">
            {showCreateOption && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent-50 flex items-center gap-2 text-accent-400 border-b"
                onClick={() => addNewContact(searchTerm)}
              >
                <Plus className="h-4 w-4" />
                Create &quot;{searchTerm.trim()}&quot;
              </button>
            )}
            {filteredContacts.slice(0, 10).map((contact) => (
              <button
                key={contact.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => addExistingContact(contact)}
              >
                {contact.name}
              </button>
            ))}
            {!showCreateOption && filteredContacts.length === 0 && (
              <p className="p-2 text-sm text-gray-500">No contacts found</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={dateForInput}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventType">Type</Label>
          <Select name="eventType" defaultValue="HANGOUT">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., Dinner at Zaytinya"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="What did you talk about?"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging..." : "Log Event"}
      </Button>
    </form>
  );
}
