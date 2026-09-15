"use client";

import Link from "next/link";
import { motion } from "motion/react";

const MotionLink = motion.create(Link);

type WorkCardProps = {
  href: string;
  title: string;
  description: string;
  /** Comment-only marker for where real photography should go. */
  photoNote: string;
};

export function WorkCard({ href, title, description, photoNote }: WorkCardProps) {
  return (
    <MotionLink
      href={href}
      className="group block"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Project photo placeholder: {photoNote} */}
      <div className="aspect-video bg-gray-800 transition-colors duration-200 group-hover:bg-gray-700" />
      <p className="mt-4 font-serif text-lg text-off-white transition-colors duration-200 group-hover:text-baby-blue">
        {title}
      </p>
      <p className="mt-1 text-sm text-off-white/65">{description}</p>
      <span className="sr-only">{photoNote}</span>
    </MotionLink>
  );
}
