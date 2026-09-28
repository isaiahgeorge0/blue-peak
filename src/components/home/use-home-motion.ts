"use client";

import { useReducedMotion } from "motion/react";

/** Shared reduced-motion flag for homepage interaction components. */
export function useHomeMotionPreference() {
  return useReducedMotion() === true;
}
