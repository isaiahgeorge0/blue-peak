import type { EmailImageSources } from "./email-frame.ts";
import { HOUSE_IMAGE_DIR } from "./email-house-image.ts";

/*
  Which images an email layout attaches. The navy tile is not one of them:
  Gmail does not show a cid: image used as a CSS background, so the branded
  header and footer point at ${siteUrl}/email/navy.png instead.
*/

export type EmailLayout = "branded" | "personal";

export const FALLBACK_SITE_URL = "https://cortexbuilding.co.uk";

/** NEXT_PUBLIC_SITE_URL, without a trailing slash, or the public site. */
export function siteUrlFrom(value: string | undefined) {
  const trimmed = value?.trim();
  if (trimmed) return trimmed.replace(/\/$/, "");
  return FALLBACK_SITE_URL;
}

export type EmailImageFile = {
  key: "logo" | "gable" | "house" | "logoLight" | "logoDark";
  relativePath: string;
  contentId: string;
  contentType: string;
};

/** The cid: sources and the files behind them. Navy, when the layout uses it, is a URL. */
export function emailImageSources(layout: EmailLayout, houseFile: string | null, siteUrl?: string) {
  const sources: EmailImageSources = { logo: "", gable: "", house: null, logoLight: "", logoDark: "" };
  const files: EmailImageFile[] =
    layout === "personal"
      ? [
          { key: "logoLight", relativePath: "email/logo-light.png", contentId: "bp-logo-light", contentType: "image/png" },
          { key: "logoDark", relativePath: "email/logo-dark.png", contentId: "bp-logo-dark", contentType: "image/png" },
        ]
      : [
          { key: "logo", relativePath: "email/logo.png", contentId: "bp-logo", contentType: "image/png" },
          { key: "gable", relativePath: "email/gable.png", contentId: "bp-gable", contentType: "image/png" },
          ...(houseFile
            ? [{ key: "house" as const, relativePath: `${HOUSE_IMAGE_DIR}/${houseFile}`, contentId: "bp-house", contentType: "image/jpeg" }]
            : []),
        ];
  if (layout === "branded") sources.navy = `${siteUrlFrom(siteUrl)}/email/navy.png`;
  for (const file of files) {
    const cid = `cid:${file.contentId}`;
    if (file.key === "house") sources.house = cid;
    else sources[file.key] = cid;
  }
  return { sources, files };
}
