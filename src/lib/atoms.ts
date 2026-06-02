"use client";

import { atomWithStorage } from "jotai/utils";
import type { Provider } from "./store";

/**
 * OpenAI API key — persisted in this browser only (localStorage), never on our
 * server/DB. Shared across the app (Workspace + Settings) and reactive: change
 * it once, everything updates. Sent to our API route only per-request for STT.
 */
export const apiKeyAtom = atomWithStorage<string>("eazy_openai_key", "");

/** Preferred STT provider, remembered across sessions. */
export const providerAtom = atomWithStorage<Provider>("eazy_provider", "local");

/**
 * Analysis depth → which LLM tier runs.
 *   "fast" = Haiku (quick, default)   "deep" = Sonnet (more thorough)
 * Quality rules (rubric + anti-hallucination + Zod) are identical for both —
 * only model speed/depth differs.
 */
export type AnalysisDepth = "fast" | "deep";
export const depthAtom = atomWithStorage<AnalysisDepth>("eazy_depth", "fast");

/** sk-abcd…wxyz — masked display of a saved key. */
export function maskApiKey(value: string): string {
  const v = value.trim();
  if (v.length <= 10) return "••••";
  return `${v.slice(0, 5)}…${v.slice(-4)}`;
}
