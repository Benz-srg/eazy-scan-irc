# EazyScan — Project Notes

บันทึกรายละเอียด/การตัดสินใจของโปรเจกต์ (สำหรับทีม + อ้างอิงภายหลัง)

## ภาพรวม

**EazyScan — AI Manday Estimator.** รับเสียง Requirement ลูกค้า → ถอดเสียง (STT) → วิเคราะห์ด้วย LLM →
**Scope of Work, ตาราง Manday (range รายโมดูล), ความเสี่ยง, สมมติฐาน, ข้อมูลที่ขาด, คำถามที่ควรถามลูกค้า**
ส่งออก DOCX/PDF · Thai-first · light theme · สร้างตาม Claude Design handoff (`EazyScan.html`)

- Repo: `github.com/Benz-srg/eazy-scan-irc` (private)
- โจทย์: Technical Assessment — Full Stack Developer (4 วัน)

## Stack

| ชั้น | เทคโนโลยี |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · React 19 · TailwindCSS v4 (tokens เป็น CSS vars, inline styles ตาม handoff) · jotai · lucide-react · motion |
| AI | Vercel AI SDK (`@ai-sdk/openai\|anthropic\|google`) + Claude Code CLI |
| STT | OpenAI Whisper หรือ Local Whisper (Python FastAPI + faster-whisper) |
| Data | Prisma + MongoDB (optional, single-node replica set rs0) |
| Export | docx · pdf-lib (ฝัง Noto Sans Thai) |

## โครงสร้างไฟล์

| งาน | ที่อยู่ |
|---|---|
| Design tokens / keyframes | `src/app/globals.css` |
| UI primitives | `src/components/ui/primitives.tsx` |
| Screens | `src/components/landing`, `src/components/app` |
| Routes | `src/app/(app)/*`, `src/app/page.tsx` |
| Client store / SWR / atoms | `src/lib/store.ts`, `src/lib/swr.ts`, `src/lib/atoms.ts` |
| Types + Zod schema | `src/lib/types.ts` (`AnalysisSchema`) |
| Server pipeline | `src/lib/server/{transcribe,analyze,analyze-claude,prompt,storage,export,db}.ts` |
| API | `src/app/api/{analyze,reanalyze,audio,export,projects}` |
| Knowledge (RAG) | `CONTEXT.md`, `SKILLS.md` |
| ตัวอย่างทดสอบ | `samples/` |

## Pipeline

```
POST /api/analyze (NDJSON stream)
  upload → transcribe (STT) → analyze (LLM) → finalize (save + DB)
  แต่ละ stage ส่ง event จริง + เวลาจริง · บรรทัดสุดท้าย type:result
```

- **STT**: `transcribe.ts` — OpenAI Whisper หรือ local Python (`PYTHON_WHISPER_URL`), prompt ไทยกัน code-switch
- **LLM**: `analyze.ts` dispatch ตาม `LLM_PROVIDER`
  - `claude-cli` (default local) — `analyze-claude.ts` เรียก `claude -p --output-format json` (ไม่ต้องมี key, ใช้ host login)
  - `anthropic` / `gemini` / `openai` — AI SDK `generateObject`
- ทุกผลผ่าน **Zod `AnalysisSchema` + retry** · มี `confidence` + `evidence` (quote จาก transcript)
- **depth**: fast = haiku/flash/4o-mini, deep = sonnet/pro/4o (server-side, default fast; UI เลือกแค่ STT)
- **`/api/reanalyze`**: วิเคราะห์ transcript ตรง ๆ (JSON ก้อนเดียว, ไม่ผ่าน STT)

## การตัดสินใจสำคัญ

- **Job persistence**: สร้าง Project row `status=processing` ตั้งแต่เริ่ม → โผล่ History ทันที + งานรันต่อแม้ออกจากหน้า → finalize เป็น done/error
- **ไม่มี silent mock**: sample ใช้เฉพาะ `/results/sample` (ปุ่มดูตัวอย่าง) · เสียงจริงล้ม → error screen · real id ไม่มีข้อมูล → not-found (ไม่ใช่ mock)
- **Anti-hallucination + consistency**: prompt ประเมินเฉพาะ "เฟสที่ลูกค้าโฟกัสตอนนี้" (MVP) + ผูกช่วงเวลากับ SKILLS.md → requirement เดียวกันได้ผลใกล้กัน
- **Security**: API key เก็บ browser-only (jotai) ไม่เข้า DB · `/api/audio` allowlist + realpath + attachment + nosniff + CSP
- **Auto-fallback**: provider เป็น API แต่ไม่มี key + มี Claude CLI → ใช้ CLI ให้อัตโนมัติ
- **Responsive**: ถึง iPhone SE (375px) — `useMediaQuery`, AppShell desktop sidebar ↔ mobile drawer

## วิธีรัน

- **Docker (คำสั่งเดียว)**: `cp .env.example .env` (ใส่ key) → `docker compose up --build` (LLM default = openai)
- **Local ฟรี**: `pnpm install && pnpm whisper:setup && pnpm dev:all` + Claude CLI ล็อกอิน (ไม่ต้อง key)
- **Demo**: `pnpm install && pnpm dev` → ดูตัวอย่าง

## ทดสอบ

- `samples/sample-requirement-th.m4a` — ลากเข้า Workspace (flow เต็ม)
- `samples/sample-transcript-th.txt` — ยิง `POST /api/reanalyze` (ทดสอบ AI อย่างเดียว)
- verified: full loop (STT 62s + Claude 82s → SOW 7-12 วัน conf 65) · depth fast→haiku/deep→sonnet ·
  clean-room docker build · processing→error กับ Mongo จริง · DOCX/PDF valid · audio traversal blocked

## ช่องโหว่ที่รู้ (Known limitations)

- **ไม่มี automated tests** (Code Quality อาจหัก; โจทย์ไม่ require ชัด)
- **PDF** Thai diacritic best-effort (pdf-lib ไม่มี GPOS) → DOCX ไทยสมบูรณ์กว่า
- **Local Whisper** large-v3 ช้าบน CPU (~60–210s); ต้องการเร็วใช้ OpenAI Whisper (~15s)
- **Auth ยังไม่ทำ** (guest mode, login = coming soon, `Project` ไม่มี `userId`) → DB write routes
  เป็น IDOR gap ที่ต้อง scope ตาม owner เมื่อทำ auth (ระบุไว้ใน AGENTS.md)
- LLM มี variance ~±1–2 วัน (input กำกวม → confidence ต่ำ + มีคำถามแทนการเดา)

## คงค้าง (ต้องทำโดยคน)

1. ขอ GitHub username ทีมงาน → invite เข้า private repo
2. ส่ง email แจ้งงาน (ร่างเตรียมไว้)
3. (optional) เพิ่ม unit test `AnalysisSchema` + prompt builder
