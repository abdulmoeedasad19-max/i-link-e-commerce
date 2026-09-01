import { Inter } from "next/font/google";

// Shared across both root layouts (storefront and admin) — see
// src/app/(storefront)/layout.tsx and src/app/admin/layout.tsx. Extracted
// so the two independent root layouts required by the route-group
// structure don't each configure the font loader separately.
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
