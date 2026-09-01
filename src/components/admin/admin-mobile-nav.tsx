"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import Logo from "@/components/logo";
import { adminNavSections } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

export default function AdminMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-xs flex-col overflow-y-auto bg-navy lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
              <Logo variant="light" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-full p-2 text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Admin" className="flex-1 space-y-6 px-3 py-4">
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
                              className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/35"
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
                            onClick={onClose}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white",
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
