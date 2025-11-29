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

interface SetAwayDialogProps {
  contactId: string;
  contactName: string;
  currentAwayUntil: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetAwayDialog({
  contactId,
  contactName,
  currentAwayUntil,
  open,
  onOpenChange,
}: SetAwayDialogProps) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [awayUntil, setAwayUntil] = useState<Date | undefined>(
    currentAwayUntil ? new Date(currentAwayUntil) : undefined
  );
  const [loading, setLoading] = useState(false);

  const isCurrentlyAway = currentAwayUntil && new Date(currentAwayUntil) > new Date();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/away`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awayUntil: awayUntil ? awayUntil.toISOString() : null,
        }),
      });

      if (res.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        const data = await res.json();
        console.error("Away API error:", data);
      }
    } catch (error) {
      console.error("Away fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAway = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/away`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awayUntil: null }),
      });

      if (res.ok) {
        setAwayUntil(undefined);
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
          <div>
            <label className="text-sm font-medium mb-2 block">
              Back on
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !awayUntil && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {awayUntil ? format(awayUntil, "PPP") : "Select return date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={awayUntil}
                  onSelect={(date) => {
                    setAwayUntil(date);
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
              disabled={loading || !awayUntil}
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
