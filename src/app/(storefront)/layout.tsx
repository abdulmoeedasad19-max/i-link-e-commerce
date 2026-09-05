import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Providers from "@/contexts/providers";
import { inter } from "@/lib/fonts";
import { safeJsonLd } from "@/lib/utils";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import "../globals.css";

const siteUrl = "https://www.ilinksystems.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "i.Link Systems & Solutions | Genuine Laptops, PCs & IT Solutions in Pakistan",
    template: "%s | i.Link Systems & Solutions",
  },
  description:
    "Shop genuine laptops, desktop PCs, gaming rigs, networking gear, CCTV and IT accessories from HP, Dell, Lenovo, ASUS and more. Trusted by 250,000+ customers and businesses across Pakistan for enterprise IT solutions, bulk procurement and nationwide delivery.",
  keywords: [
    "buy laptops in Pakistan",
    "gaming PC Pakistan",
    "computer store Pakistan",
    "business IT solutions",
    "enterprise IT solutions",
    "networking products",
    "CCTV solutions",
    "computer accessories",
    "workstation PCs",
    "business computers",
    "corporate IT procurement",
    "genuine IT products",
    "HP Pakistan",
    "Dell Pakistan",
    "Lenovo Pakistan",
  ],
  authors: [{ name: "i.Link Systems & Solutions" }],
  creator: "i.Link Systems & Solutions",
  publisher: "i.Link Systems & Solutions",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: "i.Link Systems & Solutions",
    title: "i.Link Systems & Solutions | Genuine Laptops, PCs & IT Solutions in Pakistan",
    description:
      "Pakistan's trusted technology retailer for genuine laptops, desktops, gaming PCs, networking, CCTV and enterprise IT solutions. Authorized reseller with official warranty.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "i.Link Systems & Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "i.Link Systems & Solutions | Genuine Laptops, PCs & IT Solutions in Pakistan",
    description:
      "Pakistan's trusted technology retailer for genuine laptops, desktops, gaming PCs, networking, CCTV and enterprise IT solutions.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "i.Link Systems & Solutions",
  url: siteUrl,
  logo: `${siteUrl}/brand/ilink-logo.jpeg`,
  description:
    "Authorized reseller of genuine laptops, desktop PCs, networking equipment, CCTV and IT accessories, serving consumers and enterprises across Pakistan.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "PK",
  },
  sameAs: [
    "https://www.facebook.com/",
    "https://www.instagram.com/",
    "https://www.youtube.com/",
    "https://www.linkedin.com/",
  ],
};

export default function StorefrontRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-dark-slate">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to main content
        </a>
        <Providers>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
        <WhatsAppButton />
      </body>
    </html>
  );
}
