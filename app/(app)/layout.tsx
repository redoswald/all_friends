import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import { QuickLogHost } from "@/components/mobile/quick-log-host";
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
      <main className="flex-1 min-w-0 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:pb-6">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <MobileTabBar />
      <QuickLogHost />
      <CommandPalette />
      <KeyboardShortcuts />
      <Toaster mobileOffset={{ bottom: 96 }} />
    </div>
  );
}
