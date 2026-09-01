import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 8.4a4 4 0 0 0-2.8-2.83C17.2 5 12 5 12 5s-5.2 0-7.2.57A4 4 0 0 0 2 8.4 41.6 41.6 0 0 0 1.5 12a41.6 41.6 0 0 0 .5 3.6 4 4 0 0 0 2.8 2.83C6.8 19 12 19 12 19s5.2 0 7.2-.57A4 4 0 0 0 22 15.6a41.6 41.6 0 0 0 .5-3.6 41.6 41.6 0 0 0-.5-3.6ZM10 15V9l5.2 3-5.2 3Z" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.5 20h-3.37v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.15 1.46-2.15 2.96V20H9.74V8.5h3.24v1.57h.05c.45-.85 1.56-1.75 3.2-1.75 3.43 0 4.27 2.25 4.27 5.18V20Z" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.5 2h-3v13.6a2.6 2.6 0 1 1-2-2.53v-3.05a5.6 5.6 0 1 0 5 5.57V8.9a7.6 7.6 0 0 0 4.5 1.47V7.4a4.6 4.6 0 0 1-4.5-4.5Z" />
    </svg>
  );
}
