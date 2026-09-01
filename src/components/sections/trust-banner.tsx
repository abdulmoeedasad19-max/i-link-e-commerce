import { BadgeCheck, Lock, Truck, ShieldCheck, Headset } from "lucide-react";
import Container from "@/components/ui/container";

const items = [
  { icon: BadgeCheck, label: "Genuine Products" },
  { icon: Lock, label: "Secure Checkout" },
  { icon: Truck, label: "Nationwide Delivery" },
  { icon: ShieldCheck, label: "Official Warranty" },
  { icon: Headset, label: "Expert Support" },
];

export default function TrustBanner() {
  return (
    <section aria-label="Trust indicators" className="border-y border-light-gray bg-white py-8">
      <Container>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-between">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5">
              <item.icon className="h-5 w-5 text-royal" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-sm font-semibold text-navy">{item.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
