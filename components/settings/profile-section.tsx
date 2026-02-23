"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProfileSectionProps {
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);

  const isDirty = name !== (user.name || "");

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        toast.success("Profile updated");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />
            )}
            <AvatarFallback className="bg-accent-50 text-accent-400 text-lg font-medium">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{user.name || user.email}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="opacity-60"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!isDirty || !name.trim() || saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
