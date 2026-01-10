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
import {
  ChevronDown,
  Plus,
  Mail,
  Phone,
  MessageCircle,
  Link as LinkIcon,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ContactField,
  type ContactFieldType,
  CONTACT_FIELD_TYPE_LABELS,
  SOCIAL_MEDIA_OPTIONS,
  PHONE_LABELS,
  EMAIL_LABELS,
} from "@/types";

interface ContactFieldsSectionProps {
  contactId: string;
  fields: ContactField[];
}

const FIELD_TYPE_ICONS: Record<ContactFieldType, typeof Mail> = {
  EMAIL: Mail,
  PHONE: Phone,
  SOCIAL: MessageCircle,
  CUSTOM: LinkIcon,
};

function generateLink(fieldType: string, value: string, protocol?: string | null): string | null {
  switch (fieldType) {
    case "EMAIL":
      return `mailto:${value}`;
    case "PHONE":
      const cleanPhone = value.replace(/[^\d+]/g, "");
      return `tel:${cleanPhone}`;
    case "SOCIAL":
      if (protocol) {
        if (protocol.includes("wa.me")) {
          const waNumber = value.replace(/[^\d]/g, "");
          return `${protocol}${waNumber}`;
        }
        return `${protocol}${value}`;
      }
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
      }
      return null;
    default:
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
      }
      return null;
  }
}

export function ContactFieldsSection({ contactId, fields }: ContactFieldsSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [fieldType, setFieldType] = useState<ContactFieldType>("EMAIL");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [socialType, setSocialType] = useState("whatsapp");

  const resetForm = () => {
    setFieldType("EMAIL");
    setLabel("");
    setValue("");
    setSocialType("whatsapp");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    try {
      let protocol: string | null = null;
      let finalLabel = label;

      if (fieldType === "SOCIAL") {
        const socialOption = SOCIAL_MEDIA_OPTIONS.find((o) => o.value === socialType);
        protocol = socialOption?.protocol || null;
        finalLabel = socialOption?.label || label;
      }

      const url = editingId
        ? `/api/contacts/${contactId}/fields/${editingId}`
        : `/api/contacts/${contactId}/fields`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldType,
          label: finalLabel || null,
          value: value.trim(),
          protocol,
        }),
      });

      if (res.ok) {
        resetForm();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Delete this contact field?")) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}/fields/${fieldId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete field:", error);
    }
  };

  const startEditing = (field: ContactField) => {
    setEditingId(field.id);
    setFieldType(field.fieldType as ContactFieldType);
    setLabel(field.label || "");
    setValue(field.value);
    if (field.fieldType === "SOCIAL") {
      const option = SOCIAL_MEDIA_OPTIONS.find((o) => o.label === field.label);
      setSocialType(option?.value || "other");
    }
  };

  const getLabelOptions = () => {
    switch (fieldType) {
      case "EMAIL":
        return EMAIL_LABELS;
      case "PHONE":
        return PHONE_LABELS;
      default:
        return [];
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", !isOpen && "-rotate-90")}
              />
              <CardTitle className="text-base">Contact Info</CardTitle>
              <span className="text-sm text-muted-foreground">({fields.length})</span>
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
            {fields.length === 0 && !isAdding && (
              <p className="text-sm text-muted-foreground">
                No contact info added yet.
              </p>
            )}

            {fields.map((field) => {
              if (editingId === field.id) {
                return (
                  <form key={field.id} onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={fieldType} onValueChange={(v) => setFieldType(v as ContactFieldType)}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CONTACT_FIELD_TYPE_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {fieldType === "SOCIAL" ? (
                        <div>
                          <Label className="text-xs">Platform</Label>
                          <Select value={socialType} onValueChange={setSocialType}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SOCIAL_MEDIA_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : getLabelOptions().length > 0 ? (
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Select value={label} onValueChange={setLabel}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getLabelOptions().map((l) => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            className="h-8"
                            placeholder="Label (optional)"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Value</Label>
                      <Input
                        className="h-8"
                        placeholder={fieldType === "EMAIL" ? "email@example.com" : fieldType === "PHONE" ? "+1 555-1234" : "Value"}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                      />
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

              const Icon = FIELD_TYPE_ICONS[field.fieldType as ContactFieldType] || LinkIcon;
              const link = generateLink(field.fieldType, field.value, field.protocol);

              return (
                <div
                  key={field.id}
                  className="flex items-center gap-3 group"
                >
                  <div className="p-2 bg-muted rounded-full">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {link ? (
                        <a
                          href={link}
                          target={field.fieldType === "SOCIAL" ? "_blank" : undefined}
                          rel={field.fieldType === "SOCIAL" ? "noopener noreferrer" : undefined}
                          className="text-sm font-medium hover:underline truncate flex items-center gap-1"
                        >
                          {field.value}
                          {field.fieldType === "SOCIAL" && (
                            <ExternalLink className="h-3 w-3" />
                          )}
                        </a>
                      ) : (
                        <span className="text-sm font-medium truncate">{field.value}</span>
                      )}
                    </div>
                    {field.label && (
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEditing(field)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(field.id)}
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
                    <Select value={fieldType} onValueChange={(v) => setFieldType(v as ContactFieldType)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTACT_FIELD_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldType === "SOCIAL" ? (
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select value={socialType} onValueChange={setSocialType}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_MEDIA_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : getLabelOptions().length > 0 ? (
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Select value={label} onValueChange={setLabel}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getLabelOptions().map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        className="h-8"
                        placeholder="Label (optional)"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    className="h-8"
                    placeholder={fieldType === "EMAIL" ? "email@example.com" : fieldType === "PHONE" ? "+1 555-1234" : "Value"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    autoFocus
                  />
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
    </Card>
  );
}
