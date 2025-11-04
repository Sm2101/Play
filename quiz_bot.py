import os
import pdfplumber
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder, CommandHandler, MessageHandler, filters,
    CallbackQueryHandler, ContextTypes
)

BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    raise ValueError("❌ BOT_TOKEN not found! Please set it in Render Environment.")

# Step 1: Start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Send me a PDF containing questions, and I'll turn it into a quiz!"
    )

# Step 2: Handle PDF uploads
async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    file = await update.message.document.get_file()
    file_path = "uploaded.pdf"
    await file.download_to_drive(file_path)

    # Extract text from PDF
    text = extract_text_from_pdf(file_path)
    questions = extract_questions(text)

    if not questions:
        await update.message.reply_text("😕 No questions found in that PDF.")
        return

    context.user_data["questions"] = questions
    context.user_data["score"] = 0
    context.user_data["current"] = 0

    await send_next_question(update, context)

# Step 3: Extract text
def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

# Step 4: Simple question extraction
def extract_questions(text):
    lines = text.split("\n")
    questions = [line.strip() for line in lines if "?" in line and len(line.split()) > 3]
    # Limit to first 5 questions
    return questions[:5]

# Step 5: Send quiz question
async def send_next_question(update, context):
    idx = context.user_data["current"]
    questions = context.user_data["questions"]

    if idx >= len(questions):
        score = context.user_data["score"]
        await update.message.reply_text(f"🎉 Quiz complete! Your score: {score}/{len(questions)}")
        return

    q = questions[idx]
    # Fake options for demo (you can later extract real ones)
    options = ["Option A", "Option B", "Option C", "Option D"]

    keyboard = [
        [InlineKeyboardButton(opt, callback_data=opt)] for opt in options
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(f"Q{idx+1}. {q}", reply_markup=reply_markup)

# Step 6: Handle answers
async def button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    context.user_data["score"] += 1  # For now, always count as correct
    context.user_data["current"] += 1

    await query.edit_message_text(f"✅ Answer received!")
    await send_next_question(query, context)

# Step 7: Run bot
if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.Document.PDF, handle_document))
    app.add_handler(CallbackQueryHandler(button))

    print("🚀 Bot running...")
    app.run_polling()

