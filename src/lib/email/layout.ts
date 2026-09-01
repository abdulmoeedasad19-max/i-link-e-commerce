// Phase 4.4.22 — shared HTML/plain-text chrome for every transactional
// email, so no individual template hand-rolls its own header/footer/button
// markup. Deliberately table-based with fully inline styles (no <style>
// block, no external fonts, no JS) for compatibility with common email
// clients, matching the phase's explicit template requirements. Content
// here is limited to real, existing site information (siteConfig) — no
// invented phone numbers, addresses, or claims.
import "server-only";
import { siteConfig } from "@/lib/site-config";

export type EmailButton = { label: string; url: string };

const NAVY = "#0f172a";
const ROYAL = "#1d4ed8";
const SLATE = "#475569";
const LIGHT_GRAY = "#e2e8f0";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Wraps a block of already-safe HTML body content (paragraphs, a details
 * table, etc. — callers are responsible for escaping any dynamic text they
 * interpolate) in the shared header/footer chrome, plus one optional CTA
 * button. Returns a complete HTML document.
 */
export function renderEmailHtml(options: { preheader: string; bodyHtml: string; button?: EmailButton }): string {
  const { preheader, bodyHtml, button } = options;

  const buttonHtml = button
    ? `
      <tr>
        <td style="padding: 8px 0 4px;">
          <a href="${escapeHtml(button.url)}"
             style="display:inline-block;background-color:${ROYAL};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;">
            ${escapeHtml(button.label)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(preheader)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${LIGHT_GRAY};font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none;font-size:1px;color:${LIGHT_GRAY};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${LIGHT_GRAY};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${NAVY};padding:20px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#ffffff;border-radius:8px;padding:6px 10px;">
                      <img src="${escapeHtml(absoluteUrl("/brand/ilink-logo.jpeg"))}" alt="${escapeHtml(siteConfig.name)}" height="28" style="display:block;height:28px;width:auto;border:0;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${bodyHtml}
                  ${buttonHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid ${LIGHT_GRAY};">
                <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${SLATE};line-height:1.6;">
                  ${escapeHtml(siteConfig.name)} &middot; ${escapeHtml(siteConfig.phone)} &middot;
                  <a href="mailto:${escapeHtml(siteConfig.email)}" style="color:${SLATE};">${escapeHtml(siteConfig.email)}</a>
                </p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${SLATE};">
                  This is a transactional email about your account or order at ${escapeHtml(siteConfig.url.replace(/^https?:\/\//, ""))}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** A single paragraph row for the body table. Escapes its own text. */
export function emailParagraph(text: string): string {
  return `<tr><td style="padding:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${NAVY};">${escapeHtml(text)}</td></tr>`;
}

/**
 * A paragraph row containing an inline text link (as opposed to the button
 * in renderEmailHtml) — for secondary references like "see our Returns
 * page" that don't warrant their own full-width button. Every part is
 * escaped independently.
 */
export function emailLinkParagraph(before: string, url: string, linkLabel: string, after = ""): string {
  return `<tr><td style="padding:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${NAVY};">${escapeHtml(before)}<a href="${escapeHtml(url)}" style="color:${ROYAL};font-weight:bold;text-decoration:underline;">${escapeHtml(linkLabel)}</a>${escapeHtml(after)}</td></tr>`;
}

/** A heading row for the body table. Escapes its own text. */
export function emailHeading(text: string): string {
  return `<tr><td style="padding:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:${NAVY};">${escapeHtml(text)}</td></tr>`;
}

/**
 * A simple label/value details block (order number, total, status, etc.)
 * rendered as a bordered table row per field. Every value is escaped.
 */
export function emailDetailsTable(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LIGHT_GRAY};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${SLATE};">${escapeHtml(r.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${LIGHT_GRAY};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${NAVY};text-align:right;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");

  return `<tr><td style="padding:8px 0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table></td></tr>`;
}

/** Builds the plain-text fallback from the same paragraph/detail data. */
export function renderEmailText(options: {
  heading: string;
  paragraphs: string[];
  details?: { label: string; value: string }[];
  button?: EmailButton;
}): string {
  const lines: string[] = [siteConfig.name, "", options.heading, ""];
  for (const p of options.paragraphs) {
    lines.push(p, "");
  }
  if (options.details && options.details.length > 0) {
    for (const d of options.details) {
      lines.push(`${d.label}: ${d.value}`);
    }
    lines.push("");
  }
  if (options.button) {
    lines.push(`${options.button.label}: ${options.button.url}`, "");
  }
  lines.push(`${siteConfig.name} · ${siteConfig.phone} · ${siteConfig.email}`);
  return lines.join("\n");
}

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path}`;
}
