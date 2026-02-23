"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Plus,
  Plane,
  CalendarIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ContactOOOPeriod } from "@prisma/client";

interface OOOPeriodsSectionProps {
  contactId: string;
  periods: ContactOOOPeriod[];
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = start.getMonth() === end.getMonth();

  if (sameYear && sameMonth) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  } else if (sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  } else {
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  }
}

function isPeriodActive(period: ContactOOOPeriod): boolean {
  const now = new Date();
  return new Date(period.startDate) <= now && new Date(period.endDate) >= now;
}

function isPeriodFuture(period: ContactOOOPeriod): boolean {
  const now = new Date();
  return new Date(period.startDate) > now;
}

function isPeriodPast(period: ContactOOOPeriod): boolean {
  const now = new Date();
  return new Date(period.endDate) < now;
}

export function OOOPeriodsSection({ contactId, periods }: OOOPeriodsSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [label, setLabel] = useState("");

  const resetForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setLabel("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const url = editingId
        ? `/api/contacts/${contactId}/ooo-periods/${editingId}`
        : `/api/contacts/${contactId}/ooo-periods`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          label: label || null,
        }),
      });

      if (res.ok) {
        toast.success(editingId ? "OOO period updated" : "OOO period added");
        resetForm();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}/ooo-periods/${deletingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("OOO period deleted");
        setDeletingId(null);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete OOO period");
    }
  };

  const startEditing = (period: ContactOOOPeriod) => {
    setEditingId(period.id);
    setStartDate(new Date(period.startDate));
    setEndDate(new Date(period.endDate));
    setLabel(period.label || "");
  };

  // Sort periods: active first, then future by start date, then past
  const sortedPeriods = [...periods].sort((a, b) => {
    const aActive = isPeriodActive(a);
    const bActive = isPeriodActive(b);
    const aFuture = isPeriodFuture(a);
    const bFuture = isPeriodFuture(b);

    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;

    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  // Count active and upcoming
  const activePeriods = periods.filter(isPeriodActive);
  const upcomingPeriods = periods.filter(isPeriodFuture);

  const renderForm = (isEdit: boolean) => (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-8 justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
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
          <Label className="text-xs">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-8 justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => startDate ? date < startDate : false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div>
        <Label className="text-xs">Label (optional)</Label>
        <Input
          className="h-8"
          placeholder="e.g., Cruise, Work trip, Vacation"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={loading || !startDate || !endDate}
        >
          {isEdit ? "Save" : "Add"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={resetForm}>
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", !isOpen && "-rotate-90")}
              />
              <CardTitle className="text-base">Out of Office</CardTitle>
              <span className="text-sm text-muted-foreground">
                ({periods.length})
                {activePeriods.length > 0 && (
                  <span className="ml-1 text-purple-600">• Away now</span>
                )}
                {activePeriods.length === 0 && upcomingPeriods.length > 0 && (
                  <span className="ml-1 text-blue-600">• {upcomingPeriods.length} scheduled</span>
                )}
              </span>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {sortedPeriods.length === 0 && !isAdding && (
              <p className="text-sm text-muted-foreground">
                No OOO periods scheduled.
              </p>
            )}

            {sortedPeriods.map((period) => {
              if (editingId === period.id) {
                return <div key={period.id}>{renderForm(true)}</div>;
              }

              const isActive = isPeriodActive(period);
              const isFuture = isPeriodFuture(period);
              const isPast = isPeriodPast(period);

              return (
                <div
                  key={period.id}
                  className={cn(
                    "flex items-center gap-3 group",
                    isPast && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      isActive
                        ? "bg-purple-100"
                        : isFuture
                        ? "bg-blue-100"
                        : "bg-muted"
                    )}
                  >
                    <Plane
                      className={cn(
                        "h-4 w-4",
                        isActive
                          ? "text-purple-600"
                          : isFuture
                          ? "text-blue-600"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {period.label || "Away"}
                      </span>
                      {isActive && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          Now
                        </span>
                      )}
                      {isFuture && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateRange(period.startDate, period.endDate)}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEditing(period)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeletingId(period.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {isAdding && renderForm(false)}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete OOO period"
        description="Are you sure you want to delete this OOO period? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </Card>
  );
}
