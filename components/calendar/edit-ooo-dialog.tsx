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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface OOOBlock {
  id: string;
  contactId: string;
  contactName: string;
  isSelf: boolean;
  startDate: Date;
  endDate: Date;
  label: string | null;
  destination: string | null;
}

interface EditOOODialogProps {
  oooBlock: OOOBlock | null;
  onOpenChange: (open: boolean) => void;
}

export function EditOOODialog({ oooBlock, onOpenChange }: EditOOODialogProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [label, setLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form state when oooBlock changes
  const [lastBlockId, setLastBlockId] = useState<string | null>(null);
  if (oooBlock && oooBlock.id !== lastBlockId) {
    setStartDate(new Date(oooBlock.startDate));
    setEndDate(new Date(oooBlock.endDate));
    setLabel(oooBlock.label || "");
    setDestination(oooBlock.destination || "");
    setLastBlockId(oooBlock.id);
  }

  if (!oooBlock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/contacts/${oooBlock.contactId}/ooo-periods/${oooBlock.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
            label: label || null,
            destination: destination || null,
          }),
        }
      );

      if (res.ok) {
        toast.success("OOO period updated");
        onOpenChange(false);
        setLastBlockId(null);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update OOO period");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/contacts/${oooBlock.contactId}/ooo-periods/${oooBlock.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success("OOO period deleted");
        setConfirmDelete(false);
        onOpenChange(false);
        setLastBlockId(null);
        router.refresh();
      } else {
        toast.error("Failed to delete OOO period");
      }
    } catch {
      toast.error("Failed to delete OOO period");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={!!oooBlock} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit OOO — {oooBlock.contactName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <div className="flex gap-2">
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
                  disabled={loading || !startDate || !endDate}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete OOO period"
        description="Are you sure you want to delete this OOO period? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  );
}
