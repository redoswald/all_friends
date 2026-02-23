"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {mounted
            ? themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                    theme === value
                      ? "border-accent-300 bg-accent-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] rounded-lg" />
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
