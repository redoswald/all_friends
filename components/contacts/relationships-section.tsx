"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Users,
  Trash2,
  ArrowRight,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  type ContactRelationship,
  type RelationshipType,
  RELATIONSHIP_TYPE_LABELS,
} from "@/types";

interface RelationshipWithRelated extends ContactRelationship {
  relatedContact: { id: string; name: string };
}

interface RelationshipFromOthers extends ContactRelationship {
  contact: { id: string; name: string };
}

interface RelationshipsSectionProps {
  contactId: string;
  contactName: string;
  relationships: RelationshipWithRelated[];
  relatedRelationships: RelationshipFromOthers[];
  allContacts: { id: string; name: string }[];
}

export function RelationshipsSection({
  contactId,
  contactName,
  relationships,
  relatedRelationships,
  allContacts,
}: RelationshipsSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [selectedContactId, setSelectedContactId] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("FRIEND");
  const [contactPickerOpen, setContactPickerOpen] = useState(false);

  // Filter out contacts that already have a relationship
  const availableContacts = useMemo(() => {
    const existingRelatedIds = new Set([
      ...relationships.map((r) => r.relatedId),
      ...relatedRelationships.map((r) => r.contactId),
      contactId,
    ]);
    return allContacts.filter((c) => !existingRelatedIds.has(c.id));
  }, [allContacts, relationships, relatedRelationships, contactId]);

  const selectedContact = allContacts.find((c) => c.id === selectedContactId);

  const resetForm = () => {
    setSelectedContactId("");
    setRelationshipType("FRIEND");
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relatedId: selectedContactId,
          relationshipType,
        }),
      });

      if (res.ok) {
        toast.success("Relationship added");
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
      const res = await fetch(
        `/api/contacts/${contactId}/relationships/${deletingId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Relationship removed");
        setDeletingId(null);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to remove relationship");
    }
  };

  // Combine and format relationships
  const allRelationships = [
    ...relationships.map((r) => ({
      id: r.id,
      type: r.relationshipType as RelationshipType,
      label: RELATIONSHIP_TYPE_LABELS[r.relationshipType as RelationshipType],
      relatedName: r.relatedContact.name,
      relatedId: r.relatedContact.id,
      canDelete: true,
    })),
  ];

  const totalCount = relationships.length;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", !isOpen && "-rotate-90")}
              />
              <CardTitle className="text-base">Relationships</CardTitle>
              <span className="text-sm text-muted-foreground">({totalCount})</span>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              disabled={availableContacts.length === 0}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {allRelationships.length === 0 && !isAdding && (
              <p className="text-sm text-muted-foreground">
                No relationships added yet.
              </p>
            )}

            {allRelationships.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center gap-3 group"
              >
                <div className="p-2 bg-muted rounded-full">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{rel.label}:</span>
                  <Link
                    href={`/contacts/${rel.relatedId}`}
                    className="text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    {rel.relatedName}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {rel.canDelete && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeletingId(rel.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {isAdding && (
              <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs">Related Contact</Label>
                  <Popover open={contactPickerOpen} onOpenChange={setContactPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={contactPickerOpen}
                        className="w-full justify-between h-8"
                      >
                        {selectedContact ? selectedContact.name : "Select contact..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search contacts..." />
                        <CommandList>
                          <CommandEmpty>No contacts found.</CommandEmpty>
                          <CommandGroup>
                            {availableContacts.map((contact) => (
                              <CommandItem
                                key={contact.id}
                                value={contact.name}
                                onSelect={() => {
                                  setSelectedContactId(contact.id);
                                  setContactPickerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedContactId === contact.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {contact.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-xs">
                    {contactName} is the <strong>{RELATIONSHIP_TYPE_LABELS[relationshipType]}</strong> of{" "}
                    {selectedContact?.name || "..."}
                  </Label>
                  <Select
                    value={relationshipType}
                    onValueChange={(v) => setRelationshipType(v as RelationshipType)}
                  >
                    <SelectTrigger className="h-8 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RELATIONSHIP_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !selectedContactId}
                  >
                    Add
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {availableContacts.length === 0 && !isAdding && relationships.length > 0 && (
              <p className="text-xs text-muted-foreground italic">
                All contacts are already connected.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Remove relationship"
        description="Are you sure you want to remove this relationship? This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={handleDelete}
      />
    </Card>
  );
}
