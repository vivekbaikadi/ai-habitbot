"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  BarChart3,
  Bot,
  CheckCircle2,
  Goal,
  LayoutDashboard,
  LogOut,
  Settings,
  Utensils,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Habits",
    href: "/habits",
    icon: CheckCircle2,
  },
  {
    label: "Goals",
    href: "/goals",
    icon: Goal,
  },
  {
    label: "Nutrition",
    href: "/nutrition",
    icon: Utensils,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "AI Coach",
    href: "/ai-coach",
    icon: Bot,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const initial =
    user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-40 hidden
        w-[260px]
        flex-col
        border-r border-border
        bg-[#fbfaf7]
        lg:flex
      "
    >
      {/* Brand */}

      <div className="px-6 pb-7 pt-7">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div
            className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl
              bg-primary
              text-white
              shadow-[0_8px_20px_rgba(244,119,60,0.2)]
            "
          >
            <Bot
              className="h-6 w-6"
              strokeWidth={2.1}
            />
          </div>

          <div>
            <div className="text-[20px] font-bold tracking-tight">
              HabitBot
            </div>

            <div className="text-[11px] text-muted-foreground">
              Your better self
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}

      <nav className="flex-1 px-4">
        <p
          className="
            mb-3 px-3
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.16em]
            text-muted-foreground
          "
        >
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3
                  rounded-xl
                  px-3 py-3
                  text-sm
                  font-medium
                  transition-all duration-200

                  ${
                    active
                      ? `
                        bg-primary-soft
                        text-primary
                      `
                      : `
                        text-muted-foreground
                        hover:bg-muted
                        hover:text-foreground
                      `
                  }
                `}
              >
                <span
                  className={`
                    flex h-9 w-9
                    items-center justify-center
                    rounded-lg
                    transition-colors

                    ${
                      active
                        ? "bg-primary text-white"
                        : "bg-transparent"
                    }
                  `}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={
                      active ? 2.3 : 1.9
                    }
                  />
                </span>

                <span>{item.label}</span>

                {item.label === "AI Coach" && (
                  <span
                    className="
                      ml-auto rounded-full
                      bg-primary-soft
                      px-2 py-0.5
                      text-[9px]
                      font-semibold
                      text-primary
                    "
                  >
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}

      <div className="border-t border-border p-4">
        <Link
          href="/settings"
          className="
            mb-2 flex items-center gap-3
            rounded-xl px-3 py-3
            text-sm font-medium
            text-muted-foreground
            transition-colors
            hover:bg-muted
            hover:text-foreground
          "
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>

        <div
          className="
            flex items-center gap-3
            rounded-xl
            border border-border
            bg-white
            p-3
          "
        >
          <div
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-full
              bg-primary
              text-sm font-semibold
              text-white
            "
          >
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.name ?? "User"}
            </p>

            <p className="text-[11px] text-muted-foreground">
              Personal account
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="
            mt-2 flex w-full
            items-center gap-3
            rounded-xl px-3 py-3
            text-sm font-medium
            text-muted-foreground
            transition-colors
            hover:bg-danger-soft
            hover:text-danger
          "
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}