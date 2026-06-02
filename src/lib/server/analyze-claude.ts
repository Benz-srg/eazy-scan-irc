import "server-only";
import { spawn } from "node:child_process";
import os from "node:os";
import { z } from "zod";
import { AnalysisSchema, type Analysis } from "@/lib/types";
import { buildSystemPrompt } from "./prompt";

const CLI = process.env.CLAUDE_CLI_PATH || "claude";
const FAST_MODEL = process.env.CLAUDE_CLI_FAST_MODEL || "claude-haiku-4-5-20251001";
const DEEP_MODEL = process.env.CLAUDE_CLI_DEEP_MODEL || "claude-sonnet-4-6";
const TIMEOUT_MS = Number(process.env.CLAUDE_CLI_TIMEOUT_MS || 180_000);

export type Depth = "fast" | "deep";
export function modelForDepth(depth: Depth): string {
  return depth === "deep" ? DEEP_MODEL : FAST_MODEL;
}

type CliEnvelope = { is_error?: boolean; result?: string };

function runClaude(prompt: string, model: string): Promise<CliEnvelope> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      CLI,
      ["-p", "--output-format", "json", "--model", model],
      {
        // neutral cwd so the project's CLAUDE.md / agents aren't pulled into context
        cwd: os.tmpdir(),
        env: process.env,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("claude CLI timed out"));
    }, TIMEOUT_MS);

    // decode as UTF-8 across chunk boundaries — Thai chars are 3 bytes and
    // would corrupt (U+FFFD) if a multibyte sequence straddled two chunks
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`claude CLI exited ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as CliEnvelope);
      } catch {
        reject(new Error("claude CLI returned non-JSON envelope"));
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/** Pull the first complete JSON object out of the model's text response. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let s = fenced ? fenced[1] : text;
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

/**
 * Analysis via the local Claude Code CLI (`claude -p`).
 * Uses the machine's Claude auth — no API key required. We instruct the model
 * to emit a single JSON object matching AnalysisSchema, then extract + validate
 * it (the CLI's native --json-schema mode is unreliable for large schemas).
 */
export async function analyzeWithClaudeCli(
  transcript: string,
  depth: Depth = "fast",
): Promise<Analysis> {
  const system = await buildSystemPrompt();
  const schema = JSON.stringify(z.toJSONSchema(AnalysisSchema));
  const model = modelForDepth(depth);
  const prompt = `${system}

ตอบกลับเป็น JSON object เดียวที่ตรงกับ JSON Schema ต่อไปนี้เท่านั้น ห้ามมีข้อความอื่นหรือ markdown ใด ๆ ก่อน/หลัง JSON:
${schema}

วิเคราะห์ transcript ต่อไปนี้:
"""
${transcript}
"""`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const env = await runClaude(prompt, model);
      if (env.is_error || !env.result)
        throw new Error("claude CLI reported an error");
      return AnalysisSchema.parse(extractJson(env.result));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("claude CLI analysis failed");
}
