"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import Logo from "@/components/logo";
import { adminNavSections } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-navy-700 lg:bg-navy">
      <div className="flex h-16 shrink-0 items-center border-b border-navy-700 px-6">
        <Logo variant="light" />
      </div>
      <p className="px-6 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
        Admin Portal
      </p>

      <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-4">
        {adminNavSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                if (item.comingSoon) {
                  return (
                    <li key={item.href}>
                      <span
                        aria-disabled="true"
                        title={`${item.label} — coming soon`}
                        className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium text-white/35"
                      >
                        <span className="flex items-center gap-2.5">
                          <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                          {item.label}
                        </span>
                        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </span>
                    </li>
                  );
                }

                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white",
                        isActive && "border-royal bg-white/10 font-semibold text-white",
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
