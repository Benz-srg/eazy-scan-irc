"use client";

import { useSyncExternalStore } from "react";
import type { Analysis, HistoryItem } from "./types";
import { HISTORY_SEED, SAMPLE_ANALYSIS } from "./sample-data";

export type Provider = "local" | "openai";

type SessionState = {
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioName: string;
  durationSec: number;
  provider: Provider;
  apiKey: string;
  depth: "fast" | "deep";
  analysis: Analysis | null;
};

type StoreState = {
  session: SessionState;
  history: HistoryItem[];
};

const emptySession: SessionState = {
  audioBlob: null,
  audioUrl: null,
  audioName: "",
  durationSec: 0,
  provider: "local",
  apiKey: "",
  depth: "fast",
  analysis: null,
};

const HISTORY_KEY = "eazy_history";

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return HISTORY_SEED;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as HistoryItem[];
  } catch {}
  return HISTORY_SEED;
}

let state: StoreState = {
  session: { ...emptySession },
  history: HISTORY_SEED,
};

let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function persistHistory() {
  if (typeof window === "undefined") return;
  try {
    // blob: URLs are invalid after reload — don't persist them (keep served
    // /api/audio/... URLs which survive). Live blob URL stays in memory state.
    const serializable = state.history.map((h) =>
      h.audioUrl?.startsWith("blob:") ? { ...h, audioUrl: undefined } : h,
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(serializable));
  } catch {}
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  state.history = loadHistory();
}

export const store = {
  getState: () => state,
  subscribe(cb: () => void) {
    ensureInit();
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  setSession(patch: Partial<SessionState>) {
    state.session = { ...state.session, ...patch };
    emit();
  },
  resetSession() {
    if (state.session.audioUrl) URL.revokeObjectURL(state.session.audioUrl);
    state.session = { ...emptySession };
    emit();
  },
  setAnalysis(a: Analysis | null) {
    state.session = { ...state.session, analysis: a };
    emit();
  },
  addHistory(item: HistoryItem) {
    state.history = [item, ...state.history.filter((h) => h.id !== item.id)];
    persistHistory();
    emit();
  },
  setHistory(items: HistoryItem[]) {
    state.history = items;
    persistHistory();
    emit();
  },
  renameHistory(id: string, title: string) {
    state.history = state.history.map((h) =>
      h.id === id ? { ...h, title } : h,
    );
    persistHistory();
    emit();
  },
  removeHistory(id: string) {
    state.history = state.history.filter((h) => h.id !== id);
    persistHistory();
    emit();
  },
};

const serverSnapshot: StoreState = {
  session: emptySession,
  history: HISTORY_SEED,
};

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(serverSnapshot),
  );
}

export { SAMPLE_ANALYSIS };
