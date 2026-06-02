"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "recorded";

export type RecorderResult = {
  status: RecorderStatus;
  seconds: number;
  /** Real-time amplitude levels [0..1], one per spectrum bar. Empty when not recording. */
  levels: number[];
  /** Whether the mic stream is live (real audio) vs. simulated fallback. */
  live: boolean;
  blob: Blob | null;
  url: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  loadFile: (file: File) => void;
};

export function useRecorder(barCount = 56): RecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [live, setLive] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const synthTRef = useRef(0);

  const cleanupAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const runLevels = useCallback(() => {
    const analyser = analyserRef.current;
    const tick = () => {
      if (analyser) {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        const step = Math.floor(buf.length / barCount) || 1;
        const next: number[] = [];
        for (let i = 0; i < barCount; i++) {
          const v = buf[i * step] / 255;
          next.push(Math.max(0.08, v));
        }
        setLevels(next);
      } else {
        // simulated fallback spectrum
        synthTRef.current += 0.13;
        const t = synthTRef.current;
        const next = Array.from({ length: barCount }, (_, i) => {
          const c = Math.abs(i - barCount / 2) / (barCount / 2);
          const env = 1 - c * 0.55;
          const v =
            Math.sin(t + i * 0.55) * 0.5 +
            Math.sin(t * 2.1 + i * 0.9) * 0.3 +
            Math.sin(t * 0.7 + i) * 0.2;
          return Math.max(0.08, Math.min(1, (0.25 + Math.abs(v) * 0.9) * env));
        });
        setLevels(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [barCount]);

  const startTimer = useCallback(() => {
    setSeconds(0);
    const t0 = performance.now();
    timerRef.current = setInterval(() => {
      setSeconds((performance.now() - t0) / 1000);
    }, 100);
  }, []);

  const start = useCallback(async () => {
    chunksRef.current = [];
    setBlob(null);
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    let gotStream = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      gotStream = true;
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
      };
      mr.start();
      setLive(true);
    } catch {
      // mic blocked / unsupported — simulate so the flow still demos
      setLive(false);
    }
    setStatus("recording");
    startTimer();
    runLevels();
    return void gotStream;
  }, [runLevels, startTimer, url]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      mediaRef.current?.stop();
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setLevels([]);
    setStatus("recorded");
  }, []);

  const reset = useCallback(() => {
    cleanupAudio();
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setBlob(null);
    setSeconds(0);
    setLevels([]);
    setLive(false);
    setStatus("idle");
  }, [cleanupAudio, url]);

  const loadFile = useCallback(
    (file: File) => {
      if (url) URL.revokeObjectURL(url);
      const objUrl = URL.createObjectURL(file);
      setBlob(file);
      setUrl(objUrl);
      setLive(false);
      const a = new Audio(objUrl);
      a.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(a.duration)) setSeconds(a.duration);
      });
      setStatus("recorded");
    },
    [url],
  );

  useEffect(() => () => cleanupAudio(), [cleanupAudio]);

  return {
    status,
    seconds,
    levels,
    live,
    blob,
    url,
    start,
    stop,
    reset,
    loadFile,
  };
}
