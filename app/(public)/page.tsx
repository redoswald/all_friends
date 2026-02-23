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

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has(SESSION_COOKIE);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Text content */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                Be the friend you wish you had
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-700 leading-relaxed">
                Life gets busy. All Friends helps you stay close to the people you care about—with gentle reminders, conversation notes, and a little help remembering what matters.
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
            How All Friends helps
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
          <p>&copy; {new Date().getFullYear()} All Friends. Built with care.</p>
        </div>
      </footer>
    </div>
  );
}
