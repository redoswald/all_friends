"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreateOOODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: { id: string; name: string }[];
  defaultStartDate?: Date;
  isPast: boolean;
}

export function CreateOOODialog({
  open,
  onOpenChange,
  contacts,
  defaultStartDate,
  isPast,
}: CreateOOODialogProps) {
  const router = useRouter();
  const [contactId, setContactId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [label, setLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync defaultStartDate when dialog opens with a new date
  const [lastDefault, setLastDefault] = useState<string | undefined>(undefined);
  const defaultKey = defaultStartDate?.toDateString();
  if (defaultKey !== lastDefault) {
    setStartDate(defaultStartDate);
    setEndDate(undefined);
    setContactId("");
    setLabel("");
    setDestination("");
    setLastDefault(defaultKey);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId || !startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/ooo-periods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          label: label || null,
          destination: destination || null,
        }),
      });

      if (res.ok) {
        toast.success("OOO period created");
        onOpenChange(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create OOO period");
      }
    } catch {
      toast.error("Failed to create OOO period");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isPast ? "Log" : "Plan"} OOO</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm">Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={loading || !contactId || !startDate || !endDate}
            >
              {loading ? "Saving..." : isPast ? "Log OOO" : "Plan OOO"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
