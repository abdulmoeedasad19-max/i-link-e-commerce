import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonBaseProps = {
  variant?: "primary" | "secondary" | "ghost" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

const variantStyles: Record<NonNullable<ButtonBaseProps["variant"]>, string> = {
  primary:
    "bg-royal text-white hover:bg-royal-600 shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-6px_rgba(29,78,216,0.45)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.1),0_14px_28px_-8px_rgba(29,78,216,0.55)] hover:-translate-y-0.5",
  secondary:
    "bg-white text-navy border border-navy/80 hover:bg-navy hover:text-white hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-navy hover:bg-navy/5",
  light:
    "bg-white text-navy hover:bg-soft-gray shadow-[0_8px_20px_-6px_rgba(15,23,42,0.35)] hover:-translate-y-0.5",
};

const sizeStyles: Record<NonNullable<ButtonBaseProps["size"]>, string> = {
  sm: "text-sm px-4 py-2 rounded-[10px]",
  md: "text-[15px] px-5 py-3 rounded-[10px]",
  lg: "text-base px-7 py-3.5 rounded-xl",
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out cursor-pointer disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

type ButtonAsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(base, variantStyles[variant], sizeStyles[size], className);

  if ("href" in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
