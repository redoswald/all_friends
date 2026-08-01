"use client";

import Link from "next/link";
import { Hand, CheckCircle2, Users } from "lucide-react";
import { openQuickLog } from "@/lib/quick-log";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/lib/cadence";
import type { FunnelStage } from "@/types";

interface TodayPerson {
  id: string;
  name: string;
  funnelStage: FunnelStage;
  status: ContactStatus;
}

interface TodayViewProps {
  firstName: string | null;
  stats: {
    overdueContacts: number;
    dueContacts: number;
    eventsThisMonth: number;
    totalContacts: number;
  };
  people: TodayPerson[];
}

const STAGE_AVATAR_CLASSES: Record<string, string> = {
  CLOSE: "bg-accent-50 text-accent-500",
  ESTABLISHED: "bg-teal-50 text-teal-500",
  DEVELOPING: "bg-teal-100 text-teal-400",
  ACQUAINTANCE: "bg-amber-50 text-amber-600",
  PROSPECT: "bg-gray-100 text-gray-400",
  DORMANT: "bg-gray-100 text-gray-500",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusLine(person: TodayPerson): { text: string; className: string } {
  const s = person.status;
  const lastSeen =
    s.daysSinceLastEvent !== null ? `Last seen ${s.daysSinceLastEvent}d ago` : null;
  if (s.isAway) {
    return {
      text:
        s.daysUntilBack !== null ? `Away · back in ${s.daysUntilBack}d` : "Away right now",
      className: "text-gray-500",
    };
  }
  if (!lastSeen) return { text: "No moments logged yet", className: "text-gray-500" };
  if (s.isOverdue) return { text: lastSeen, className: "text-error" };
  if (s.isDue) return { text: `Coming due · ${lastSeen.toLowerCase()}`, className: "text-amber-600" };
  return { text: lastSeen, className: "text-gray-500" };
}

function StatPill({ count, label, className }: { count: number; label: string; className: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", className)}>
      <span className="text-xs font-semibold">{count}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </span>
  );
}

export function TodayView({ firstName, stats, people }: TodayViewProps) {
  const dateLine = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="md:hidden space-y-5 pt-8">
      <div className="space-y-1">
        <h1 className="text-[2rem] font-semibold leading-tight" suppressHydrationWarning>
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-gray-500" suppressHydrationWarning>
          {dateLine}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {stats.overdueContacts > 0 && (
            <StatPill count={stats.overdueContacts} label="overdue" className="bg-error/8 text-error" />
          )}
          {stats.dueContacts > 0 && (
            <StatPill count={stats.dueContacts} label="due soon" className="bg-amber-500/8 text-amber-600" />
          )}
          <StatPill
            count={stats.eventsThisMonth}
            label="moments this month"
            className="bg-teal-500/8 text-teal-500"
          />
        </div>
      </div>

      {people.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
          <Hand className="h-3.5 w-3.5 text-accent-400" />
            Reach out
          </h2>
          <div className="space-y-2">
            {people.map((person) => {
              const line = statusLine(person);
              return (
                <Link
                  key={person.id}
                  href={`/contacts/${person.id}`}
                  className="flex items-center gap-3 rounded-2xl border bg-[var(--ds-white)] p-3 shadow-xs"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold",
                      STAGE_AVATAR_CLASSES[person.funnelStage] ?? "bg-gray-100 text-gray-500"
                    )}
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{person.name}</span>
                    <span className={cn("block truncate text-xs", line.className)}>
                      {line.text}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openQuickLog({ contactIds: [person.id] });
                    }}
                    className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-accent-50 px-3.5 text-xs font-semibold text-accent-500"
                  >
                    <span className="text-sm leading-none">+</span> Log
                  </button>
                </Link>
              );
            })}
          </div>
        </section>
      ) : stats.totalContacts === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-[var(--ds-white)] px-6 py-10 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
            <Users className="h-7 w-7 text-teal-500" />
          </span>
          <p className="text-lg font-semibold">No people yet</p>
          <p className="text-sm text-gray-500">
            Add someone you care about to start tending your relationships.
          </p>
          <Link
            href="/contacts?new=1"
            className="mt-1 rounded-3xl bg-accent-500 px-6 py-3 text-sm font-medium text-white"
          >
            Add Person
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-[var(--ds-white)] px-6 py-10 text-center shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-teal-500" />
          <p className="text-lg font-semibold">All caught up</p>
          <p className="text-sm text-gray-500">
            No one needs attention right now. See someone today? Log it while it&apos;s fresh.
          </p>
          <button
            type="button"
            onClick={() => openQuickLog()}
            className="mt-1 rounded-3xl border border-accent-300/30 bg-accent-50 px-6 py-3 text-sm font-medium text-accent-500"
          >
            Log a moment
          </button>
        </div>
      )}
    </div>
  );
}
