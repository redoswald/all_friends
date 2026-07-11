import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Calendar,
  Bell,
  Plane,
  Tags,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const SESSION_COOKIE = "prm_session";

const features = [
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Keep track of everyone important in your life with customizable cadence goals.",
    color: "teal" as const,
  },
  {
    icon: Calendar,
    title: "Event Logging",
    description:
      "Log hangouts, calls, and messages to track when you last connected.",
    color: "accent" as const,
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Get notified when contacts are due or overdue based on your cadence settings.",
    color: "teal" as const,
  },
  {
    icon: Plane,
    title: "OOO Scheduling",
    description:
      "Mark contacts as away and their due dates automatically adjust.",
    color: "accent" as const,
  },
  {
    icon: Tags,
    title: "Tags & Organization",
    description:
      "Organize contacts with custom tags and filter by any criteria.",
    color: "teal" as const,
  },
  {
    icon: TrendingUp,
    title: "Relationship Stages",
    description:
      "Track relationship progression from acquaintance to close friend.",
    color: "accent" as const,
  },
];

const suiteApps = [
  {
    name: "Intend",
    tagline: "Tasks, done intentionally",
    href: "https://tasks.doneintentionally.com",
    color: "#F97316",
  },
  {
    name: "Tend",
    tagline: "Friends, done intentionally",
    href: null,
    color: "#FF6B6B",
  },
  {
    name: "Attend",
    tagline: "Time, done intentionally",
    href: "https://time.doneintentionally.com",
    color: "#6D28D9",
  },
  {
    name: "Portend",
    tagline: "Beliefs, done intentionally",
    href: "https://beliefs.doneintentionally.com",
    color: "#0F766E",
  },
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has(SESSION_COOKIE);

  return (
    <div className="flex flex-col">
      {/* Nav */}
      <header className="px-4 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full bg-accent-300"
              aria-hidden="true"
            />
            <span className="text-lg font-bold tracking-tight text-gray-950">
              Tend
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <a
              href="https://doneintentionally.com"
              className="hidden sm:inline text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Done Intentionally
            </a>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="rounded-xl">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="rounded-xl">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Text content */}
            <div className="text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-accent-300 mb-4">
                Friends, done intentionally
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                Be the friend you wish you had
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-700 leading-relaxed">
                Life gets busy, and good relationships drift by accident. Tend
                is a gentle relationship manager — cadences, conversation
                notes, and reminders that help you stay close to the people you
                care about, on purpose.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto px-8 py-6 text-base rounded-xl border-2 border-gray-200 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-400 transition-all"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right - Illustration */}
            <div className="hidden md:flex justify-center items-center">
              <Image
                src="/flat_vector_homepage.png"
                alt="People connecting and building relationships"
                width={500}
                height={350}
                className="rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-card/80">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-12">
            How Tend helps
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-200 hover:-translate-y-1 transition-all duration-200"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        feature.color === "accent"
                          ? "bg-accent-50 text-accent-300"
                          : "bg-teal-50 text-teal-300"
                      }`}
                    >
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Works with your AI */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex p-3 rounded-xl bg-accent-50 text-accent-300 mb-6">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Works with your AI
          </h2>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed">
            Tend ships an MCP server, so you can connect Claude — or any
            MCP-capable assistant — to your real relationships. Ask who
            you&apos;re overdue to see, log a hangout from a conversation, or
            plan a week of catch-ups without opening the app.
          </p>
        </div>
      </section>

      {/* Part of Done Intentionally */}
      <section className="px-4 py-16 bg-card/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Part of Done Intentionally
            </h2>
            <p className="mt-4 text-lg text-gray-700 leading-relaxed">
              Tend is one of a family of small apps for living intentionally —
              tasks, friends, time, and beliefs, sharing one account and
              connected to each other and to your AI.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {suiteApps.map((app) => {
              const inner = (
                <div
                  className={`h-full rounded-2xl border p-5 transition-all duration-200 ${
                    app.href
                      ? "border-gray-200 bg-card hover:shadow-md hover:-translate-y-1"
                      : "border-accent-200 bg-accent-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: app.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-gray-900">
                      {app.name}
                    </span>
                    {!app.href && (
                      <span className="ml-auto text-xs font-medium text-accent-400">
                        You&apos;re here
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{app.tagline}</p>
                </div>
              );
              return app.href ? (
                <a key={app.name} href={app.href}>
                  {inner}
                </a>
              ) : (
                <div key={app.name}>{inner}</div>
              );
            })}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            <a
              href="https://doneintentionally.com"
              className="text-accent-300 hover:text-accent-400 hover:underline"
            >
              Explore the whole system →
            </a>
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-accent-300 to-teal-300 rounded-3xl p-10 shadow-lg">
          <h2 className="text-2xl font-semibold text-white">
            Ready to be a better friend?
          </h2>
          <p className="mt-2 text-white/90">
            Your relationships will thank you.
          </p>
          <div className="mt-6">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl px-8 shadow-md">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl px-8 shadow-md">
                  Get Started for Free
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="px-4 py-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Tend &middot; Part of{" "}
            <a
              href="https://doneintentionally.com"
              className="hover:text-gray-900"
            >
              Done Intentionally
            </a>{" "}
            &middot; Built with care.
          </p>
        </div>
      </footer>
    </div>
  );
}
