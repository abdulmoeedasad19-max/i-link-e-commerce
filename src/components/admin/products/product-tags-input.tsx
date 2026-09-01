"use client";

// Admin Product Management upgrade. No tagging library — a hidden
// <input> per tag, all sharing the same `name`, is all FormData.getAll()
// needs server-side; see the createProduct/updateProduct Zod schemas in
// src/app/admin/products/actions.ts.
import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

const MAX_TAGS = 20;

export default function ProductTagsInput({
  name = "tags",
  defaultTags = [],
}: {
  name?: string;
  defaultTags?: string[];
}) {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    setInput("");
    if (!trimmed || tags.length >= MAX_TAGS) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    setTags((prev) => [...prev, trimmed]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-light-gray bg-white p-2.5 focus-within:border-royal focus-within:ring-2 focus-within:ring-royal/15">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full bg-royal/10 px-2.5 py-1 text-xs font-semibold text-royal"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full hover:text-error"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
            <input type="hidden" name={name} value={tag} />
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={addTag}
          disabled={tags.length >= MAX_TAGS}
          placeholder={tags.length === 0 ? "Type a tag and press Enter" : ""}
          aria-label="Add a product tag"
          className="min-w-[140px] flex-1 border-none bg-transparent py-1 text-sm text-dark-slate outline-none placeholder:text-slate disabled:cursor-not-allowed"
        />
      </div>
      <p className="mt-1.5 text-xs text-slate">
        Press Enter (or comma) to add a tag. {tags.length}/{MAX_TAGS} tags.
      </p>
    </div>
  );
}
