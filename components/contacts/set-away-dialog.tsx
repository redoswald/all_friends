"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CurrentOOOPeriod {
  id: string;
  endDate: Date;
  label?: string | null;
}

interface SetAwayDialogProps {
  contactId: string;
  contactName: string;
  currentOOOPeriod: CurrentOOOPeriod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetAwayDialog({
  contactId,
  contactName,
  currentOOOPeriod,
  open,
  onOpenChange,
}: SetAwayDialogProps) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentOOOPeriod ? new Date(currentOOOPeriod.endDate) : undefined
  );
  const [loading, setLoading] = useState(false);

  const isCurrentlyAway = currentOOOPeriod !== null;

  const handleSubmit = async () => {
    if (!endDate) return;

    setLoading(true);
    try {
      // Create a new OOO period from today to the selected end date
      const res = await fetch(`/api/contacts/${contactId}/ooo-periods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          label: null,
        }),
      });

      if (res.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        const data = await res.json();
        console.error("OOO Period API error:", data);
      }
    } catch (error) {
      console.error("OOO Period fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAway = async () => {
    if (!currentOOOPeriod) return;

    setLoading(true);
    try {
      // Delete the current active OOO period
      const res = await fetch(
        `/api/contacts/${contactId}/ooo-periods/${currentOOOPeriod.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setEndDate(undefined);
        onOpenChange(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set {contactName} as Away</DialogTitle>
          <DialogDescription>
            Mark this contact as traveling or unavailable. Their due date will be
            pushed to after they return.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {isCurrentlyAway && (
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
              Currently away until {format(new Date(currentOOOPeriod.endDate), "PPP")}
              {currentOOOPeriod.label && ` (${currentOOOPeriod.label})`}
            </p>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              {isCurrentlyAway ? "Set new return date" : "Back on"}
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select return date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            {isCurrentlyAway && (
              <Button
                variant="outline"
                onClick={handleClearAway}
                disabled={loading}
                className="flex-1"
              >
                Clear Away
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading || !endDate}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
