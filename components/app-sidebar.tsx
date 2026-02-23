"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  CalendarDays,
  Search,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AccountMenu } from "@/components/account-menu";

const STORAGE_KEY = "all-friends-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 360;

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

interface AppSidebarProps {
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Restore persisted width
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed);
      }
    }
  }, []);

  // Persist width
  const persistWidth = useCallback((w: number) => {
    localStorage.setItem(STORAGE_KEY, String(w));
  }, []);

  // Drag-to-resize
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startX = e.clientX;
      const startWidth = width;

      function onMouseMove(ev: MouseEvent) {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
        setWidth(newWidth);
      }

      function onMouseUp(ev: MouseEvent) {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        setIsDragging(false);
        const delta = ev.clientX - startX;
        const finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
        setWidth(finalWidth);
        persistWidth(finalWidth);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, persistWidth]
  );

  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    persistWidth(DEFAULT_WIDTH);
  }, [persistWidth]);

  const sidebarContent = (
    <>
      {/* Zone 1: App Identity */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent-50">
          <Users className="size-4 text-accent-300" />
        </div>
        <span className="text-sm font-semibold text-[var(--ds-gray-900)]">
          All Friends
        </span>
      </div>

      {/* Zone 2: Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent-50 text-accent-300 font-medium"
                    : "text-[var(--ds-gray-700)] hover:bg-[var(--ds-gray-100)]"
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Search hint */}
        <button
          onClick={() =>
            document.dispatchEvent(new Event("open-command-palette"))
          }
          className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--ds-gray-500)] transition-colors hover:bg-[var(--ds-gray-100)]"
        >
          <Search className="size-[18px]" strokeWidth={1.75} />
          <span>Search</span>
          <kbd className="ml-auto rounded border border-[var(--ds-gray-200)] px-1.5 py-0.5 text-xs text-[var(--ds-gray-500)]">
            ⌘K
          </kbd>
        </button>
      </nav>

      {/* Zone 3: Account */}
      <div className="border-t border-[var(--ds-gray-200)] px-3 py-3">
        <AccountMenu user={user} />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        ref={sidebarRef}
        style={{ width: `${width}px`, transition: isDragging ? "none" : "width 200ms ease" }}
        className="hidden md:flex h-screen flex-col border-r border-[var(--ds-gray-200)] bg-white sticky top-0 shrink-0"
      >
        {sidebarContent}

        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[var(--ds-gray-300)] transition-colors z-10"
        />
      </aside>

      {/* Mobile hamburger + sheet */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-white shadow-sm border border-[var(--ds-gray-200)]">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
