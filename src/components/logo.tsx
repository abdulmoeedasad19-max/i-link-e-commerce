import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ilinkLogo from "../../public/brand/ilink-logo.jpeg";

export default function Logo({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "light";
}) {
  const image = (
    <Image
      src={ilinkLogo}
      alt="i.Link Systems & Solutions"
      className="h-8 w-auto sm:h-9"
      priority
    />
  );

  return (
    <Link
      href="/"
      aria-label="i.Link Systems & Solutions — Home"
      className={cn("inline-flex items-center", className)}
    >
      {variant === "light" ? (
        // The logo's own background is white, so on a navy surface (footer,
        // admin sidebar/nav) it needs a light backing to stay legible —
        // the logo artwork itself is untouched, only its backing changes.
        <span className="inline-flex items-center rounded-lg bg-white p-1.5 sm:p-2">
          <Image src={ilinkLogo} alt="i.Link Systems & Solutions" className="h-7 w-auto sm:h-8" priority />
        </span>
      ) : (
        image
      )}
    </Link>
  );
}
