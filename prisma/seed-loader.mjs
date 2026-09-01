// Minimal Node ESM resolve hook so the standalone seed script (run via plain
// `node`, not Next's bundler) can resolve two things Next's "bundler"
// moduleResolution normally handles for us:
//   1. This project's "@/*" -> "src/*" path alias (tsconfig.json `paths`).
//   2. Extensionless relative imports (e.g. Prisma's generated client.ts
//      importing "./enums" with no extension) — plain Node ESM requires an
//      explicit extension, so these fail to resolve without help.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC_ROOT = new URL("../src/", import.meta.url);
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function findCandidate(baseHref) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = baseHref + suffix;
    if (existsSync(fileURLToPath(candidate))) {
      return candidate;
    }
  }
  return null;
}

const SERVER_ONLY_STUB = new URL("./server-only-stub.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    // See server-only-stub.mjs — Next.js aliases this specifier internally;
    // plain Node has no equivalent, so redirect it to a no-op module.
    return nextResolve(SERVER_ONLY_STUB, context);
  }
  if (specifier.startsWith("@/")) {
    const candidate = findCandidate(new URL(specifier.slice(2), SRC_ROOT).href);
    if (candidate) return nextResolve(candidate, context);
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const candidate = findCandidate(new URL(specifier, context.parentURL).href);
    if (candidate) return nextResolve(candidate, context);
  }
  return nextResolve(specifier, context);
}
