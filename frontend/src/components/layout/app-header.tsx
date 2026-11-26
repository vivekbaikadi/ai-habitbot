
"use client";

import Link from "next/link";

import {
  Search,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

export function AppHeader() {
  const { user } = useAuth();

  const initial =
    user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-[76px]
        items-center
        border-b border-border
        bg-[#f7f5f0]/90
        px-4
        backdrop-blur-xl
        sm:px-6
        lg:px-8
      "
    >
      {/* Mobile brand */}

      <Link
        href="/dashboard"
        className="
          flex items-center gap-2.5
          lg:hidden
        "
      >
        <div
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-xl
            bg-primary
            text-white
          "
        >
          <span className="text-sm">
            ✦
          </span>
        </div>

        <span className="font-bold">
          HabitBot
        </span>
      </Link>

      {/* Desktop greeting */}

      <div className="hidden lg:block">
        <p className="text-[15px] font-semibold">
          Good to see you,{" "}
          {user?.name ?? "there"} 👋
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Let&apos;s make today count.
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}

        <button
          type="button"
          className="
            hidden
            h-10
            min-w-[230px]
            items-center
            gap-2
            rounded-full
            border border-border
            bg-card
            px-4
            text-sm
            text-muted-foreground
            transition
            hover:border-primary/30
            md:flex
          "
        >
          <Search className="h-4 w-4" />

          <span>
            Search anything...
          </span>

          <kbd
            className="
              ml-auto
              rounded-md
              bg-muted
              px-1.5
              py-0.5
              text-[10px]
            "
          >
            ⌘ K
          </kbd>
        </button>

        {/* Notifications */}

        <NotificationDropdown />

        {/* Avatar */}

        <button
          type="button"
          aria-label="Open profile"
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-full
            bg-primary
            text-sm
            font-semibold
            text-white
          "
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
