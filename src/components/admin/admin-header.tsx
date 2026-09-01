"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, ShieldCheck } from "lucide-react";
import { logout } from "@/app/(storefront)/account/actions";
import { adminNavSections } from "@/components/admin/admin-nav";

function currentPageTitle(pathname: string): string {
  for (const section of adminNavSections) {
    const match = section.items.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    if (match) return match.label;
  }
  return "Admin";
}

export default function AdminHeader({
  onMenuClick,
  userEmail,
  userName,
}: {
  onMenuClick: () => void;
  userEmail: string;
  userName: string | null;
}) {
  const pathname = usePathname();
  const title = currentPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-light-gray bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="rounded-lg p-2 text-navy hover:bg-soft-gray lg:hidden"
          >
            <Menu className="h-5.5 w-5.5" aria-hidden="true" />
          </button>
          <h1 className="truncate text-base font-bold text-navy sm:text-lg">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            aria-label="Notifications (coming soon)"
            title="Notifications — coming soon"
            className="rounded-full p-2.5 text-slate transition-colors hover:bg-soft-gray hover:text-navy"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="hidden items-center gap-2 border-l border-light-gray pl-3 sm:flex">
            <div className="text-right leading-tight">
              <p className="max-w-[10rem] truncate text-sm font-semibold text-navy">
                {userName || userEmail}
              </p>
              <p className="flex items-center justify-end gap-1 text-xs text-slate">
                <ShieldCheck className="h-3 w-3 text-royal" aria-hidden="true" />
                Administrator
              </p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              aria-label="Log out"
              title="Log out"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate transition-colors hover:bg-soft-gray hover:text-navy sm:px-3"
            >
              <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
