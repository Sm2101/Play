import os
import logging
import pdfplumber
import re
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters
)
from flask import Flask, request

# Logging for debug
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Telegram Bot Token (from Render environment variable)
BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    raise ValueError("❌ BOT_TOKEN not found! Please set it in Render environment.")

# Flask app (for webhook keep-alive)
flask_app = Flask(__name__)

# Telegram app
application = Application.builder().token(BOT_TOKEN).build()


# 🟢 Function to extract questions from PDF
def extract_questions_from_pdf(pdf_path):
    questions = []
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())

    # Split based on question numbers like Q1, Q2, etc.
    raw_questions = re.split(r'\bQ\d+\b', text)
    for q in raw_questions:
        q = q.strip()
        if len(q) < 20:
            continue

        # Extract options like (A), (B), (C), (D)
        opts = re.findall(r'\([A-D]\).*?(?=\([A-D]\)|$)', q, re.DOTALL)
        question_text = re.sub(r'\([A-D]\).*', '', q).strip()

        if opts:
            questions.append({
                "question": question_text,
                "options": opts
            })

    return questions


# 🟢 Start Command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("👋 Hello! Send me a PDF and I’ll create quiz questions from it.")


# 🟢 Handle PDF Upload
async def handle_pdf(update: Update, context: ContextTypes.DEFAULT_TYPE):
    pdf_file = await update.message.document.get_file()
    pdf_path = f"/tmp/{update.message.document.file_name}"
    await pdf_file.download_to_drive(pdf_path)

    await update.message.reply_text("✅ Got your PDF! Generating quiz...")

    questions = extract_questions_from_pdf(pdf_path)
    if not questions:
        await update.message.reply_text("❌ No valid questions found in this PDF.")
        return

    await update.message.reply_text("📘 Example quiz extract:")
    for q in questions[:3]:
        formatted = f"*Question:*\n{q['question']}\n\n" + "\n".join(q['options'])
        await update.message.reply_text(formatted, parse_mode="Markdown")

    await update.message.reply_text("✅ Done! Interactive quiz feature coming next...")


# 🟢 Add handlers
application.add_handler(CommandHandler("start", start))
application.add_handler(MessageHandler(filters.Document.PDF, handle_pdf))


# 🟢 Flask route for Render ping
@flask_app.route('/')
def home():
    return "Quiz Bot is running!", 200


# 🟢 Webhook setup (for Render)
if __name__ == '__main__':
    import threading

    # Run Flask on a separate thread
    def run_flask():
        flask_app.run(host="0.0.0.0", port=10000)

    threading.Thread(target=run_flask).start()

    PORT = int(os.environ.get("PORT", 10000))
    RENDER_EXTERNAL_URL = os.environ.get("RENDER_EXTERNAL_URL", "https://your-render-url.onrender.com")

    application.run_webhook(
        listen="0.0.0.0",
        port=PORT,
        url_path=BOT_TOKEN,
        webhook_url=f"{RENDER_EXTERNAL_URL}/{BOT_TOKEN}"
    )
