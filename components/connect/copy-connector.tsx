"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyConnector({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Connector URL copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the URL manually");
    }
  }

  return (
    <div className="mx-auto flex max-w-xl items-center gap-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-xl border bg-card px-4 py-3 text-sm shadow-sm">
        {url}
      </code>
      <Button onClick={handleCopy} className="flex-shrink-0 gap-2 rounded-xl px-4 py-3">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
