"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      <div className="mb-4 text-[var(--ds-gray-300)]">
        <AlertTriangle className="size-16" strokeWidth={1.25} />
      </div>
      <h3 className="text-lg font-semibold text-[var(--ds-gray-700)] mb-2">
        Something went wrong
      </h3>
      <p className="text-[var(--ds-gray-500)] max-w-[400px] mb-6">
        An unexpected error occurred while loading this page. Your data is
        safe — try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard">
          <Button variant="outline">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
