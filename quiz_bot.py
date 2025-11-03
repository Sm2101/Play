import os
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters
import PyPDF2

# Logging (so we can see messages in Render logs)
logging.basicConfig(level=logging.INFO)
print("🚀 Starting bot on Render...")

# Get your token (from environment or direct value)
TOKEN = os.getenv("BOT_TOKEN")  # safer way

if not TOKEN:
    print("❌ ERROR: BOT_TOKEN not found! Please set it in Render Environment.")
    exit()

# Define /start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("👋 Hi! Send me a PDF with questions, and I’ll show one sample question from it.")

# When user sends a PDF
async def handle_pdf(update: Update, context: ContextTypes.DEFAULT_TYPE):
    file = await update.message.document.get_file()
    await file.download_to_drive("questions.pdf")

    # Extract text from PDF
    text = ""
    with open("questions.pdf", "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text()

    # Find and send first question-like line
    for line in text.split("\n"):
        if "?" in line:
            await update.message.reply_text(f"❓ {line}")
            break
    else:
        await update.message.reply_text("No question found in the PDF 😢")

# Create and run the bot
app = ApplicationBuilder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(MessageHandler(filters.Document.PDF, handle_pdf))

print("✅ Bot setup done. Polling now...")
app.run_polling()
