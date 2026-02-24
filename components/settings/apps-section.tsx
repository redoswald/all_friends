import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const apps = [
  {
    name: "All Friends",
    description: "Personal relationship manager",
    borderColor: "#D14545",
    current: true,
  },
  {
    name: "Opus",
    description: "AI-assisted task manager",
    borderColor: "#F97316",
    href: "https://opus.aaronos.ai",
  },
] as const;

export function AppsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Apps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {apps.map((app) => {
          const content = (
            <div
              key={app.name}
              className="flex items-center justify-between rounded-lg border-l-4 px-4 py-3"
              style={{ borderLeftColor: app.borderColor }}
            >
              <div>
                <p className="text-sm font-medium">{app.name}</p>
                <p className="text-xs text-muted-foreground">
                  {app.description}
                </p>
              </div>
              {"current" in app && app.current ? (
                <Badge variant="secondary">Current app</Badge>
              ) : (
                <ExternalLink className="size-4 text-muted-foreground" />
              )}
            </div>
          );

          if ("href" in app) {
            return (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg transition-colors hover:bg-muted/50"
              >
                {content}
              </a>
            );
          }

          return content;
        })}
      </CardContent>
    </Card>
  );
}
