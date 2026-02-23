"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palmtree } from "lucide-react";
import { formatDateForInput } from "@/lib/date-utils";

const SNOOZE_OPTIONS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "3 weeks", days: 21 },
  { label: "1 month", days: 30 },
];

export function VacationModeDialog() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
  const [endDate, setEndDate] = useState("");
  const [snoozeDays, setSnoozeDays] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ message: string; count: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !snoozeDays) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/contacts/bulk-snooze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          snoozeDays: parseInt(snoozeDays),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.count > 0) {
          setTimeout(() => {
            setOpen(false);
            window.location.reload();
          }, 1500);
        }
      } else {
        console.error("Bulk snooze failed");
      }
    } catch (error) {
      console.error("Failed to bulk snooze:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResult(null);
      setSnoozeDays("");
      setEndDate("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Palmtree className="h-4 w-4 mr-2" />
          Vacation Mode
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vacation Mode</DialogTitle>
          <DialogDescription>
            Snooze all contacts with due dates during your time away
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="snoozeDuration">Snooze these contacts for...</Label>
            <Select value={snoozeDays} onValueChange={setSnoozeDays}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {SNOOZE_OPTIONS.map((option) => (
                  <SelectItem key={option.days} value={option.days.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {result && (
            <div className={`p-3 rounded-lg text-sm ${result.count > 0 ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
              {result.count > 0
                ? `Snoozed ${result.count} contact${result.count !== 1 ? "s" : ""}!`
                : "No contacts have due dates in this range."}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !startDate || !endDate || !snoozeDays}>
              {submitting ? "Snoozing..." : "Snooze Contacts"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
