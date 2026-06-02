"""
EazyScan local Whisper transcription service.

Provides POST /transcribe (multipart form, field "file") -> { "text": "..." }.
Used by the Next.js app when the user picks the "Local Whisper" provider.

Run:
    cd python
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --port 8000 --reload

Then set PYTHON_WHISPER_URL=http://localhost:8000 in the Next.js .env.local
"""

import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "large-v3")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")

# Biases the decoder toward Thai output + business/requirement vocabulary so it
# stops code-switching Thai words to English (e.g. "หมูปิ้ง" -> "Moving").
INITIAL_PROMPT = os.environ.get(
    "WHISPER_INITIAL_PROMPT",
    "นี่คือบันทึกการประชุมเก็บความต้องการของลูกค้าเป็นภาษาไทย "
    "พูดถึงธุรกิจ ร้านค้า ทำเล สินค้า ระบบงาน และการให้บริการ "
    "เช่น หมูปิ้ง ร้านกาแฟ คลินิก ออเดอร์ สต็อก แดชบอร์ด",
)

app = FastAPI(title="EazyScan Whisper")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE)
    return _model


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL_SIZE}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)) -> dict:
    if file is None:
        raise HTTPException(status_code=400, detail="no file")

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        model = get_model()
        # language="th" biases the model toward Thai; remove to auto-detect.
        # beam_size + no condition_on_previous_text improves Thai accuracy and
        # avoids runaway repetition on noisy audio.
        segments, _info = model.transcribe(
            tmp_path,
            language="th",
            task="transcribe",
            beam_size=5,
            best_of=5,
            temperature=0.0,
            vad_filter=True,
            condition_on_previous_text=False,
            initial_prompt=INITIAL_PROMPT,
        )
        text = "".join(seg.text for seg in segments).strip()
        return {"text": text}
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
