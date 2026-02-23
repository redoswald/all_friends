import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-[var(--ds-gray-50)]">
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
      />
      <main className="flex-1 min-w-0 px-4 py-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
