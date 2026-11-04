"use client";

import { usePathname } from "next/navigation";

import { UserProvider } from "@/lib/current-user";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";

const AUTH_ROUTES = new Set(["/login", "/register"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <UserProvider>
      <div className="min-h-dvh">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <div className="mx-auto flex w-full max-w-[1680px] gap-3 px-3 py-3 md:gap-4 md:px-4 md:py-4">
          <AppSidebar />

          <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
            <Topbar />
            <main
              id="main-content"
              tabIndex={-1}
              className="min-w-0 flex-1 pb-24 outline-none md:pb-2"
            >
              {children}
            </main>
          </div>
        </div>

        <MobileNav />
      </div>
    </UserProvider>
  );
}
