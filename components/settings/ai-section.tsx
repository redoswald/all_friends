import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AiSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tend works with the AI you already use. Connect Claude or any
          MCP-capable assistant once, and it can see who you&apos;re due to reach
          out to, log catch-ups, and plan your week with you.
        </p>
        <Button asChild>
          <Link href="/connect" className="gap-2">
            <Sparkles className="size-4" />
            Connect your AI
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
