"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "@prisma/client";
import { FUNNEL_STAGE_LABELS } from "@/types";
import { CADENCE_OPTIONS, getAnnualFrequencyText } from "@/lib/cadence";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type CadenceValue = "7" | "14" | "30" | "90" | "custom" | "null";

interface CreateContactFormProps {
  tags: Tag[];
  onSuccess: () => void;
}

export function CreateContactForm({ tags, onSuccess }: CreateContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cadenceType, setCadenceType] = useState<CadenceValue>("null");
  const [customCadence, setCustomCadence] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    let cadenceDays: number | null = null;
    if (cadenceType === "custom" && customCadence) {
      cadenceDays = parseInt(customCadence);
    } else if (cadenceType !== "null" && cadenceType !== "custom") {
      cadenceDays = parseInt(cadenceType);
    }

    const data = {
      name: formData.get("name") as string,
      nickname: (formData.get("nickname") as string) || null,
      relationship: (formData.get("relationship") as string) || null,
      notes: (formData.get("notes") as string) || null,
      cadenceDays,
      funnelStage: formData.get("funnelStage") as string,
      tagIds: selectedTags,
    };

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to create contact");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" required placeholder="John Smith" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" name="nickname" placeholder="Johnny" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship</Label>
          <Input id="relationship" name="relationship" placeholder="College friend, Mom, etc." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="funnelStage">Stage</Label>
          <Select name="funnelStage" defaultValue="ACQUAINTANCE">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FUNNEL_STAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cadenceDays">Cadence</Label>
          <Select value={cadenceType} onValueChange={(v) => setCadenceType(v as CadenceValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CADENCE_OPTIONS.map((option) => (
                <SelectItem key={option.label} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {cadenceType === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="customCadence">Custom cadence (days)</Label>
          <Input
            id="customCadence"
            type="number"
            min="1"
            placeholder="e.g., 21"
            value={customCadence}
            onChange={(e) => setCustomCadence(e.target.value)}
          />
          {customCadence && parseInt(customCadence) > 0 && (
            <p className="text-sm text-gray-500">
              {getAnnualFrequencyText(parseInt(customCadence))}
            </p>
          )}
        </div>
      )}

      {cadenceType !== "null" && cadenceType !== "custom" && (
        <p className="text-sm text-gray-500 -mt-2">
          {getAnnualFrequencyText(parseInt(cadenceType))}
        </p>
      )}

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.id)}
                style={
                  tag.color && selectedTags.includes(tag.id)
                    ? { backgroundColor: tag.color }
                    : tag.color
                    ? { borderColor: tag.color, color: tag.color }
                    : undefined
                }
              >
                {tag.name}
                {selectedTags.includes(tag.id) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="How you met, shared interests, etc."
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-coral-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Contact"}
      </Button>
    </form>
  );
}
