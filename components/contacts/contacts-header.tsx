"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, X, Tags, LayoutList, Columns3 } from "lucide-react";
import { CreateContactForm } from "./create-contact-form";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { Tag } from "@prisma/client";
import { FUNNEL_STAGE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "kanban";

interface ContactsHeaderProps {
  tags: Tag[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ContactsHeader({ tags, viewMode, onViewModeChange }: ContactsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/contacts?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("search", search || null);
  };

  const clearFilters = () => {
    router.push("/contacts");
    setSearch("");
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("tagId") ||
    searchParams.has("funnelStage") ||
    searchParams.has("status");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <div className="flex items-center gap-2">
          <CreateTagDialog
            onSuccess={() => router.refresh()}
            trigger={
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Tags className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Tag</span>
              </Button>
            }
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Contact</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
              </DialogHeader>
              <CreateContactForm
                tags={tags}
                onSuccess={() => {
                  setDialogOpen(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 sm:w-64"
          />
          <Button variant="secondary" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={searchParams.get("tagId") || "all"}
            onValueChange={(v) => updateFilter("tagId", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-32">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("funnelStage") || "all"}
            onValueChange={(v) => updateFilter("funnelStage", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-32">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {Object.entries(FUNNEL_STAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={(v) => updateFilter("status", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-32">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due">Due soon</SelectItem>
              <SelectItem value="ok">On track</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex items-center border rounded-md ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "rounded-r-none px-2 sm:px-3",
                viewMode === "list" && "bg-gray-100"
              )}
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">List</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("kanban")}
              className={cn(
                "rounded-l-none px-2 sm:px-3",
                viewMode === "kanban" && "bg-gray-100"
              )}
            >
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Board</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
