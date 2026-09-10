import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About",
    description:
      "Blue Peak Solutions is a two-person building and renovation team based in Ipswich, Suffolk.",
  };
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl tracking-tight text-off-white sm:text-5xl">
        About
      </h1>
    </div>
  );
}
