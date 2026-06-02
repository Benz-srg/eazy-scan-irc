# EazyScan — AI Requirement Intelligence Platform

เปลี่ยนเสียงสนทนา Requirement ของลูกค้าให้กลายเป็น **Scope of Work**, **ตารางประเมิน Manday**, ความเสี่ยง, สมมติฐาน และคำถามที่ควรถามลูกค้า ภายในไม่กี่นาที

อัปโหลด/อัดไฟล์เสียง → ถอดเสียง (STT) → วิเคราะห์ด้วย LLM (JSON ผ่าน schema validation) → ผลลัพธ์เป็นการ์ด + ส่งออก DOCX / PDF

> สร้างตาม Claude Design handoff (EazyScan.html) — ธีม Light, Thai-first, indigo→blue gradient

---

## 🧑‍💻 สำหรับผู้ตรวจ (Reviewer Quick Start)

ทดสอบทั้งระบบใน ~3 นาที ด้วย **OpenAI key ตัวเดียว** (ใช้ทั้งถอดเสียงและวิเคราะห์):

```bash
git clone https://github.com/Benz-srg/eazy-scan-irc.git
cd eazy-scan-irc
cp .env.example .env          # ใส่ OPENAI_API_KEY=sk-... ในไฟล์ .env
docker compose up --build     # web + Whisper + MongoDB
```

เปิด **http://localhost:3000** → กด **"เริ่มใช้งานฟรี"** → ที่หน้า Workspace
ลากไฟล์ **`samples/sample-requirement-th.m4a`** มาวาง → เลือก **OpenAI Whisper** → **วิเคราะห์**

