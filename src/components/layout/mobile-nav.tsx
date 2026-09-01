"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Phone, Mail } from "lucide-react";
import { shopMegaMenu, navLinks, siteConfig } from "@/lib/site-config";
import Logo from "@/components/logo";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

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
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-light-gray px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-full p-2 text-navy hover:bg-soft-gray"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 px-5 py-4" aria-label="Mobile">
              <div className="border-b border-light-gray pb-3">
                <p className="px-1 py-2 text-xs font-bold uppercase tracking-wide text-slate">
                  Shop
                </p>
                {shopMegaMenu.map((group) => {
                  const isOpen = openGroup === group.name;
                  return (
                    <div key={group.name} className="border-t border-light-gray/70 first:border-t-0">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-3 text-left text-[15px] font-semibold text-navy"
                        aria-expanded={isOpen}
                        onClick={() => setOpenGroup(isOpen ? null : group.name)}
                      >
                        {group.name}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-slate transition-transform",
                            isOpen && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <ul className="mb-2 space-y-2 pl-2">
                          {group.items.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className="block py-1 text-sm text-slate hover:text-royal"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="py-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={onClose}
                    className="block py-3 text-[15px] font-semibold text-navy border-b border-light-gray/70 last:border-b-0"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button href="/login" variant="secondary" size="sm" onClick={onClose}>
                  Log In
                </Button>
                <Button href="/signup" variant="primary" size="sm" onClick={onClose}>
                  Sign Up
                </Button>
              </div>
            </nav>

            <div className="space-y-2 border-t border-light-gray px-5 py-4">
              <a
                href={siteConfig.phoneHref}
                className="flex items-center gap-2 text-sm font-medium text-slate"
              >
                <Phone className="h-4 w-4 text-royal" aria-hidden="true" />
                {siteConfig.phone}
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-2 text-sm font-medium text-slate"
              >
                <Mail className="h-4 w-4 text-royal" aria-hidden="true" />
                {siteConfig.email}
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
