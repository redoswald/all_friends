"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  Plus,
  Cake,
  Heart,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  type ImportantDate,
  type ImportantDateType,
  IMPORTANT_DATE_TYPE_LABELS,
} from "@/types";

interface ImportantDatesSectionProps {
  contactId: string;
  dates: ImportantDate[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DATE_TYPE_ICONS: Record<ImportantDateType, typeof Cake> = {
  BIRTHDAY: Cake,
  ANNIVERSARY: Heart,
  CUSTOM: Calendar,
};

function calculateAge(day: number, month: number, year: number | null): number | null {
  if (!year) return null;

  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - (month - 1);

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }

  return age;
}

function formatDate(day: number, month: number, year: number | null): string {
  const monthName = MONTHS[month - 1];
  if (year) {
    return `${monthName} ${day}, ${year}`;
  }
  return `${monthName} ${day}`;
}

function getDaysInMonth(month: number, year?: number | null): number {
  return new Date(year || 2000, month, 0).getDate();
}

export function ImportantDatesSection({ contactId, dates }: ImportantDatesSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [dateType, setDateType] = useState<ImportantDateType>("BIRTHDAY");
  const [label, setLabel] = useState("");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [year, setYear] = useState<number | null>(null);
  const [includeYear, setIncludeYear] = useState(false);

  const resetForm = () => {
    setDateType("BIRTHDAY");
    setLabel("");
    setMonth(1);
    setDay(1);
    setYear(null);
    setIncludeYear(false);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const url = editingId
        ? `/api/contacts/${contactId}/dates/${editingId}`
        : `/api/contacts/${contactId}/dates`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateType,
          label: dateType === "CUSTOM" ? label : null,
          month,
          day,
          year: includeYear ? year : null,
        }),
      });

      if (res.ok) {
        toast.success(editingId ? "Date updated" : "Date added");
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
      const res = await fetch(`/api/contacts/${contactId}/dates/${deletingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Date deleted");
        setDeletingId(null);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete date");
    }
  };

  const startEditing = (date: ImportantDate) => {
    setEditingId(date.id);
    setDateType(date.dateType as ImportantDateType);
    setLabel(date.label || "");
    setMonth(date.month);
    setDay(date.day);
    setYear(date.year);
    setIncludeYear(date.year !== null);
  };

  const daysInMonth = getDaysInMonth(month, year);
  const currentYear = new Date().getFullYear();

  // Sort dates: Birthday first, then by month/day
  const sortedDates = [...dates].sort((a, b) => {
    if (a.dateType === "BIRTHDAY" && b.dateType !== "BIRTHDAY") return -1;
    if (a.dateType !== "BIRTHDAY" && b.dateType === "BIRTHDAY") return 1;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", !isOpen && "-rotate-90")}
              />
              <CardTitle className="text-base">Important Dates</CardTitle>
              <span className="text-sm text-muted-foreground">({dates.length})</span>
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
            {sortedDates.length === 0 && !isAdding && (
              <p className="text-sm text-muted-foreground">
                No important dates added yet.
              </p>
            )}

            {sortedDates.map((date) => {
              if (editingId === date.id) {
                return (
                  <form key={date.id} onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={dateType} onValueChange={(v) => setDateType(v as ImportantDateType)}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(IMPORTANT_DATE_TYPE_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {dateType === "CUSTOM" && (
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            className="h-8"
                            placeholder="e.g., Wedding Anniversary"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Month</Label>
                        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m, i) => (
                              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Day</Label>
                        <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: daysInMonth }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Year</Label>
                        <Input
                          className="h-8"
                          type="number"
                          placeholder="Optional"
                          value={includeYear ? (year ?? "") : ""}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            setYear(val);
                            setIncludeYear(val !== null);
                          }}
                          min={1900}
                          max={currentYear}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={loading}>
                        Save
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                );
              }

              const Icon = DATE_TYPE_ICONS[date.dateType as ImportantDateType] || Calendar;
              const age = calculateAge(date.day, date.month, date.year);
              const displayLabel = date.dateType === "CUSTOM" ? date.label : IMPORTANT_DATE_TYPE_LABELS[date.dateType as ImportantDateType];

              return (
                <div
                  key={date.id}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    date.dateType === "BIRTHDAY" ? "bg-pink-100" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      date.dateType === "BIRTHDAY" ? "text-pink-600" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{displayLabel}</span>
                      {age !== null && date.dateType === "BIRTHDAY" && (
                        <span className="text-xs text-muted-foreground">
                          (turns {age + 1})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(date.day, date.month, date.year)}
                      {age !== null && date.dateType === "BIRTHDAY" && ` • Age ${age}`}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEditing(date)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeletingId(date.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {isAdding && (
              <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={dateType} onValueChange={(v) => setDateType(v as ImportantDateType)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(IMPORTANT_DATE_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {dateType === "CUSTOM" && (
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        className="h-8"
                        placeholder="e.g., Wedding Anniversary"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Month</Label>
                    <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Day</Label>
                    <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: daysInMonth }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Year</Label>
                    <Input
                      className="h-8"
                      type="number"
                      placeholder="Optional"
                      value={includeYear ? (year ?? "") : ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setYear(val);
                        setIncludeYear(val !== null);
                      }}
                      min={1900}
                      max={currentYear}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={loading}>
                    Add
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete date"
        description="Are you sure you want to delete this date? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </Card>
  );
}
