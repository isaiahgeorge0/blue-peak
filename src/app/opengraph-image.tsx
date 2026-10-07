import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_IMAGE_ALT } from "@/lib/page-metadata";

export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const [tinos, nunitoSans, hero, wordmark] = await Promise.all([
  readFile(join(process.cwd(), "assets/og/tinos-latin-400-normal.woff")),
  readFile(join(process.cwd(), "assets/og/nunito-sans-latin-600-normal.woff")),
  readFile(join(process.cwd(), "public/home/hero.jpg"), "base64"),
  readFile(join(process.cwd(), "public/brand/wordmark-white.svg"), "base64"),
]);

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#1800ad",
        }}
      >
        <img
          src={`data:image/jpeg;base64,${hero}`}
          alt=""
          width={1200}
          height={675}
          style={{ position: "absolute", top: -22, left: 0, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage:
              "linear-gradient(90deg, rgba(24,0,173,0.97) 0%, rgba(24,0,173,0.92) 52%, rgba(24,0,173,0.35) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
            width: 760,
          }}
        >
          <img
            src={`data:image/svg+xml;base64,${wordmark}`}
            alt=""
            width={300}
            height={46}
          />
          <div
            style={{
              marginTop: 36,
              fontFamily: "Tinos",
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Building and renovation across Ipswich and Suffolk
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: "Nunito Sans",
              fontSize: 28,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Written quotes before we start. Free site visits.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Tinos", data: tinos, style: "normal", weight: 400 },
        { name: "Nunito Sans", data: nunitoSans, style: "normal", weight: 600 },
      ],
    },
  );
}
