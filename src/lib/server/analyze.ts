import "server-only";
import { generateObject, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { AnalysisSchema, type Analysis } from "@/lib/types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { analyzeWithClaudeCli, type Depth } from "./analyze-claude";

export type AnalyzeOpts = { apiKey?: string; depth?: Depth };

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
  const provider = (process.env.LLM_PROVIDER || "claude-cli").toLowerCase();
  const deep = (opts.depth ?? "fast") === "deep";

  if (provider === "claude-cli") {
    return analyzeWithClaudeCli(transcript, opts.depth ?? "fast");
  }
  const model = resolveSdkModel(provider, opts, deep);
  return analyzeWithSdk(model, transcript);
}
