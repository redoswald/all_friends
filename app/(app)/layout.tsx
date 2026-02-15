import { Nav } from "@/components/nav";
import { CommandPalette } from "@/components/command-palette";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFFAFA]">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
