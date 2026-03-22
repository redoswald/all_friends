"use client";

import { Plane } from "lucide-react";
import { OOOPeriodsSection } from "@/components/contacts/ooo-periods-section";
import type { ContactOOOPeriod } from "@prisma/client";

interface YourOOOSectionProps {
  contactId: string;
  periods: ContactOOOPeriod[];
}

export function YourOOOSection({ contactId, periods }: YourOOOSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Plane className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-medium text-sm text-muted-foreground">Your Travel & Availability</h2>
      </div>
      <OOOPeriodsSection contactId={contactId} periods={periods} />
    </div>
  );
}
