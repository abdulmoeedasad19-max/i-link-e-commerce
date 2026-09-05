import type { ComponentType, SVGProps } from "react";
import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  Tags,
  ShoppingCart,
  FileText,
  Users,
  ShieldCheck,
  Star,
  Boxes,
  Percent,
  Image,
  CreditCard,
  ChartBar,
  Settings,
  History,
  Mail,
  Rss,
  Undo2,
  PenLine,
} from "lucide-react";

export type AdminNavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type AdminNavItem = {
  label: string;
  href: string;
  icon: AdminNavIcon;
  /**
   * No page exists at `href` yet. Rendered as a clearly-labeled, disabled
   * item instead of a real link — never a broken or blank destination.
   */
  comingSoon?: boolean;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    title: "Main",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: LayoutGrid },
      { label: "Brands", href: "/admin/brands", icon: Tags },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Return Requests", href: "/admin/returns", icon: Undo2 },
      { label: "Quotations", href: "/admin/quotations", icon: FileText },
      { label: "Contact Messages", href: "/admin/contact", icon: Mail },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Admin Users", href: "/admin/admin-users", icon: ShieldCheck },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "Inventory",
    items: [{ label: "Inventory", href: "/admin/inventory", icon: Boxes }],
  },
  {
    title: "Content",
    items: [
      { label: "Blog Posts", href: "/admin/blog", icon: PenLine },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Discounts / Coupons", href: "/admin/discounts", icon: Percent },
      { label: "Newsletter Subscribers", href: "/admin/newsletter", icon: Rss },
      { label: "Banners", href: "/admin/banners", icon: Image },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: CreditCard, comingSoon: true },
      { label: "Reports", href: "/admin/reports", icon: ChartBar },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Activity Log", href: "/admin/activity-log", icon: History },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
