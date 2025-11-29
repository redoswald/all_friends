"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Calendar, CalendarDays, LogOut, Menu } from "lucide-react";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg">
              PRM
            </Link>
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop sign out */}
          <form action={signOut} className="hidden md:block">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </form>

          {/* Mobile hamburger menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 text-base rounded-md transition-colors",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="border-t my-2" />
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex items-center gap-3 px-3 py-3 text-base rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