> ตั้ง `LLM_PROVIDER=openai` ใน `.env` ด้วย (ค่าเริ่มต้นใน Docker เป็น openai อยู่แล้ว
> ส่วนค่าเริ่มต้นของ local dev คือ Claude Code CLI — ดู [แบบ B](#แบบ-b--local-dev-ไม่ต้องมี-api-key-ถ้ามี-claude-code-cli))

**ทดสอบเฉพาะส่วน AI (ไม่ต้องถอดเสียง)** — ส่ง transcript ตรงเข้า LLM:

```bash
curl -s -X POST http://localhost:3000/api/reanalyze \
  -H "content-type: application/json" \
  -d "{\"transcript\":\"$(cat samples/sample-transcript-th.txt)\",\"provider\":\"openai\"}" | jq .analysis
```

ได้ JSON ที่ผ่าน Zod schema: `summary`, `features` (SOW), `manday` (breakdown ราย module),
`risks`, `assumptions`, `missing`, `questions` พร้อม `confidence` + `evidence` (อ้างอิงจาก transcript)

> 📮 หรือ import **Postman collection** ที่ `postman/` แล้วยิงได้เลย (ดูหัวข้อ [API](#api))

---

## เริ่มใช้งาน

**เลือกแบบไหน?**

| สถานการณ์ | ใช้ | ค่าใช้จ่าย |
|---|---|---|
| มี API key (OpenAI/Anthropic/Gemini) อยากง่ายสุด | **แบบ A** (Docker) | จ่ายตาม API |
| **มี Claude Code CLI ล็อกอินอยู่ ไม่อยากจ่าย** | **แบบ B** (local) | **ฟรี 100%** — Claude CLI วิเคราะห์ + Local Whisper ถอดเสียง |
| แค่อยากดูหน้าตา | **แบบ C** (demo) | ฟรี (ข้อมูลตัวอย่าง) |

> **ฟรีไม่มี key ได้จริง** ถ้าเครื่องมี Claude Code CLI (ล็อกอินแล้ว) → ใช้ **แบบ B**:
> LLM = Claude CLI (ฟรี) · STT = Local Whisper (ฟรี) · ไม่แตะ OpenAI เลย
> *(Docker ใช้ทางนี้ไม่ได้ — Claude CLI รันใน container ไม่ได้ ต้องรัน local)*

ต้องมี **Docker Desktop** อย่างเดียว (แบบ A) หรือ **Node 20+ / pnpm** (แบบ B/C)

### ⭐ แบบ A — Docker คำสั่งเดียว จบทั้งโปรเจกต์ (ง่ายสุด)

ได้ครบ web + ถอดเสียง + ฐานข้อมูล ไม่ต้องลง Node/Python เอง:

```bash
cp .env.example .env     # เปิดไฟล์ ใส่ API key 1 ตัว เช่น OPENAI_API_KEY=sk-...
docker compose up --build
```

เปิด **http://localhost:3000** — เสร็จ
(ครั้งแรก Whisper โหลด model ~3GB รอสักครู่)

- ใช้ key อื่นได้: ตั้ง `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...` (หรือ `gemini` + `GEMINI_API_KEY`) ใน `.env`
- Docker วิเคราะห์ด้วย API key เพราะ Claude Code CLI รันใน container ไม่ได้ (ถ้าอยากใช้ฟรีแบบไม่มี key → แบบ B)

### แบบ B — Local dev (ไม่ต้องมี API key ถ้ามี Claude Code CLI)

ใช้ **Claude Code CLI** วิเคราะห์ (ฟรี ใช้ล็อกอินเครื่อง) + **Local Whisper** ถอดเสียง (ฟรี):

```bash
pnpm install            # ติดตั้ง + gen prisma
pnpm whisper:setup      # ติดตั้ง Python Whisper (ครั้งเดียว)
pnpm db:up              # MongoDB ผ่าน Docker (ข้ามได้ถ้าไม่ต้องการประวัติถาวร)
pnpm dev:all            # รัน web + whisper พร้อมกัน
```

เปิด http://localhost:3000 — ไม่ต้องมี key
ตั้งค่า Claude CLI: ดู [การเชื่อม Claude Code CLI](#การเชื่อม-claude-code-cli)

### แบบ C — เดโมอย่างเดียว (0 setup)

```bash
pnpm install && pnpm dev
```

กด "ดูตัวอย่าง" → เห็นผลวิเคราะห์ตัวอย่างทันที (ข้อมูล sample, ไม่เรียก AI)

---

## โมเดล LLM สำหรับวิเคราะห์ (มี fallback ครบ)

ตั้งผ่าน `LLM_PROVIDER` ใน `.env.local` (ค่า default = `claude-cli`):

| `LLM_PROVIDER` | ต้องมี | ค่าใช้จ่าย | หมายเหตุ |
|---|---|---|---|
| `claude-cli` (default) | Claude Code CLI ล็อกอินบนเครื่อง | ตามแพ็กเกจ Claude | **ไม่ต้องมี API key** · รันใน Docker ไม่ได้ |
| `anthropic` | `ANTHROPIC_API_KEY` | จ่ายตาม API | Claude ผ่าน API ปกติ |
| `gemini` | `GEMINI_API_KEY` | จ่ายตาม API | Google Gemini |
| `openai` | `OPENAI_API_KEY` | จ่ายตาม API | ใช้ใน Docker เป็นค่า default |

ทุก provider ใช้ **prompt + หลักเกณฑ์ + Zod schema ชุดเดียวกัน** → คุณภาพ/กฎ anti-hallucination เท่ากัน ต่างแค่ความเร็ว/ความลึก

> **Auto-fallback:** ถ้าตั้ง provider เป็น API (openai/anthropic/gemini) แต่ไม่มี key
> และเครื่องมี **Claude Code CLI** ติดตั้ง+ล็อกอินอยู่ → ระบบจะใช้ CLI ให้อัตโนมัติ (ฟรี)
> แทนที่จะ error. (ใน Docker ไม่มี CLI → ไม่ fallback)

**ความละเอียด (depth)** เป็นค่าฝั่งเซิร์ฟเวอร์ (ผู้ใช้ไม่ต้องเลือก — UI ให้เลือกแค่ STT):
- ดีฟอลต์ **fast** = Haiku / Flash / gpt-4o-mini (ไวกว่า ~2 เท่า)
- **deep** = Sonnet / Pro / gpt-4o (ลึกกว่า) — ตั้ง model ต่อ provider ผ่าน env เช่น
  `CLAUDE_CLI_DEEP_MODEL`, `ANTHROPIC_ANALYSIS_MODEL`, `GEMINI_ANALYSIS_MODEL`, `OPENAI_ANALYSIS_MODEL`

### การเชื่อม Claude Code CLI

`claude-cli` คือโหมดที่ **ไม่ต้องมี API key** — ใช้การล็อกอิน Claude บนเครื่องคุณ

1. ติดตั้ง CLI:
   ```bash
   npm install -g @anthropic-ai/claude-code
   # หรือ: curl -fsSL https://claude.ai/install.sh | bash
   ```
2. ล็อกอิน (ครั้งเดียว):
   ```bash
   claude          # เปิด session แล้วทำตามขั้นตอนล็อกอิน (เบราว์เซอร์)
   ```
3. ตรวจว่าใช้ได้:
   ```bash
   claude --version
   echo "hi" | claude -p --output-format json   # ต้องได้ JSON กลับมา
   ```
4. ใน `.env.local` ตั้ง (หรือปล่อยว่าง = ค่า default อยู่แล้ว):
   ```
   LLM_PROVIDER=claude-cli
   ```

ถ้าไม่มี/ไม่อยากใช้ CLI → เปลี่ยน `LLM_PROVIDER` เป็น `anthropic` / `gemini` / `openai` แล้วใส่ key ที่ตรงกัน
ปรับ path/รุ่นได้ด้วย `CLAUDE_CLI_PATH`, `CLAUDE_CLI_FAST_MODEL`, `CLAUDE_CLI_DEEP_MODEL`

---

## Speech-to-Text (ถอดเสียง)

| ตัวเลือก | ความเร็ว (Mac CPU) | คุณภาพไทย | ติดตั้งเพิ่ม | key |
|---|---|---|---|---|
| **Local Whisper** (large-v3) | ~60–280s | แม่นมาก | Python (`pnpm whisper:setup`) | ไม่ต้อง |
| **OpenAI Whisper** | ~10–30s | แม่น | ไม่ต้อง | `OPENAI_API_KEY` |

ผู้ใช้เลือก provider + ใส่ OpenAI key เองได้ในแอป (เก็บใน browser เท่านั้น) ดูเมนู **ตั้งค่า**
faster-whisper บน Mac ใช้ CPU ล้วน (ไม่มี GPU) → ช้า · งานเร็ว+แม่น แนะนำ OpenAI Whisper

---

## Environment Variables

คัดลอก `.env.example` → `.env.local` (local dev) หรือ `.env` (Docker) ทุกค่าเป็น optional

| ตัวแปร | ค่า default | ใช้ทำอะไร |
|---|---|---|
| `LLM_PROVIDER` | `claude-cli` | เลือกเครื่องวิเคราะห์ (ดูตารางบน) |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY` | — | key ตาม provider ที่เลือก |
| `PYTHON_WHISPER_URL` | `http://localhost:8000` | Local Whisper service |
| `WHISPER_MODEL` | `large-v3` | รุ่น Whisper (เล็กลง = เร็วแต่ไทยแย่) |
| `DATABASE_URL` | — | MongoDB (ไม่ตั้ง = ประวัติเก็บใน browser) |

---

## API

> 📮 **Postman**: import `postman/EazyScan.postman_collection.json` +
> `postman/EazyScan.postman_environment.json` (เลือก environment "EazyScan — Local")
> มี request ครบทุก endpoint พร้อมตัวอย่าง body — แนบไฟล์ `samples/sample-requirement-th.m4a`
> ที่ฟิลด์ `audio` ของ request "Analyze" ได้เลย

| Endpoint | Method | รับ | คืน |
|---|---|---|---|
| `/api/analyze` | POST | `multipart/form-data`: `audio`, `provider` (`local`\|`openai`), `apiKey?` | **NDJSON stream** — 1 JSON ต่อบรรทัด: `{type:"stage"...}` ระหว่างทำงาน, บรรทัดสุดท้าย `{type:"result", analysis, transcript, audioUrl, id}` |
| `/api/reanalyze` | POST | `application/json`: `{transcript, provider?, apiKey?}` | `{analysis}` (JSON ก้อนเดียว) — วิเคราะห์ transcript ตรง ๆ ไม่ผ่าน STT |
| `/api/audio/[file]` | GET | — | ไฟล์เสียง (attachment, guarded) |
| `/api/export/[docx\|pdf]` | POST | `application/json`: Analysis | ไฟล์เอกสาร |
| `/api/projects` · `/api/projects/[id]` | GET/DELETE | — | ประวัติ (เมื่อมี MongoDB) |

`/api/analyze` เป็น **stream** เพื่อรายงานความคืบหน้าจริงต่อ stage (ถอดเสียง/วิเคราะห์)
ถ้าต้องการผลก้อนเดียวแบบ request/response ปกติ ให้ใช้ **`/api/reanalyze`** (ดูตัวอย่าง curl
ที่ Reviewer Quick Start ด้านบน). อ่าน NDJSON: เก็บบรรทัดที่ `type === "result"`

ตัวอย่างอ่าน stream:
```bash
curl -s -N -X POST http://localhost:3000/api/analyze \
  -F "audio=@samples/sample-requirement-th.m4a" -F "provider=openai" \
  | while read -r line; do echo "$line" | jq -rc '.type, (.analysis.title // empty)'; done
```

## Architecture

```
เสียง ─POST /api/analyze (stream NDJSON)─▶ STT ─▶ LLM analysis ─▶ บันทึก
                                          │ Whisper       │ claude-cli/anthropic/  │ uploads + Mongo
                                          │ (local/openai)│ gemini/openai          │
                                          └ + Zod schema validation + retry ───────┘
```

- หน้า **Processing** เดิน stepper ตาม stage จริง + โชว์เวลาจริงต่อขั้น (ดูออกว่าช้า step ไหน)
- ทุกผล AI ผ่าน **Zod `AnalysisSchema`** + retry → ไม่หลุด schema
- ทุกผลมี `confidence` + `evidence` (quote จาก transcript) — กฎ anti-hallucination ใน `prompt.ts`
- **หลักเกณฑ์ประเมิน Manday** อยู่ใน `prompt.ts` + `SKILLS.md` (RAG) → requirement เดียวกันได้ผลใกล้กันทุกครั้ง

## Stack

Next.js 16 (App Router) · TypeScript · React 19 · TailwindCSS v4 · jotai · lucide-react ·
Vercel AI SDK · Claude Code CLI / OpenAI / Anthropic / Gemini · faster-whisper (Python FastAPI) ·
Prisma + MongoDB · docx + pdf-lib (embedded Noto Sans Thai)

## Scripts

```bash
pnpm docker         # ⭐ ทั้งโปรเจกต์ใน Docker (web + whisper + mongo)
pnpm dev            # web เท่านั้น
pnpm dev:all        # web + Local Whisper พร้อมกัน
pnpm whisper:setup  # ติดตั้ง Python Whisper (ครั้งเดียว)
pnpm db:up          # MongoDB (Docker) สำหรับ local dev
pnpm db:push        # sync Prisma schema → MongoDB
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
```

## Screens

`/` Landing (SSR + SEO) · `/workspace` อัด/อัปโหลด + เลือก STT provider ·
`/processing` stepper จริง · `/results/[id]` ผลวิเคราะห์ + export + ดาวน์โหลดเสียง ·
`/history` คลังเอกสาร ค้นหา/กรอง/เล่นเสียง

## Known limitations

- Claude Code CLI ใช้ใน Docker ไม่ได้ (ใช้ host login) → Docker ใช้ OpenAI/Anthropic/Gemini แทน
- PDF Thai diacritic positioning เป็น best-effort (pdf-lib ไม่ทำ GPOS) → DOCX ไทยสมบูรณ์กว่า
- Local Whisper บน CPU ช้า; งานเร็วใช้ OpenAI Whisper
- ผล LLM มี variance เล็กน้อย (±1-2 วัน) — งานกำกวม confidence จะต่ำ + มีคำถามให้ถามลูกค้า
- ไฟล์เสียงสูงสุด 100MB
