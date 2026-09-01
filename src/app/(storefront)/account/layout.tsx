import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut, MapPin, Package, User } from "lucide-react";
import Container from "@/components/ui/container";
import { auth } from "@/auth";
import { logout } from "@/app/(storefront)/account/actions";

const navItems = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
];

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  // Layer 2 of route protection — independent of proxy.ts (Layer 1), per
  // component, so no page under /account/* ever relies solely on the
  // proxy having run correctly.
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav
              aria-label="Account"
              className="flex gap-2 overflow-x-auto rounded-2xl border border-light-gray bg-white p-2 premium-shadow lg:flex-col lg:overflow-visible"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-soft-gray hover:text-royal"
                >
                  <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
              <form action={logout} className="contents">
                <button
                  type="submit"
                  className="flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-slate transition-colors hover:bg-soft-gray hover:text-royal"
                >
                  <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
                  Log Out
                </button>
              </form>
            </nav>
          </aside>

          <main>{children}</main>
        </div>
      </Container>
    </div>
  );
}
