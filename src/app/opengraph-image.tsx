import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_IMAGE_ALT } from "@/lib/page-metadata";

export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const [fraunces, inter, hero] = await Promise.all([
  readFile(join(process.cwd(), "assets/og/fraunces-latin-400-normal.woff")),
  readFile(join(process.cwd(), "assets/og/inter-latin-500-normal.woff")),
  readFile(join(process.cwd(), "public/home/hero.jpg"), "base64"),
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
          backgroundColor: "#0a0a0a",
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
              "linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.88) 50%, rgba(10,10,10,0.4) 100%)",
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
          <div
            style={{
              fontFamily: "Inter",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#89cff0",
            }}
          >
            Blue Peak Solutions
          </div>
          <div
            style={{
              marginTop: 24,
              fontFamily: "Fraunces",
              fontSize: 64,
              lineHeight: 1.1,
              color: "#f4f1ea",
            }}
          >
            Building and renovation across Ipswich and Suffolk
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: "Inter",
              fontSize: 26,
              color: "rgba(244,241,234,0.78)",
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
        { name: "Fraunces", data: fraunces, style: "normal", weight: 400 },
        { name: "Inter", data: inter, style: "normal", weight: 500 },
      ],
    },
  );
}
