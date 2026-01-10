import Link from "next/link";
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
} from "lucide-react";

const SESSION_COOKIE = "prm_session";

const features = [
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Keep track of everyone important in your life with customizable cadence goals.",
  },
  {
    icon: Calendar,
    title: "Event Logging",
    description:
      "Log hangouts, calls, and messages to track when you last connected.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Get notified when contacts are due or overdue based on your cadence settings.",
  },
  {
    icon: Plane,
    title: "OOO Scheduling",
    description:
      "Mark contacts as away and their due dates automatically adjust.",
  },
  {
    icon: Tags,
    title: "Tags & Organization",
    description:
      "Organize contacts with custom tags and filter by any criteria.",
  },
  {
    icon: TrendingUp,
    title: "Relationship Stages",
    description:
      "Track relationship progression from acquaintance to close friend.",
  },
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has(SESSION_COOKIE);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
            All Friends
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-600">
            Your Personal Relationship Manager
          </p>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
            Stay connected with the people who matter most. Track interactions,
            set reminders, and never let important relationships fade away.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-12">
            Everything you need to nurture relationships
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-gray-700" />
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

      {/* Footer CTA */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Ready to stay connected?
          </h2>
          <p className="mt-2 text-gray-500">
            Start managing your relationships today.
          </p>
          <div className="mt-6">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg">Get Started for Free</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="px-4 py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} All Friends. Built with care.</p>
        </div>
      </footer>
    </div>
  );
}
