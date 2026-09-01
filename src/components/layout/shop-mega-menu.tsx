"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { shopMegaMenu, shopMegaMenuFeatured } from "@/lib/site-config";
import { motion } from "framer-motion";

export default function ShopMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute inset-x-0 top-full z-40 border-t border-light-gray bg-white premium-shadow-lg"
      role="menu"
      aria-label="Shop categories"
    >
      <div className="container-page grid grid-cols-5 gap-8 py-8">
        {shopMegaMenu.map((group) => (
          <div key={group.name} role="none">
            <Link
              href={group.href}
              onClick={onNavigate}
              className="text-[13px] font-bold uppercase tracking-wide text-navy hover:text-royal"
              role="menuitem"
            >
              {group.name}
            </Link>
            <ul className="mt-4 space-y-2.5">
              {group.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    role="menuitem"
                    className="text-sm text-slate transition-colors hover:text-royal"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="col-span-1 rounded-2xl bg-gradient-to-br from-navy to-navy-700 p-6 text-white">
          <span className="text-xs font-bold uppercase tracking-wide text-sky">
            For Business
          </span>
          <h3 className="mt-2 text-lg font-bold leading-snug">
            {shopMegaMenuFeatured.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            {shopMegaMenuFeatured.description}
          </p>
          <Link
            href={shopMegaMenuFeatured.href}
            onClick={onNavigate}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky hover:text-white"
          >
            {shopMegaMenuFeatured.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
