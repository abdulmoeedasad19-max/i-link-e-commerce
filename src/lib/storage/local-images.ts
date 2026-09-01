// Local Server Storage upgrade — replaces the earlier Vercel Blob
// implementation (src/lib/storage/blob.ts, now removed) at the explicit
// request of the project owner: images are written to this application's
// own persistent filesystem instead of any third-party storage service.
//
// Files are written under public/<UPLOAD_DIR>/products/, not an
// arbitrary top-level directory — anything under public/ is what
// Next.js's own static file server already serves directly at the
// matching URL path with zero extra routing code, exactly producing the
// `/uploads/products/<file>` URL shape this feature asked for. UPLOAD_DIR
// defaults to "uploads" and is overridable via the environment so the
// location isn't hardcoded.
//
// IMPORTANT DEPLOYMENT LIMITATION (see the phase report for the full
// explanation): this works correctly for local development and for any
// traditional Node.js host with a persistent filesystem (a VPS, Docker
// with a mounted volume, etc.). It does NOT work as durable storage on
// Vercel, where serverless/edge functions run on an ephemeral,
// effectively read-only filesystem — a file written by one invocation is
// not guaranteed to exist for the next request, and is never shared
// across concurrent instances. This module still functions (writes
// succeed within a single invocation), it just does not persist the way
// a real upload feature needs to on that specific host.
import "server-only";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_SUBDIR = (process.env.UPLOAD_DIR || "uploads").replace(/^\/+|\/+$/g, "");
const PRODUCTS_DIR = path.join(process.cwd(), "public", UPLOAD_SUBDIR, "products");
const URL_PREFIX = `/${UPLOAD_SUBDIR}/products/`;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const EXTENSION_BY_DETECTED_TYPE = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
} as const;

/**
 * Real content inspection via magic bytes — never trusts the browser-
 * reported `File.type` alone, since that's just the client's own guess
 * (typically derived from the filename's extension), not a genuine
 * check of what the file actually contains. A renamed `.php` or `.svg`
 * with a spoofed `type="image/jpeg"` is caught here, not waved through.
 */
function detectImageType(buffer: Buffer): keyof typeof EXTENSION_BY_DETECTED_TYPE | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export type UploadImageResult = { url: string } | { error: string };

/**
 * Validates and saves a single admin-submitted product image to local
 * disk. The caller (an already-`requireAdmin()`-gated Server Action) is
 * the only authorization boundary — this function assumes it, matching
 * every other module under src/lib that's only ever reached from an
 * authorized action.
 */
export async function uploadProductImage(file: File): Promise<UploadImageResult> {
  if (file.size === 0) {
    return { error: "This file is empty." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Image must be smaller than 5MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageType(buffer);
  if (!detectedType) {
    return { error: "Only JPG, PNG, and WebP images are allowed." };
  }

  // The filename is entirely server-generated — the client's original
  // filename never reaches the filesystem beyond a short, sanitized,
  // human-readability label with every path-relevant character
  // stripped (no `.`, `/`, `\`), so path traversal via a crafted
  // filename is not possible even in principle. The extension is taken
  // from the detected type above, never from the client — a file can
  // never be written with an executable-sounding extension.
  const extension = EXTENSION_BY_DETECTED_TYPE[detectedType];
  const safeLabel = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const filename = `${safeLabel || "image"}-${randomUUID()}.${extension}`;

  try {
    await mkdir(PRODUCTS_DIR, { recursive: true });
    await writeFile(path.join(PRODUCTS_DIR, filename), buffer);
  } catch (err) {
    console.error("[storage/local-images] write failed:", err);
    return { error: "Unable to save this image. Please try again." };
  }

  // Host-relative, never an absolute http://localhost:... URL — works
  // unchanged after deployment to the real production domain.
  return { url: `${URL_PREFIX}${filename}` };
}

/**
 * Best-effort cleanup — mirrors this codebase's established tolerance
 * for non-critical failures in cleanup paths (e.g. notify.ts's email
 * sends): a failed delete here never blocks or fails the database
 * mutation that triggered it, it just leaves one orphaned file, logged
 * server-side. A missing file (already gone) is not an error worth
 * logging at all.
 */
export async function deleteProductImageLocal(url: string): Promise<void> {
  if (!url.startsWith(URL_PREFIX)) return;

  const filename = url.slice(URL_PREFIX.length);
  // Defense in depth even though the filename is always server-generated
  // (see uploadProductImage above) — a value containing a path separator
  // or a ".." segment can never be a legitimate filename this module
  // itself produced, so it's refused outright rather than resolved.
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return;
  }

  try {
    await unlink(path.join(PRODUCTS_DIR, filename));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[storage/local-images] delete failed:", err);
    }
  }
}
