"use client";

export type CurrentUser = {
  name: string;
  role?: string;
  avatarUrl?: string;
};

/**
 * Source of the signed-in user. No auth wired yet, so this returns null and
 * the UI falls back to a guest placeholder. When auth lands, return the real
 * user here (from session/cookie/provider) — the UI updates automatically.
 */
export function useCurrentUser(): CurrentUser | null {
  return null;
}
