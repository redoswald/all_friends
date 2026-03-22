"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

interface ProfileSectionProps {
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  selfContact: {
    location: string | null;
    metroArea: string | null;
  } | null;
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

export function ProfileSection({ user, selfContact }: ProfileSectionProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);

  // Home base state
  const [location, setLocation] = useState(selfContact?.location || "");
  const [metroArea, setMetroArea] = useState(selfContact?.metroArea || "");
  const [savingHomeBase, setSavingHomeBase] = useState(false);

  const isDirty = name !== (user.name || "");
  const isHomeBaseDirty =
    location !== (selfContact?.location || "") ||
    metroArea !== (selfContact?.metroArea || "");

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

  const handleSaveHomeBase = async () => {
    setSavingHomeBase(true);
    try {
      const res = await fetch("/api/user/self-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim() || null,
          metroArea: metroArea.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update state with normalized values from server
        if (data.metroArea !== undefined) setMetroArea(data.metroArea || "");
        toast.success("Home base updated");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update home base");
      }
    } catch {
      toast.error("Failed to update home base");
    } finally {
      setSavingHomeBase(false);
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

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Home Base</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Your home location helps determine which contacts are local vs. remote.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-location">Location</Label>
              <Input
                id="home-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Your city or address"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-metro">Metro Area</Label>
              <Input
                id="home-metro"
                value={metroArea}
                onChange={(e) => setMetroArea(e.target.value)}
                placeholder="e.g. DC, NYC, Bay Area"
                maxLength={100}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveHomeBase}
              disabled={!isHomeBaseDirty || savingHomeBase}
            >
              {savingHomeBase ? "Saving..." : "Save home base"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
