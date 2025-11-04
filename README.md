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
3. Add Environment Variable:
- `BOT_TOKEN` = `<your Telegram token from @BotFather>`
4. Deploy (Manual Deploy → Clear build cache → Deploy latest commit).

**Alternative**: convert the service to a **Background Worker** instead of Web Service; then you don't need Flask. (If you keep Web Service, Flask runs on port 10000 to satisfy Render.)

## Usage
1. Open the bot in Telegram and send `/start`.
2. Upload a PDF file containing questions (numbered or question lines with options A-D).
3. The bot will parse, start the quiz, show questions and image if available, record answers, and at the end provide a CSV report.

## Tips
- PDF formatting matters: numbered questions, or lines with `A)` `B)` `C)` `D)` work best.
- For best results on JEE-style papers, PDF must include options on separate lines or as inline letter markers.
- To provide an exact answer key, add `answer_key.csv` to the repo with `q_number,answer_letter` per line.

## Next improvements (optional)
- Use an LLM to auto-generate distractors or infer correct answers.
- Store sessions in Redis for persistence and scale.
- Convert to webhook for higher throughput.
