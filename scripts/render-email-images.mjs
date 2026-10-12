// Renders the images the emails use into public/email/. Re-run whenever the brand marks or the estimator's model change.
//
//   npm run email:images -- brand                 header lockup and gable strip (no server needed)
//   npm run email:images -- houses [base-url]     the 64 add-on combinations from the live estimator scene
//   npm run email:images -- sheet <out.png>       a contact sheet of the house images, for review
//
// "houses" needs the site running (npm run build && npx next start), default http://localhost:3000. It frames the
// house exactly like the closing band picture (1440 wide, reduced motion, 4:3 crop of the stage) at Standard size
// and Quality finish, on the stage's Frost White, saved as 1200x900 JPEGs under 80KB.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ESTIMATOR_ADDONS } from "../src/lib/isometric-estimator-config.ts";
import { houseImageName } from "../src/lib/email-house-image.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/email");
const HOUSES = path.join(OUT, "houses");
const NAVY = "#0e2240";
const FROST = "#e9f7f7";
const PITCH_DEGREES = 31;
const MAX_HOUSE_BYTES = 80 * 1024;

const [part, arg] = process.argv.slice(2);

async function withBrowser(run) {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    return await run(browser);
  } finally {
    await browser.close();
  }
}

function dataUrlToBuffer(url) {
  return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
}

/** White mark and wordmark side by side on navy, 2x. Navy is baked in so a client's colour inversion can't wash it out. */
async function renderLockup(browser) {
  const mark = fs.readFileSync(path.join(ROOT, "public/brand/mark-white.svg"), "utf8");
  const wordmark = fs.readFileSync(path.join(ROOT, "public/brand/wordmark-white.svg"), "utf8");
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 400, height: 200 } });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:${NAVY}">
    <div id="lockup" style="display:inline-flex;align-items:center;gap:12px;padding:0;background:${NAVY}">
      <div style="height:40px;width:${(40 * 131) / 135}px">${mark.replace("<svg ", '<svg width="100%" height="100%" ')}</div>
      <div style="height:19px;width:${(19 * 218.65) / 32}px">${wordmark.replace("<svg ", '<svg width="100%" height="100%" ')}</div>
    </div></body></html>`);
  const box = await page.locator("#lockup").boundingBox();
  await page.locator("#lockup").screenshot({ path: path.join(OUT, "logo.png") });
  await page.close();
  return { width: Math.round(box.width), height: Math.round(box.height) };
}

/** A navy strip with a small centred gable cut out of its bottom edge at the brand's 31° pitch; transparent inside the gable. */
async function renderGable(browser) {
  const page = await browser.newPage();
  const url = await page.evaluate(
    ({ navy, pitch }) => {
      const scale = 2;
      const width = 600 * scale;
      const height = 24 * scale;
      const rise = 22 * scale;
      const half = rise / Math.tan((pitch * Math.PI) / 180);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = navy;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(width / 2 - half, height);
      ctx.lineTo(width / 2, height - rise);
      ctx.lineTo(width / 2 + half, height);
      ctx.closePath();
      ctx.fill();
      return canvas.toDataURL("image/png");
    },
    { navy: NAVY, pitch: PITCH_DEGREES },
  );
  fs.writeFileSync(path.join(OUT, "gable.png"), dataUrlToBuffer(url));
  await page.close();
}

/** Every combination of the six add-ons (including none), as the closing band frames the scene. */
async function renderHouses(browser, base) {
  fs.mkdirSync(HOUSES, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await ctx.addInitScript(() => sessionStorage.setItem("bp-intro-seen", "1"));
  const page = await ctx.newPage();
  // Email pictures show only what was chosen: no dashed outlines for the other add-ons.
  await page.goto(`${base}/quote?ghosts=off`, { waitUntil: "load" });
  await page.waitForSelector(".ie-stage-loading", { state: "detached", timeout: 30000 });
  await page.addStyleTag({ content: ".ie-stage-hint{display:none!important}" });
  await page.waitForTimeout(800);

  const encoder = await ctx.newPage();
  const results = [];
  for (let mask = 0; mask < 1 << ESTIMATOR_ADDONS.length; mask++) {
    const keys = ESTIMATOR_ADDONS.filter((_, index) => mask & (1 << index)).map((addon) => addon.key);
    for (const addon of ESTIMATOR_ADDONS) {
      const box = page.getByRole("checkbox", { name: new RegExp(`^${addon.label}`) });
      if ((await box.isChecked()) !== keys.includes(addon.key)) await box.click({ force: true });
    }
    await page.waitForTimeout(400);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const inset = 12;
    const r = await page.locator(".ie-stage-canvas").boundingBox();
    const b = { x: r.x + inset, y: r.y + inset, width: r.width - 2 * inset, height: r.height - 2 * inset };
    const h = (b.width * 3) / 4;
    const clip = h <= b.height
      ? { x: b.x, y: b.y + (b.height - h) / 2, width: b.width, height: h }
      : { x: b.x + (b.width - (b.height * 4) / 3) / 2, y: b.y, width: (b.height * 4) / 3, height: b.height };
    const png = await page.screenshot({ clip });

    const jpeg = await encoder.evaluate(
      async ({ src, maxBytes, background }) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 900;
        const c = canvas.getContext("2d");
        c.fillStyle = background;
        c.fillRect(0, 0, 1200, 900);
        c.imageSmoothingQuality = "high";
        c.drawImage(image, 0, 0, 1200, 900);
        for (let quality = 0.86; quality >= 0.5; quality -= 0.04) {
          const url = canvas.toDataURL("image/jpeg", quality);
          if ((url.length - url.indexOf(",") - 1) * 0.75 <= maxBytes) return { url, quality };
        }
        throw new Error("could not get under the size limit");
      },
      { src: `data:image/png;base64,${png.toString("base64")}`, maxBytes: MAX_HOUSE_BYTES - 2048, background: FROST },
    );
    const file = path.join(HOUSES, houseImageName(keys));
    const bytes = dataUrlToBuffer(jpeg.url);
    fs.writeFileSync(file, bytes);
    results.push({ name: houseImageName(keys), bytes: bytes.length, quality: Number(jpeg.quality.toFixed(2)) });
  }
  await ctx.close();
  return results;
}

async function renderSheet(browser, out) {
  const names = fs.readdirSync(HOUSES).filter((name) => name.endsWith(".jpg")).sort((a, b) => a.split("-").length - b.split("-").length || a.localeCompare(b));
  const cells = names
    .map((name) => {
      const src = `data:image/jpeg;base64,${fs.readFileSync(path.join(HOUSES, name)).toString("base64")}`;
      const kb = (fs.statSync(path.join(HOUSES, name)).size / 1024).toFixed(0);
      return `<figure><img src="${src}"><figcaption>${name.replace(".jpg", "")} <b>${kb} KB</b></figcaption></figure>`;
    })
    .join("");
  const page = await browser.newPage({ viewport: { width: 2000, height: 800 } });
  await page.setContent(`<!doctype html><html><body style="margin:0;padding:24px;background:#fff;font:13px Helvetica,Arial,sans-serif;color:${NAVY}">
    <h1 style="font:26px 'Times New Roman',serif;margin:0 0 16px">Blue Peak email house images: ${names.length} combinations</h1>
    <style>main{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}figure{margin:0}img{width:100%;display:block;border:1px solid #cfe3e6}figcaption{padding:4px 0;word-break:break-all}</style>
    <main>${cells}</main></body></html>`);
  await page.waitForLoadState("load");
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
}

fs.mkdirSync(OUT, { recursive: true });
if (part === "brand") {
  await withBrowser(async (browser) => {
    const lockup = await renderLockup(browser);
    await renderGable(browser);
    console.log(`logo.png ${lockup.width}x${lockup.height} (display size), gable.png 600x24 (display size)`);
  });
} else if (part === "houses") {
  const base = (arg || "http://localhost:3000").replace(/\/$/, "");
  const reachable = await fetch(`${base}/quote`).then((response) => response.ok).catch(() => false);
  if (!reachable) {
    console.error(`Can't reach ${base}/quote. Start the site first (npm run build && npx next start) or pass its URL.`);
    process.exit(1);
  }
  const results = await withBrowser((browser) => renderHouses(browser, base));
  const largest = results.reduce((max, item) => (item.bytes > max.bytes ? item : max));
  console.log(`${results.length} images in public/email/houses; largest ${largest.name} ${(largest.bytes / 1024).toFixed(1)} KB`);
} else if (part === "sheet" && arg) {
  await withBrowser((browser) => renderSheet(browser, path.resolve(arg)));
  console.log(`contact sheet: ${arg}`);
} else {
  console.error("usage: npm run email:images -- brand | houses [base-url] | sheet <out.png>");
  process.exit(1);
}
