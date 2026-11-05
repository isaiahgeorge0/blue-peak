import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { emailImageSources, type EmailLayout } from "@/lib/email-image-plan";

/*
  Email images travel inside the email as inline attachments (cid:), so they
  show without depending on any website being reachable, and Outlook shows
  them without "download pictures". The navy tile is the exception: Gmail
  will not render a cid: image used as a background, so it is a URL on the
  site instead. The files live in public/email and are bundled with the
  sending routes (outputFileTracingIncludes in next.config).
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

/** The images this layout shows, as attachments and the sources that point at them. Navy is a URL, not an attachment. */
export async function emailImages(layout: EmailLayout, houseFile: string | null): Promise<{ sources: ReturnType<typeof emailImageSources>["sources"]; attachments: EmailAttachment[] }> {
  const plan = emailImageSources(layout, houseFile, process.env.NEXT_PUBLIC_SITE_URL);
  const loaded = await Promise.all(plan.files.map((file) => attachment(file.relativePath, file.contentId, file.contentType)));
  const sources = { ...plan.sources };
  const attachments: EmailAttachment[] = [];
  loaded.forEach((item, index) => {
    if (!item) {
      const key = plan.files[index].key;
      if (key === "house") sources.house = null;
      else sources[key] = "";
      return;
    }
    attachments.push(item);
  });
  return { sources, attachments };
}