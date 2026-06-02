# EazyScan — AI Requirement Intelligence Platform

เปลี่ยนเสียงสนทนา Requirement ของลูกค้าให้กลายเป็น **Scope of Work**, **ตารางประเมิน Manday**, ความเสี่ยง, สมมติฐาน และคำถามที่ควรถามลูกค้า ภายในไม่กี่นาที

อัปโหลด/อัดไฟล์เสียง → ถอดเสียง (STT) → วิเคราะห์ด้วย LLM (JSON ผ่าน schema validation) → ผลลัพธ์เป็นการ์ด + ส่งออก DOCX / PDF

> สร้างตาม Claude Design handoff (EazyScan.html) — ธีม Light, Thai-first, indigo→blue gradient

---

## เริ่มเร็วที่สุด (เลือก 1 แบบ)

### แบบ A — Docker เดียวจบ (ง่ายสุด, ต้องมี OpenAI key)

ได้ครบทั้ง web + ถอดเสียง + ฐานข้อมูล ด้วยคำสั่งเดียว ไม่ต้องลง Node/Python เอง

```bash
cp .env.example .env            # ใส่ OPENAI_API_KEY=sk-... ในไฟล์
export OPENAI_API_KEY=sk-...    # หรือ set ใน shell
docker compose --profile full up --build
```

เปิด http://localhost:3000 — เสร็จ
(ครั้งแรก Whisper จะโหลด model ~3GB, รอสักครู่)

> Docker ใช้ **OpenAI** วิเคราะห์ เพราะ Claude Code CLI รันใน container ไม่ได้ (ดูแบบ B)

### แบบ B — Local dev (ไม่ต้องใช้ API key เลย ถ้ามี Claude Code CLI)

ใช้ **Claude Code CLI** วิเคราะห์ (ฟรี ใช้ล็อกอินเครื่องคุณ) + **Local Whisper** ถอดเสียง (ฟรี)

```bash
pnpm install                    # ติดตั้ง web + gen prisma
pnpm whisper:setup              # ติดตั้ง Python Whisper (ครั้งเดียว)
docker compose up -d mongo      # ฐานข้อมูล (ถ้าต้องการประวัติถาวร; ข้ามได้)
pnpm dev:all                    # รัน web + whisper พร้อมกัน
```

เปิด http://localhost:3000 — ไม่ต้องมี API key ใด ๆ
ดูวิธีต่อ Claude Code CLI ที่หัวข้อ [การเชื่อม Claude Code CLI](#การเชื่อม-claude-code-cli) ด้านล่าง

### แบบ C — เดโมอย่างเดียว (ไม่ต้องตั้งอะไร)

```bash
pnpm install && pnpm dev
```

กด "ดูตัวอย่าง" ที่หน้าแรก → เห็นผลวิเคราะห์ตัวอย่างทันที (ใช้ข้อมูล sample, ไม่เรียก AI จริง)

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

**ความละเอียด (เร็ว/ละเอียด)** เลือกในแอป (Workspace หรือเมนูตั้งค่า):
- **เร็ว** = Haiku/Flash/gpt-4o-mini (ไวกว่า ~2 เท่า, default)
- **ละเอียด** = Sonnet/Pro/gpt-4o (วิเคราะห์ลึกกว่า)

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
pnpm dev            # web เท่านั้น
pnpm dev:all        # web + Local Whisper พร้อมกัน
pnpm whisper:setup  # ติดตั้ง Python Whisper (ครั้งเดียว)
pnpm db:up          # MongoDB (Docker) สำหรับ local dev
pnpm db:push        # sync Prisma schema → MongoDB
pnpm docker:up      # full stack (web + whisper + mongo) ใน Docker
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
```

## Screens

`/` Landing (SSR + SEO) · `/workspace` อัด/อัปโหลด + เลือก provider/depth ·
`/processing` stepper จริง · `/results/[id]` ผลวิเคราะห์ + export + ดาวน์โหลดเสียง ·
`/history` คลังเอกสาร ค้นหา/กรอง/เล่นเสียง

## Known limitations

- Claude Code CLI ใช้ใน Docker ไม่ได้ (ใช้ host login) → Docker ใช้ OpenAI/Anthropic/Gemini แทน
- PDF Thai diacritic positioning เป็น best-effort (pdf-lib ไม่ทำ GPOS) → DOCX ไทยสมบูรณ์กว่า
- Local Whisper บน CPU ช้า; งานเร็วใช้ OpenAI Whisper
- ผล LLM มี variance เล็กน้อย (±1-2 วัน) — งานกำกวม confidence จะต่ำ + มีคำถามให้ถามลูกค้า
- ไฟล์เสียงสูงสุด 100MB
