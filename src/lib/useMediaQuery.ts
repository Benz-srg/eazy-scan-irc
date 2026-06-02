"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media-query hook. Renders desktop-first on the server, then
 * corrects on mount (these are client-only app screens, so the brief
 * first-paint is acceptable and avoids hydration mismatches).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** Phones + small tablets (≤ 768px). */
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");

/** Very narrow (iPhone SE ~ 320–375px). */
export const useIsNarrow = () => useMediaQuery("(max-width: 400px)");
