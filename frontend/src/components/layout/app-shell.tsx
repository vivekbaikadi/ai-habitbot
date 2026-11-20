
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && !user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    router,
    pathname,
  ]);

  if (
    isLoading ||
    !isAuthenticated ||
    (user && !user.onboardingCompleted)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">
          Loading HabitBot...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <div className="min-h-screen lg:pl-[260px]">
        <AppHeader />

        <main
          className="
            min-h-[calc(100vh-4.75rem)]
            px-4 py-5
            pb-24
            sm:px-6 sm:py-6
            lg:px-8 lg:py-8
            lg:pb-10
          "
        >
          <div
            className="
              mx-auto w-full
              max-w-[1500px]
              animate-habitbot-fade-in
            "
          >
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
