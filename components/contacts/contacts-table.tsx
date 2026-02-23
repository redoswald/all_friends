"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactStatus, getStatusText, CADENCE_OPTIONS } from "@/lib/cadence";
import { FUNNEL_STAGE_LABELS } from "@/types";
import { Contact, Tag } from "@prisma/client";
import { FunnelStage } from "@/types";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ArrowUp, ArrowDown, ArrowUpDown, Tags, X, Plus, Minus, Users, Clock } from "lucide-react";

interface ContactWithDerived extends Contact {
  tags: { tag: Tag }[];
  lastEventDate: Date | null;
  status: ContactStatus;
}

interface ContactsTableProps {
  contacts: ContactWithDerived[];
  tags: Tag[];
}

type SortColumn = "name" | "tags" | "stage" | "cadence" | "lastSeen" | "status";
type SortDirection = "asc" | "desc";

// Define stage order for sorting
const STAGE_ORDER: Record<string, number> = {
  PROSPECT: 0,
  ACQUAINTANCE: 1,
  DEVELOPING: 2,
  ESTABLISHED: 3,
  CLOSE: 4,
  DORMANT: 5,
};

export function ContactsTable({ contacts, tags }: ContactsTableProps) {
  const router = useRouter();
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [customCadenceOpen, setCustomCadenceOpen] = useState(false);
  const [customCadenceValue, setCustomCadenceValue] = useState("");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkTag = async (tagId: string, action: "add" | "remove") => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/contacts/bulk-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: Array.from(selectedIds),
          tagId,
          action,
        }),
      });

      if (res.ok) {
        toast.success("Tags updated");
        clearSelection();
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update tags");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUpdate = async (updates: { funnelStage?: string; cadenceDays?: number | null }) => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/contacts/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: Array.from(selectedIds),
          updates,
        }),
      });

      if (res.ok) {
        toast.success("Contacts updated");
        clearSelection();
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update contacts");
    } finally {
      setIsUpdating(false);
    }
  };

  // Cadence options for bulk update (excluding "custom" and "null")
  const bulkCadenceOptions = CADENCE_OPTIONS.filter(
    (opt) => opt.value !== "custom" && opt.value !== null
  );

  const handleCustomCadenceSubmit = () => {
    const days = parseInt(customCadenceValue);
    if (days > 0) {
      handleBulkUpdate({ cadenceDays: days });
      setCustomCadenceOpen(false);
      setCustomCadenceValue("");
    }
  };

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "tags":
          // Sort by first tag name alphabetically, tagless contacts go last
          const aFirstTag = a.tags[0]?.tag.name ?? "";
          const bFirstTag = b.tags[0]?.tag.name ?? "";
          if (!aFirstTag && !bFirstTag) comparison = 0;
          else if (!aFirstTag) comparison = 1;
          else if (!bFirstTag) comparison = -1;
          else comparison = aFirstTag.localeCompare(bFirstTag);
          break;
        case "stage":
          comparison = (STAGE_ORDER[a.funnelStage] ?? 0) - (STAGE_ORDER[b.funnelStage] ?? 0);
          break;
        case "cadence":
          // Null cadence goes last
          if (a.cadenceDays === null && b.cadenceDays === null) comparison = 0;
          else if (a.cadenceDays === null) comparison = 1;
          else if (b.cadenceDays === null) comparison = -1;
          else comparison = a.cadenceDays - b.cadenceDays;
          break;
        case "lastSeen":
          // Null (never seen) goes last
          if (a.lastEventDate === null && b.lastEventDate === null) comparison = 0;
          else if (a.lastEventDate === null) comparison = 1;
          else if (b.lastEventDate === null) comparison = -1;
          else comparison = new Date(b.lastEventDate).getTime() - new Date(a.lastEventDate).getTime();
          break;
        case "status":
          // Sort by urgency: overdue > due > due soon > planned > ok > no cadence
          const getStatusPriority = (contact: ContactWithDerived) => {
            if (!contact.cadenceDays) return 5;
            if (contact.status.isOverdue) return 0;
            if (contact.status.isDue) return 1;
            if (contact.status.isDueSoon) return 2;
            if (contact.status.hasUpcomingEvent) return 3;
            return 4;
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          // Secondary sort by days until due
          if (comparison === 0 && a.status.daysUntilDue !== null && b.status.daysUntilDue !== null) {
            comparison = (a.status.daysUntilDue ?? 0) - (b.status.daysUntilDue ?? 0);
          }
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [contacts, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />;
    }
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const SortableHeader = ({ column, children, className }: { column: SortColumn; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-gray-50 ${className || ""}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon column={column} />
      </div>
    </TableHead>
  );
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts yet"
        description="Add your first contact to start tracking your relationships."
        actionLabel="Add Contact"
        actionHref="/contacts"
      />
    );
  }

  const getCadenceLabel = (days: number | null) => {
    if (!days) return "—";
    const option = CADENCE_OPTIONS.find((o) => o.value === days);
    return option ? option.label : `${days} days`;
  };

  const formatLastSeen = (date: Date | null, daysSince: number | null) => {
    if (!date) return "Never";
    if (daysSince === 0) return "Today";
    if (daysSince === 1) return "Yesterday";
    return `${daysSince} days ago`;
  };

  const isAllSelected = contacts.length > 0 && selectedIds.size === contacts.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < contacts.length;

  return (
    <div className="space-y-2">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-teal-500">
              {selectedIds.size} contact{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-6 px-2 text-teal-500 hover:text-teal-500 hover:bg-teal-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tags dropdown */}
            {tags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isUpdating}>
                    <Tags className="h-4 w-4 mr-2" />
                    Tags
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Plus className="h-4 w-4 mr-2" />
                      Add tag
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {tags.map((tag) => (
                        <DropdownMenuItem
                          key={tag.id}
                          onClick={() => handleBulkTag(tag.id, "add")}
                        >
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: tag.color || "#888" }}
                          />
                          {tag.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Minus className="h-4 w-4 mr-2" />
                      Remove tag
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {tags.map((tag) => (
                        <DropdownMenuItem
                          key={tag.id}
                          onClick={() => handleBulkTag(tag.id, "remove")}
                        >
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: tag.color || "#888" }}
                          />
                          {tag.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Stage dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isUpdating}>
                  <Users className="h-4 w-4 mr-2" />
                  Stage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {Object.entries(FUNNEL_STAGE_LABELS).map(([value, label]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => handleBulkUpdate({ funnelStage: value })}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cadence dropdown with custom option */}
            <Popover open={customCadenceOpen} onOpenChange={setCustomCadenceOpen}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isUpdating}>
                    <Clock className="h-4 w-4 mr-2" />
                    Cadence
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {bulkCadenceOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.label}
                      onClick={() => handleBulkUpdate({ cadenceDays: option.value as number })}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <PopoverTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Custom...
                    </DropdownMenuItem>
                  </PopoverTrigger>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdate({ cadenceDays: null })}
                  >
                    No target
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="customCadence">Custom cadence (days)</Label>
                    <Input
                      id="customCadence"
                      type="number"
                      min="1"
                      placeholder="e.g., 21"
                      value={customCadenceValue}
                      onChange={(e) => setCustomCadenceValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCustomCadenceSubmit();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomCadenceOpen(false);
                        setCustomCadenceValue("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCustomCadenceSubmit}
                      disabled={!customCadenceValue || parseInt(customCadenceValue) <= 0}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {isUpdating && (
              <span className="text-sm text-teal-500">Updating...</span>
            )}
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {sortedContacts.map((contact) => (
          <div
            key={contact.id}
            className={`border rounded-lg p-3 ${selectedIds.has(contact.id) ? "bg-teal-50 border-teal-200" : "bg-white"}`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedIds.has(contact.id)}
                onCheckedChange={() => toggleSelect(contact.id)}
                aria-label={`Select ${contact.name}`}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/contacts/${contact.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.cadenceDays ? (
                      <Badge
                        variant={
                          contact.status.hasUpcomingEvent
                            ? "outline"
                            : contact.status.isOverdue
                              ? "destructive"
                              : "default"
                        }
                        className={`flex-shrink-0 ${
                          contact.status.hasUpcomingEvent
                            ? "border-teal-400 text-teal-500 bg-transparent"
                            : contact.status.isDue
                              ? "bg-amber-500 hover:bg-amber-500"
                              : contact.status.isDueSoon
                                ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-400"
                                : contact.status.isOverdue
                                  ? ""
                                  : "bg-green-500 hover:bg-green-500"
                        }`}
                      >
                        {getStatusText(contact.status)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {FUNNEL_STAGE_LABELS[contact.funnelStage as FunnelStage]}
                    {contact.lastEventDate && (
                      <> · {formatLastSeen(contact.lastEventDate, contact.status.daysSinceLastEvent)}</>
                    )}
                  </p>
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.tags.slice(0, 3).map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                          style={
                            tag.color
                              ? { backgroundColor: `${tag.color}20`, color: tag.color }
                              : undefined
                          }
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {contact.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isSomeSelected;
                    }
                  }}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <SortableHeader column="name" className="w-[250px]">Name</SortableHeader>
              <SortableHeader column="tags">Tags</SortableHeader>
              <SortableHeader column="stage">Stage</SortableHeader>
              <SortableHeader column="cadence">Cadence</SortableHeader>
              <SortableHeader column="lastSeen">Last Seen</SortableHeader>
              <SortableHeader column="status" className="justify-end">Status</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.map((contact) => (
              <TableRow
                key={contact.id}
                className={`cursor-pointer hover:bg-gray-50 ${selectedIds.has(contact.id) ? "bg-teal-50" : ""}`}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(contact.id)}
                    onCheckedChange={() => toggleSelect(contact.id)}
                    aria-label={`Select ${contact.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="block font-medium hover:text-accent-400"
                  >
                    {contact.name}
                    {contact.nickname && (
                      <span className="text-gray-500 font-normal ml-2">
                        ({contact.nickname})
                      </span>
                    )}
                  </Link>
                </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map(({ tag }) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs"
                      style={
                        tag.color
                          ? { backgroundColor: `${tag.color}20`, color: tag.color }
                          : undefined
                      }
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {FUNNEL_STAGE_LABELS[contact.funnelStage as FunnelStage]}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {getCadenceLabel(contact.cadenceDays)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatLastSeen(contact.lastEventDate, contact.status.daysSinceLastEvent)}
              </TableCell>
              <TableCell className="text-right">
                {contact.cadenceDays ? (
                  <Badge
                    variant={
                      contact.status.hasUpcomingEvent
                        ? "outline"
                        : contact.status.isOverdue
                          ? "destructive"
                          : "default"
                    }
                    className={
                      contact.status.hasUpcomingEvent
                        ? "border-blue-400 text-blue-600 bg-transparent"
                        : contact.status.isDue
                          ? "bg-amber-500 hover:bg-amber-500"
                          : contact.status.isDueSoon
                            ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-400"
                            : contact.status.isOverdue
                              ? ""
                              : "bg-green-500 hover:bg-green-500"
                    }
                  >
                    {getStatusText(contact.status)}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
