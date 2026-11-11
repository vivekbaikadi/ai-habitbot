"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bot,
  CheckCircle2,
  Home,
  Plus,
  Utensils,
} from "lucide-react";

const navigation = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Habits",
    href: "/habits",
    icon: CheckCircle2,
  },
  {
    label: "Nutrition",
    href: "/nutrition",
    icon: Utensils,
  },
  {
    label: "AI Coach",
    href: "/ai/coach",
    icon: Bot,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-50
        border-t border-border
        bg-[#fffdfa]/95
        backdrop-blur-xl
        lg:hidden
      "
    >
      <div
        className="
          mx-auto flex
          h-[72px]
          max-w-lg
          items-center
          justify-around
          px-2
        "
      >
        {navigation.slice(0, 2).map(
          (item) => {
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
                  flex min-w-16
                  flex-col items-center
                  gap-1 rounded-xl
                  px-3 py-2
                  text-[10px]
                  font-medium
                  ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                `}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={
                    active ? 2.4 : 1.9
                  }
                />

                {item.label}
              </Link>
            );
          }
        )}

        {/* Quick add */}

        <button
          type="button"
          aria-label="Quick add"
          className="
            -mt-7
            flex h-14 w-14
            items-center justify-center
            rounded-full
            bg-primary
            text-white
            shadow-[0_10px_25px_rgba(244,119,60,0.3)]
            transition-transform
            active:scale-95
          "
        >
          <Plus
            className="h-6 w-6"
            strokeWidth={2}
          />
        </button>

        {navigation.slice(2).map(
          (item) => {
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
                  flex min-w-16
                  flex-col items-center
                  gap-1 rounded-xl
                  px-3 py-2
                  text-[10px]
                  font-medium
                  ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                `}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={
                    active ? 2.4 : 1.9
                  }
                />

                {item.label ===
                "AI Coach"
                  ? "AI"
                  : item.label}
              </Link>
            );
          }
        )}
      </div>

      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}