"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
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
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-8">
      <div className="mb-4 text-[var(--ds-gray-300)]">
        <AlertTriangle className="size-16" strokeWidth={1.25} />
      </div>
      <h1 className="text-lg font-semibold text-[var(--ds-gray-700)] mb-2">
        Something went wrong
      </h1>
      <p className="text-[var(--ds-gray-500)] max-w-[400px] mb-6">
        An unexpected error occurred. Your data is safe — try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
