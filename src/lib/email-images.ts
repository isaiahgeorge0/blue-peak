import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EmailImageSources } from "@/lib/email-frame";
import { HOUSE_IMAGE_DIR } from "@/lib/email-house-image";

/*
  Email images travel inside the email as inline attachments (cid:), so they
  show without depending on any website being reachable, and Outlook shows
  them without "download pictures". The files live in public/email and are
  bundled with the sending routes (outputFileTracingIncludes in next.config).
*/

export type EmailAttachment = { filename: string; content: Buffer; contentType: string; contentId: string };

const PUBLIC_DIR = path.join(process.cwd(), "public");

async function attachment(relativePath: string, contentId: string, contentType: string): Promise<EmailAttachment | null> {
  try {
    const content = await readFile(path.join(PUBLIC_DIR, relativePath));
    return { filename: path.basename(relativePath), content, contentType, contentId };
  } catch (error) {
    console.error("email images: missing", relativePath, error instanceof Error ? error.message : error);
    return null;
  }
}

/** The frame's images, plus the house picture when one is given, as attachments and the cid: sources that point at them. */
export async function emailImages(houseFile: string | null): Promise<{ sources: EmailImageSources; attachments: EmailAttachment[] }> {
  const [logo, gable, house] = await Promise.all([
    attachment("email/logo.png", "bp-logo", "image/png"),
    attachment("email/gable.png", "bp-gable", "image/png"),
    houseFile ? attachment(`${HOUSE_IMAGE_DIR}/${houseFile}`, "bp-house", "image/jpeg") : Promise.resolve(null),
  ]);
  const attachments = [logo, gable, house].filter((item): item is EmailAttachment => Boolean(item));
  return {
    sources: {
      logo: logo ? `cid:${logo.contentId}` : "",
      gable: gable ? `cid:${gable.contentId}` : "",
      house: house ? `cid:${house.contentId}` : null,
    },
    attachments,
  };
}