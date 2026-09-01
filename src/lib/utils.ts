import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return `Rs. ${price.toLocaleString("en-US")}`;
}

/**
 * Guards against open-redirect vulnerabilities in post-login callback URLs.
 * Only a same-app relative path is considered safe — anything that could be
 * interpreted as pointing off-site (an absolute URL, a protocol-relative
 * "//host" URL, or a backslash-based bypass some parsers treat as "/") is
 * rejected in favor of the caller's own fallback.
 */
export function isSafeCallbackUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length === 0) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("://")) return false;
  if (url.includes("\\")) return false;
  return true;
}

/**
 * Master Phase — Production Security Hardening. Serializes a JSON-LD
 * object for a `<script type="application/ld+json">` tag, escaping `<`
 * so a literal `</script>` sequence inside any interpolated value (e.g.
 * a blog title or FAQ answer) can never close the script tag early and
 * inject HTML into the page. `application/ld+json` isn't governed by
 * CSP's script-src (it's a data block, not executable script), so this
 * escape — not CSP — is what actually protects this surface. The single
 * shared helper for every JSON-LD script tag in the app, replacing what
 * was previously one-off, inconsistently-applied inline `.replace()`
 * calls.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
