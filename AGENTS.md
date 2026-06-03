<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# EazyScan — Agent Guide

AI Manday Estimator. Built faithfully from a Claude Design handoff (EazyScan.html).

## Ground rules

- **Design fidelity first.** UI is ported 1:1 from the handoff. Do not redesign. Tokens live in `src/app/globals.css` as CSS variables; components use inline styles to match the handoff exactly.
- **Thai-first, light theme only.** No dark mode.
- **Graceful degradation.** Every server feature (STT, LLM, DB) is optional — the app must keep working with the bundled sample analysis when keys/services are absent.

## Map

| Concern | Location |
|---|---|
| Design tokens / keyframes | `src/app/globals.css` |
| Shared UI primitives | `src/components/ui/primitives.tsx` |
| Screens | `src/components/landing`, `src/components/app` |
| Routes | `src/app/(app)/*`, `src/app/page.tsx` |
| Client store | `src/lib/store.ts` (`useSyncExternalStore`) |
| Recorder hook | `src/lib/useRecorder.ts` |
| Types + Zod schema | `src/lib/types.ts` |
| Sample data | `src/lib/sample-data.ts` |
| Server pipeline | `src/lib/server/{transcribe,analyze,analyze-claude,prompt,storage,export,db}.ts` |
| API | `src/app/api/{analyze,reanalyze,audio,export,projects}` |
| Client state (jotai) | `src/lib/atoms.ts` (apiKey, STT provider — persisted localStorage) |
| Knowledge (RAG) | `CONTEXT.md`, `SKILLS.md` |

## LLM providers

- `analyze.ts` dispatches on `LLM_PROVIDER`: `claude-cli` (default, host login, no key) ·
  `anthropic` · `gemini` · `openai` (all via AI SDK `generateObject`).
- Claude CLI (`analyze-claude.ts`) shells `claude -p --output-format json`, extracts the JSON
  from `result`, then validates with Zod. It CANNOT run inside Docker (host auth) — Docker uses OpenAI.
- Auto-fallback: an API provider with no key, on a host that has the Claude CLI, uses the CLI.
- Depth is server-side (default `fast`; the UI exposes only STT choice): `fast`
  (Haiku/Flash/4o-mini) vs `deep` (Sonnet/Pro/4o), per-provider models via env. Same prompt+schema.
- Users pick only the STT provider (Local Whisper vs OpenAI Whisper) in the UI.

## Invariants

- All AI output validated by `AnalysisSchema` (Zod) with retry. Never trust raw LLM JSON.
- Every analysis carries `confidence` + `evidence` (transcript quote). Anti-hallucination + estimation
  rubric in `prompt.ts`; reference ranges in `SKILLS.md`. Estimate the client's CURRENT phase only (MVP).
- `/api/analyze` streams NDJSON stage events; the Processing UI follows real stages + real timing.
- Audio served only via `/api/audio/[filename]` with path-traversal guard.
- API keys (OpenAI) live in browser localStorage only (jotai), never in our DB. Sent per-request for STT.
- **Auth is not implemented yet** (guest mode; login is "coming soon"; `Project` has no `userId`).
  DB write routes (`/api/analyze` create, `/api/projects/[id]` delete, `/api/reanalyze` update) are
  therefore unauthenticated — a known IDOR gap. When auth lands, add `userId` to `Project` and scope
  EVERY DB query by owner together (`where: { id, userId }`), returning 401/403 otherwise.
- `/api/analyze` creates the `processing` Project row BEFORE compute and keeps running even if the
  client disconnects (`send()` swallows enqueue errors), so a job started then abandoned still reaches
  `done`/`error` and surfaces in History (which polls every 4s while any row is `processing`). The
  Processing page only auto-opens results when the user is still on `/processing` (no late redirect).
  Known gap: if the server process itself dies mid-job, that row stays `processing` forever (no reaper).
- Run `pnpm typecheck` and `pnpm build` before declaring done.
