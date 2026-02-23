"use client";

import { signOut } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface AccountMenuProps {
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export function AccountMenu({ user }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--ds-gray-100)]">
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />}
            <AvatarFallback className="bg-accent-50 text-accent-400 text-xs font-medium">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-[var(--ds-gray-700)]">
            {user.name || user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name || "User"}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
