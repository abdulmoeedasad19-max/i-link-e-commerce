import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Lock,
  BadgeCheck,
} from "lucide-react";
import Container from "@/components/ui/container";
import Logo from "@/components/logo";
import { footerLinks, siteConfig, contactAddresses } from "@/lib/site-config";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  LinkedInIcon,
} from "@/components/icons/social-icons";

const socials = [
  { name: "Facebook", href: "https://facebook.com", icon: FacebookIcon },
  { name: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { name: "YouTube", href: "https://youtube.com", icon: YoutubeIcon },
  { name: "LinkedIn", href: "https://linkedin.com", icon: LinkedInIcon },
];

const paymentMethods = ["Easypaisa", "COD"];

const trustBadges = [
  { name: "SSL Secured", icon: Lock },
  { name: "PCI DSS Compliant", icon: ShieldCheck },
  { name: "Verified Store", icon: BadgeCheck },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="text-sm text-white/65 transition-colors hover:text-sky"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <Container className="grid grid-cols-2 gap-x-8 gap-y-12 py-16 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Logo variant="light" />
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Pakistan&apos;s trusted technology retailer for genuine computers, networking
            equipment and enterprise IT solutions since day one.
          </p>
          <ul className="mt-5 space-y-3">
            {contactAddresses.map((address) => (
              <li key={address.label} className="flex items-start gap-2.5 text-sm text-white/65">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden="true" />
                <a
                  href={
                    address.mapsUrl ??
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.full)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${address.label} in Google Maps`}
                  aria-label={`Open ${address.label} in Google Maps: ${address.full}`}
                  className="transition-colors hover:text-sky hover:underline"
                >
                  <span className="font-semibold text-white">{address.label}</span>
                  <br />
                  {address.lines[0]}
                  <br />
                  {address.lines[1]}
                </a>
              </li>
            ))}
            <li>
              <a
                href={siteConfig.phoneHref}
                className="flex items-center gap-2.5 text-sm text-white/65 hover:text-sky"
              >
                <Phone className="h-4 w-4 shrink-0 text-sky" aria-hidden="true" />
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-2.5 text-sm text-white/65 hover:text-sky"
              >
                <Mail className="h-4 w-4 shrink-0 text-sky" aria-hidden="true" />
                {siteConfig.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-white/65">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden="true" />
              {siteConfig.hours}
            </li>
          </ul>
        </div>

        <FooterColumn title="Products" links={footerLinks.products} />
        <FooterColumn title="Support" links={footerLinks.support} />
        <FooterColumn title="Business" links={footerLinks.business} />
        <FooterColumn title="Company" links={footerLinks.company} />
        <FooterColumn title="Policies" links={footerLinks.policies} />
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            {trustBadges.map((badge) => (
              <div key={badge.name} className="flex items-center gap-2 text-xs font-medium text-white/60">
                <badge.icon className="h-4 w-4 text-sky" aria-hidden="true" />
                {badge.name}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70"
              >
                {method}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                aria-label={social.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-sky hover:text-sky"
              >
                <social.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </Container>
      </div>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} i.Link Systems &amp; Solutions. All rights
            reserved.
          </p>
          <p>Designed &amp; engineered for enterprise-grade IT retail.</p>
        </Container>
      </div>
    </footer>
  );
}
