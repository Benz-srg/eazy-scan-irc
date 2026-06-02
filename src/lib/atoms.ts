"use client";

import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import type { Analysis, HistoryItem } from "./types";
import { HISTORY_SEED } from "./sample-data";

export type Provider = "local" | "openai";
export type AnalysisDepth = "fast" | "deep";

/* ---------------- persisted user preferences (localStorage) ---------------- */

/**
 * OpenAI API key — persisted in THIS browser only, never on our server/DB.
 * Shared across the app and reactive. Sent to the API per-request for STT.
 */
export const apiKeyAtom = atomWithStorage<string>("eazy_openai_key", "");

/** Preferred STT provider (Local Whisper vs OpenAI Whisper). */
export const providerAtom = atomWithStorage<Provider>("eazy_provider", "local");

/* ---------------- analysis history (localStorage, browser-only) ---------------- */

// blob: URLs are invalid after reload — strip them before persisting (DB-served
// /api/audio URLs survive). Live blob URL stays in the in-memory atom value.
const baseHistoryStorage = createJSONStorage<HistoryItem[]>(() => localStorage);
const historyStorage = {
  ...baseHistoryStorage,
  setItem(key: string, value: HistoryItem[]) {
    const safe = value.map((h) =>
      h.audioUrl?.startsWith("blob:") ? { ...h, audioUrl: undefined } : h,
    );
    baseHistoryStorage.setItem(key, safe);
  },
};
export const historyAtom = atomWithStorage<HistoryItem[]>(
  "eazy_history",
  HISTORY_SEED,
  historyStorage,
);

/* ---------------- current analysis session (in-memory only) ---------------- */

export type SessionState = {
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioName: string;
  durationSec: number;
  transcript: string;
  analysis: Analysis | null;
};

export const emptySession: SessionState = {
  audioBlob: null,
  audioUrl: null,
  audioName: "",
  durationSec: 0,
  transcript: "",
  analysis: null,
};

/** Ephemeral session for the in-flight / just-finished analysis (not persisted). */
export const sessionAtom = atom<SessionState>(emptySession);

/* ---------------- helpers ---------------- */

/** sk-abcd…wxyz — masked display of a saved key. */
export function maskApiKey(value: string): string {
  const v = value.trim();
  if (v.length <= 10) return "••••";
  return `${v.slice(0, 5)}…${v.slice(-4)}`;
}
