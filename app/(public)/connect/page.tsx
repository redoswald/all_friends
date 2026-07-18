import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { getUser } from "@/lib/auth";
import { CopyConnector } from "@/components/connect/copy-connector";

export const metadata = {
  title: "Connect Tend to your AI",
  description:
    "Connect Tend to Claude or any MCP-capable assistant so it can help you keep up with the people who matter.",
};

export const MCP_CONNECTOR_URL = "https://tend-mcp.vercel.app/api/mcp";

const EXAMPLE_ASKS = [
  "Who am I overdue to reach out to?",
  'Log that I grabbed coffee with Maya — she just started a new job',
  "What catch-ups and birthdays are coming up this month?",
  "Draft a plan to reconnect with three people I've lost touch with",
];

export default async function ConnectPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-background to-accent-50">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex rounded-2xl bg-accent-50 p-3 text-accent-300">
            <Sparkles className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Connect Tend to <span className="text-accent-300">your AI</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Tend has no chatbot of its own — instead, it plugs into the AI you
            already use. Connect once and your assistant can see who you&apos;re
            due to reach out to, log catch-ups, and plan your week with you.
          </p>
        </div>

        {/* Connector URL */}
        <div className="mb-10">
          <p className="mb-2 text-center text-sm font-medium">Your connector URL</p>
          <CopyConnector url={MCP_CONNECTOR_URL} />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          <Step n={1} title="Have a Tend account">
            <p>
              Sign in to Tend — with Google or email — and that same account is
              what you&apos;ll approve access with.{" "}
              {user ? (
                <span className="font-medium text-accent-300">
                  You&apos;re signed in and ready. ✓
                </span>
              ) : (
                <Link href="/signup" className="font-medium text-accent-300 hover:underline">
                  Create your account first →
                </Link>
              )}
            </p>
          </Step>

          <Step n={2} title="Add the connector in your AI">
            <div className="space-y-4">
              <div>
                <p className="mb-1 font-medium text-foreground">
                  Claude (claude.ai, desktop, or mobile)
                </p>
                <p>
                  Go to{" "}
                  <span className="font-medium">
                    Settings → Connectors → Add custom connector
                  </span>
                  , paste the URL above, and click Add. Then enable it in any
                  chat from the <span className="font-medium">+</span> menu.
                </p>
              </div>
              <div>
                <p className="mb-1 font-medium text-foreground">Other assistants</p>
                <p>
                  Any client that supports remote MCP connectors works — look for
                  &quot;connectors,&quot; &quot;integrations,&quot; or &quot;MCP
                  servers&quot; in its settings and paste the same URL.
                </p>
              </div>
            </div>
          </Step>

          <Step n={3} title="Approve access">
            <p>
              Your AI will open a Tend authorization page. Sign in with the same
              account and click <span className="font-medium">Approve</span>.
              That&apos;s it — your assistant only ever sees <em>your</em>{" "}
              contacts, and you can revoke access from your AI&apos;s connector
              settings anytime.
            </p>
          </Step>
        </div>

        {/* Try it */}
        <div className="mt-12 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-3 font-semibold">Then try asking</h2>
          <ul className="space-y-2">
            {EXAMPLE_ASKS.map((ask) => (
              <li
                key={ask}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 size-4 flex-shrink-0 text-accent-300" />
                <span>&quot;{ask}&quot;</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Tip: in Claude, the connector also adds ready-made prompts — look for{" "}
            <span className="font-medium">Social review</span> and{" "}
            <span className="font-medium">Log a catch-up</span> in the + menu.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-sm text-muted-foreground hover:text-accent-300"
          >
            ← Back to Tend
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-300 font-semibold text-white">
          {n}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="mb-2 font-semibold">{title}</h2>
          <div className="text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
