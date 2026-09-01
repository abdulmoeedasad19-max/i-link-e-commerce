"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";
import AdminMobileNav from "@/components/admin/admin-mobile-nav";

/**
 * Thin client-side composition layer. src/app/admin/layout.tsx is an async
 * Server Component (it awaits requireAdmin()), so it can't itself hold the
 * mobile-nav-open state that AdminHeader's menu button and AdminMobileNav
 * need to share — this is the small "genuinely necessary" extra component
 * that does just that, nothing more.
 */
export default function AdminShell({
  userEmail,
  userName,
  children,
}: {
  userEmail: string;
  userName: string | null;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-soft-gray">
      <AdminSidebar />
      <AdminMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="lg:pl-64">
        <AdminHeader
          onMenuClick={() => setMobileNavOpen(true)}
          userEmail={userEmail}
          userName={userName}
        />
        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
