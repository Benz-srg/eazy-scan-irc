import { describe, it, expect, vi, afterEach } from "vitest";
import { runAnalysis, type StageEvent } from "./analyze-client";
import { SAMPLE_ANALYSIS } from "./sample-data";

function streamResponse(lines: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const l of lines) controller.enqueue(enc.encode(l + "\n"));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

const blob = new Blob(["x"], { type: "audio/webm" });
const session = {
  audioBlob: blob,
  audioName: "req.webm",
  provider: "local" as const,
  apiKey: "",
};

afterEach(() => vi.restoreAllMocks());

describe("runAnalysis (NDJSON client)", () => {
  it("uses the bundled sample when there is no audio (demo)", async () => {
    const out = await runAnalysis({ ...session, audioBlob: null });
    expect(out.source).toBe("sample");
    expect(out.analysis).toEqual(SAMPLE_ANALYSIS);
  });

  it("parses stage events + the final result line", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      streamResponse([
        JSON.stringify({ type: "job", id: "abc" }),
        JSON.stringify({ type: "stage", key: "transcribe", state: "start" }),
        JSON.stringify({ type: "stage", key: "transcribe", state: "done", ms: 1200 }),
        JSON.stringify({
          type: "result",
          id: "abc",
          analysis: SAMPLE_ANALYSIS,
          transcript: "hello",
          audioUrl: "/api/audio/abc.webm",
        }),
      ]),
    );
    const stages: StageEvent[] = [];
    const out = await runAnalysis(session, (e) => stages.push(e));

    expect(out.source).toBe("api");
    expect(out.id).toBe("abc");
    expect(out.transcript).toBe("hello");
    expect(out.audioUrl).toBe("/api/audio/abc.webm");
    expect(out.analysis?.title).toBe(SAMPLE_ANALYSIS.title);
    // only stage events are forwarded to onStage
    expect(stages.every((s) => s.type === "stage")).toBe(true);
    expect(stages.length).toBe(2);
  });

  it("returns an error (NOT a mock) when the stream reports an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      streamResponse([JSON.stringify({ type: "error", message: "STT ล้มเหลว" })]),
    );
    const out = await runAnalysis(session);
    expect(out.source).toBe("error");
    expect(out.analysis).toBeNull();
    expect(out.error).toContain("STT");
  });

  it("returns an error when the HTTP request fails (no silent sample)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    const out = await runAnalysis(session);
    expect(out.source).toBe("error");
    expect(out.analysis).toBeNull();
  });
});
