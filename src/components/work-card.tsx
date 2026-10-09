import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-logo";
import { SampleTag } from "@/components/sample-tag";
import { containerWide } from "@/lib/image-sizes";

type WorkCardProps = {
  href: string;
  title: string;
  /** Shown as a caption, so a trailing full stop is dropped. */
  description: string;
  /** Project photo path under /public. Without one the card shows the brand mark. */
  imageSrc?: string;
  imageAlt?: string;
  /** Shows the "Sample" tag on the photo. */
  sample?: boolean;
  /** Image sizes hint; override when the card is wider than a third of the page. */
  sizes?: string;
};

export function WorkCard({
  href,
  title,
  description,
  imageSrc,
  imageAlt = "",
  sample = false,
  sizes = `${containerWide(370)}, (max-width: 768px) 100vw, (max-width: 1152px) 33vw, 370px`,
}: WorkCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-xl transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/10">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-panel">
            <BrandMark title="" className="h-14 w-auto text-brand/15" />
          </div>
        )}
        {sample ? (
          <SampleTag overPhoto className="absolute top-2 left-2 lg:top-3 lg:left-3" />
        ) : null}
      </div>
      <p className="mt-5 text-xl font-semibold text-ink transition-colors duration-200 group-hover:text-accent">
        {title}
      </p>
      <p className="mt-1.5 text-sm text-ink/70">{description.replace(/\.$/, "")}</p>
    </Link>
  );
}
