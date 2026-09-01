import { Phone, Mail, Truck } from "lucide-react";
import Container from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";

export default function TopBar() {
  return (
    <div className="hidden bg-navy text-white lg:block">
      <Container className="flex h-9 items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <a
            href={siteConfig.phoneHref}
            className="flex items-center gap-1.5 text-white/80 transition-colors hover:text-white"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {siteConfig.phone}
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="flex items-center gap-1.5 text-white/80 transition-colors hover:text-white"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {siteConfig.email}
          </a>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-white/80">
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            Free nationwide delivery on orders over Rs. 100,000
          </span>
          <a href="/track-order" className="text-white/80 transition-colors hover:text-white">
            Track Order
          </a>
          <a href="/business" className="font-semibold text-sky transition-colors hover:text-white">
            Business Solutions
          </a>
        </div>
      </Container>
    </div>
  );
}
