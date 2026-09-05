/**
 * Core types for the Blog CMS.
 * Static data has been migrated to the PostgreSQL database.
 */

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading2"; text: string }
  | { type: "heading3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "faq"; items: { question: string; answer: string }[] };
