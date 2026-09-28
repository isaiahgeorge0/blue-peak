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
      <div className="relative aspect-video overflow-hidden bg-gray-800">
        <Image
          src={imageSrc}
          alt={photoNote}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-4 font-serif text-lg text-off-white transition-colors duration-200 group-hover:text-baby-blue">
        {title}
      </p>
      <p className="mt-1 text-sm text-off-white/65">{description}</p>
    </MotionLink>
  );
}
