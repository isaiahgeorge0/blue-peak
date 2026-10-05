"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

const MotionLink = motion.create(Link);

type WorkCardProps = {
  href: string;
  title: string;
  description: string;
  /** Comment-only marker for where real photography should go. */
  photoNote: string;
  /** Stock or project photo path under /public. */
  imageSrc: string;
};

export function WorkCard({
  href,
  title,
  description,
  photoNote,
  imageSrc,
}: WorkCardProps) {
  return (
    <MotionLink
      href={href}
      className="group block"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink/10">
        <Image
          src={imageSrc}
          alt={photoNote}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1152px) 33vw, 370px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-5 font-serif text-xl text-ink transition-colors duration-200 group-hover:text-accent">
        {title}
      </p>
      <p className="mt-1.5 text-sm text-ink/70">{description}</p>
    </MotionLink>
  );
}
