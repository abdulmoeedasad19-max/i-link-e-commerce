import type { ReactNode } from "react";
import Link from "next/link";
import type { ContentBlock } from "@/lib/blog";

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Parses the article content's lightweight `[label](/href)` syntax into real internal links. */
function renderInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, label, href] = match;
    parts.push(
      <Link
        key={key++}
        href={href}
        className="font-semibold text-royal underline underline-offset-2 hover:text-royal-600"
      >
        {label}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function RichText({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={i} className="mt-4 leading-relaxed text-dark-slate first:mt-0">
                {renderInlineText(block.text)}
              </p>
            );
          case "heading2":
            return (
              <h2 key={i} className="mt-10 text-xl font-bold text-navy sm:text-2xl">
                {block.text}
              </h2>
            );
          case "heading3":
            return (
              <h3 key={i} className="mt-6 text-lg font-bold text-navy">
                {block.text}
              </h3>
            );
          case "list":
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-dark-slate">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInlineText(item)}</li>
                ))}
              </ul>
            );
          case "faq":
            return (
              <div key={i} className="mt-6 space-y-4">
                {block.items.map((qa, j) => (
                  <div key={j} className="rounded-xl border border-light-gray bg-soft-gray p-4">
                    <p className="font-semibold text-navy">{qa.question}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate">{qa.answer}</p>
                  </div>
                ))}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
