"use client";

import { useEffect, useState } from "react";

/**
 * Tiny stale-while-revalidate cache (no dep). Speeds up the UI by serving the
 * last value instantly while refetching in the background.
 *
 * Anti-stale guarantees:
 *  - TTL only suppresses *redundant* refetches; a fresh value always arrives.
 *  - revalidate on window focus + tab visibility (returning users see fresh data).
 *  - `mutate(key)` / `invalidate(key)` force a refetch after any write.
 *  - never used for the analyze stream or one-shot actions — read models only.
 */

type Entry<T> = { data?: T; ts: number; promise?: Promise<T> };
const store = new Map<string, Entry<unknown>>();
const subs = new Map<string, Set<() => void>>();

const DEFAULT_TTL = 15_000;

function notify(key: string) {
  subs.get(key)?.forEach((fn) => fn());
}

async function revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const e = (store.get(key) as Entry<T>) ?? { ts: 0 };
  if (e.promise) return e.promise;
  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, ts: Date.now() });
      notify(key);
      return data;
    })
    .catch((err) => {
      // keep stale data on error; clear in-flight marker
      const cur = store.get(key) as Entry<T> | undefined;
      if (cur) store.set(key, { data: cur.data, ts: cur.ts });
      throw err;
    });
  store.set(key, { ...e, promise });
  return promise;
}

/** Force-refetch a key now (call after a mutation). */
export function mutate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  store.delete(key);
  return revalidate(key, fetcher);
}

/** Drop a cached key so the next read refetches. */
export function invalidate(key: string) {
  store.delete(key);
  notify(key);
}

export function useSWR<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  opts: { ttl?: number; revalidateOnFocus?: boolean } = {},
): { data: T | undefined; loading: boolean } {
  const ttl = opts.ttl ?? DEFAULT_TTL;
  const focus = opts.revalidateOnFocus ?? true;
  const [, force] = useState(0);

  useEffect(() => {
    if (!key) return;
    const rerender = () => force((n) => n + 1);
    let set = subs.get(key);
    if (!set) {
      set = new Set();
      subs.set(key, set);
    }
    set.add(rerender);

    const e = store.get(key) as Entry<T> | undefined;
    const fresh = e && Date.now() - e.ts < ttl;
    if (!fresh) revalidate(key, fetcher).catch(() => {});

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        revalidate(key, fetcher).catch(() => {});
      }
    };
    if (focus) {
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onFocus);
    }
    return () => {
      set?.delete(rerender);
      if (focus) {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const e = key ? (store.get(key) as Entry<T> | undefined) : undefined;
  return { data: e?.data, loading: !e?.data && !!e?.promise };
}
