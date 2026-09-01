import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/require-admin";
import AdminShell from "@/components/admin/admin-shell";
import { inter } from "@/lib/fonts";
import "../globals.css";

// Deliberately its own root layout (no ancestor layout.tsx above this one)
// so it never inherits the storefront's Header/Footer/Providers — see
// src/app/(storefront)/layout.tsx for the customer-facing equivalent.
export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | i.Link Admin",
  },
  // Never indexed — this is a private, authenticated-only section.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Layer 2 of route protection — independent of src/proxy.ts (Layer 1).
  // The UI shell below is not a security boundary; it is purely
  // presentational and renders only after this check has already passed.
  const session = await requireAdmin();

  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-soft-gray text-dark-slate">
        <AdminShell userEmail={session.user.email ?? ""} userName={session.user.name ?? null}>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
