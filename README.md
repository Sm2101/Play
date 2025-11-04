# Telegram PDF -> MCQ Quiz Bot (ready for Render)

## What this does
- Parses PDF files for MCQ-style questions (A–D), attaches images from the same page if available.
- Presents each question as Telegram inline-buttons.
- Tracks score and sends a final report + CSV.
- Supports optional `answer_key.csv` in repo with rows: `q_number,answer_letter` (1-based q_number).

## Files
- `quiz_bot.py` — main bot code.
- `requirements.txt` — Python deps.
- `runtime.txt` — Python runtime for Render.

## Deploy on Render (quick)
1. Create a new **Web Service** on Render (Connect GitHub → your repo).
2. Set **Start Command** to:
