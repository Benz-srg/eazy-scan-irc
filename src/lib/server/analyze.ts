import "server-only";
import { spawnSync } from "node:child_process";
import { generateObject, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { AnalysisSchema, type Analysis } from "@/lib/types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { analyzeWithClaudeCli, type Depth } from "./analyze-claude";

/** Is the Claude Code CLI installed + usable on this host? (cached) */
let _cliOk: boolean | null = null;
function claudeCliAvailable(): boolean {
  if (_cliOk !== null) return _cliOk;
  try {
    const bin = process.env.CLAUDE_CLI_PATH || "claude";
    const r = spawnSync(bin, ["--version"], { timeout: 5000, stdio: "ignore" });
    _cliOk = r.status === 0;
  } catch {
    _cliOk = false;
  }
  return _cliOk;
}

/** Does the chosen API provider have a key available (request or env)? */
function hasKey(provider: string, opts: AnalyzeOpts): boolean {
  if (opts.apiKey) return true;
  if (provider === "anthropic") return !!process.env.ANTHROPIC_API_KEY;
  if (provider === "gemini" || provider === "google")
    return !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);
  return !!process.env.OPENAI_API_KEY;
}

export type AnalyzeOpts = {
  apiKey?: string;
  depth?: Depth;
  /** Overrides LLM_PROVIDER for this call (used by re-analyze). */
  provider?: string;
};

/**
 * Analysis via an AI SDK provider (OpenAI / Anthropic API / Gemini).
 * generateObject enforces the Zod schema; one explicit retry on top of the
 * SDK's internal retries so transient invalid JSON never reaches the user.
 * The system prompt (rubric + anti-hallucination) is identical across providers.
 */
async function analyzeWithSdk(
  model: LanguageModel,
  transcript: string,
): Promise<Analysis> {
  const system = await buildSystemPrompt();
  const prompt = buildUserPrompt(transcript);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema: AnalysisSchema,
        system,
        prompt,
        temperature: 0,
        maxRetries: 2,
      });
      return AnalysisSchema.parse(object);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("analysis failed");
}

function resolveSdkModel(
  provider: string,
  opts: AnalyzeOpts,
  deep: boolean,
): LanguageModel {
  if (provider === "anthropic") {
    const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("missing ANTHROPIC_API_KEY");
    const anthropic = createAnthropic({ apiKey });
    const m =
      process.env.ANTHROPIC_ANALYSIS_MODEL ||
      (deep ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001");
    return anthropic(m);
  }
  if (provider === "gemini" || provider === "google") {
    const apiKey =
      opts.apiKey ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("missing GEMINI_API_KEY");
    const google = createGoogleGenerativeAI({ apiKey });
    const m =
      process.env.GEMINI_ANALYSIS_MODEL ||
      (deep ? "gemini-2.5-pro" : "gemini-2.5-flash");
    return google(m);
  }
  // openai
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("missing OPENAI_API_KEY");
  const openai = createOpenAI({ apiKey });
  const m =
    process.env.OPENAI_ANALYSIS_MODEL || (deep ? "gpt-4o" : "gpt-4o-mini");
  return openai(m);
}

/**
 * Turns a transcript into a validated Analysis object.
 *
 * LLM_PROVIDER selects the engine (default "claude-cli"):
 *   - claude-cli : local Claude Code CLI, no API key (uses host login)
 *   - anthropic  : Anthropic API (ANTHROPIC_API_KEY)
 *   - gemini     : Google Gemini API (GEMINI_API_KEY)
 *   - openai     : OpenAI API (OPENAI_API_KEY)
 */
export async function analyzeTranscript(
  transcript: string,
  opts: AnalyzeOpts = {},
): Promise<Analysis> {
  const provider = (
    opts.provider ||
    process.env.LLM_PROVIDER ||
    "claude-cli"
  ).toLowerCase();
  const deep = (opts.depth ?? "fast") === "deep";

  // Auto-fallback: an API provider was chosen but has no key — if the local
  // Claude Code CLI is available, use it (free, host login) instead of failing.
  // (In Docker the CLI isn't present, so this correctly does not trigger.)
  if (provider !== "claude-cli" && !hasKey(provider, opts) && claudeCliAvailable()) {
    console.log(
      `[analyze] ${provider} has no key — falling back to local Claude CLI`,
    );
    return analyzeWithClaudeCli(transcript, opts.depth ?? "fast");
  }

  if (provider === "claude-cli") {
    return analyzeWithClaudeCli(transcript, opts.depth ?? "fast");
  }
  const model = resolveSdkModel(provider, opts, deep);
  return analyzeWithSdk(model, transcript);
}
