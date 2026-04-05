"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreateOOODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: { id: string; name: string }[];
  selfContact: { id: string; name: string } | null;
  defaultStartDate?: Date;
  defaultSelf?: boolean;
  isPast: boolean;
}

export function CreateOOODialog({
  open,
  onOpenChange,
  contacts,
  selfContact,
  defaultStartDate,
  defaultSelf,
  isPast,
}: CreateOOODialogProps) {
  const router = useRouter();
  const [selectedContacts, setSelectedContacts] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [label, setLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync defaults when dialog opens with a new date/mode
  const [lastDefaultKey, setLastDefaultKey] = useState<string | undefined>(undefined);
  const defaultKey = `${defaultStartDate?.toDateString()}-${defaultSelf}`;
  if (defaultKey !== lastDefaultKey) {
    setStartDate(defaultStartDate);
    setEndDate(undefined);
    setLabel("");
    setDestination("");
    setSearchTerm("");
    if (defaultSelf && selfContact) {
      setSelectedContacts([selfContact]);
    } else {
      setSelectedContacts([]);
    }
    setLastDefaultKey(defaultKey);
  }

  // All pickable contacts: self + regular contacts
  const allContacts = [
    ...(selfContact ? [{ id: selfContact.id, name: `${selfContact.name} (self)` }] : []),
    ...contacts,
  ];

  const addContact = (contact: { id: string; name: string }) => {
    if (!selectedContacts.some((c) => c.id === contact.id)) {
      setSelectedContacts((prev) => [...prev, contact]);
    }
    setSearchTerm("");
  };

  const removeContact = (id: string) => {
    setSelectedContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredContacts = allContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedContacts.some((sc) => sc.id === c.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContacts.length === 0 || !startDate || !endDate) return;

    setLoading(true);
    try {
      const body = JSON.stringify({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        label: label || null,
        destination: destination || null,
      });

      const results = await Promise.all(
        selectedContacts.map((contact) =>
          fetch(`/api/contacts/${contact.id}/ooo-periods`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          })
        )
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        toast.success(
          selectedContacts.length === 1
            ? "OOO period created"
            : `OOO period created for ${selectedContacts.length} contacts`
        );
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(`Failed to create ${failed.length} OOO period(s)`);
      }
    } catch {
      toast.error("Failed to create OOO period");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (contact: { id: string; name: string }) => {
    if (selfContact && contact.id === selfContact.id) return `${contact.name} (self)`;
    return contact.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isPast ? "Log" : "Plan"} OOO</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm">Contacts</Label>
            {selectedContacts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1 mb-2">
                {selectedContacts.map((contact) => (
                  <Badge
                    key={contact.id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeContact(contact.id)}
                  >
                    {getDisplayName(contact)}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="border rounded-md max-h-40 overflow-y-auto mt-1">
                {filteredContacts.slice(0, 10).map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => addContact(contact)}
                  >
                    {contact.name}
                  </button>
                ))}
                {filteredContacts.length === 0 && (
                  <p className="p-2 text-sm text-gray-500">No contacts found</p>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Label</Label>
              <Input
                placeholder="e.g., Cruise, Work trip"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">Destination</Label>
              <Input
                placeholder="e.g., New York, Paris"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedContacts.length === 0 || !startDate || !endDate}
            >
              {loading ? "Saving..." : isPast ? "Log OOO" : "Plan OOO"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
