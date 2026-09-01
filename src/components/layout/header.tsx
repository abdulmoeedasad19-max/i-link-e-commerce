"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Menu, Search, Heart, User, ShoppingCart, ChevronDown } from "lucide-react";
import Container from "@/components/ui/container";
import Logo from "@/components/logo";
import TopBar from "@/components/layout/topbar";
import ShopMegaMenu from "@/components/layout/shop-mega-menu";
import MobileNav from "@/components/layout/mobile-nav";
import { navLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";

export default function Header() {
  const router = useRouter();
  const { cartItemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="sticky top-0 z-50">
      <TopBar />
      <header
        onMouseLeave={() => setShopOpen(false)}
        className={cn(
          "relative border-b border-light-gray bg-white/95 backdrop-blur transition-shadow duration-200",
          scrolled && "shadow-[0_4px_16px_-4px_rgba(15,23,42,0.12)]",
        )}
      >
        <Container className="flex h-20 items-center justify-between gap-6">
          <button
            type="button"
            className="rounded-lg p-2 text-navy hover:bg-soft-gray lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <Logo />

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
            >
              <button
                type="button"
                aria-expanded={shopOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-[15px] font-semibold text-navy transition-colors hover:bg-soft-gray hover:text-royal"
              >
                Shop
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform duration-200", shopOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="rounded-lg px-4 py-2.5 text-[15px] font-semibold text-navy transition-colors hover:bg-soft-gray hover:text-royal"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <form
            role="search"
            onSubmit={submitSearch}
            className="hidden flex-1 max-w-md items-center md:flex"
          >
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <div className="relative w-full">
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-royal"
              >
                <Search className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
              <input
                id="site-search"
                type="search"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories…"
                className="w-full rounded-full border border-light-gray bg-soft-gray py-2.5 pl-10 pr-4 text-sm text-dark-slate placeholder:text-slate/70 outline-none transition-colors focus:border-royal focus:bg-white focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => router.push("/search")}
              className="rounded-full p-2.5 text-navy hover:bg-soft-gray md:hidden"
            >
              <Search className="h-5.5 w-5.5" aria-hidden="true" />
            </button>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden rounded-full p-2.5 text-navy hover:bg-soft-gray sm:inline-flex"
            >
              <Heart className="h-5.5 w-5.5" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              aria-label="Account"
              className="hidden rounded-full p-2.5 text-navy hover:bg-soft-gray sm:inline-flex"
            >
              <User className="h-5.5 w-5.5" aria-hidden="true" />
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping cart, ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}`}
              className="relative rounded-full p-2.5 text-navy hover:bg-soft-gray"
            >
              <ShoppingCart className="h-5.5 w-5.5" aria-hidden="true" />
              {cartItemCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-royal text-[10px] font-bold text-white">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </Container>

        <AnimatePresence>{shopOpen && <ShopMegaMenu onNavigate={() => setShopOpen(false)} />}</AnimatePresence>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
