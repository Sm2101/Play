# --- Simple Telegram Quiz Bot for Render ---
from flask import Flask
from threading import Thread
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
import requests, os

# Telegram Bot Token from Render Environment
TOKEN = os.getenv("BOT_TOKEN")

# --- Flask mini server (keeps Render alive) ---
app = Flask(__name__)
@app.route('/')
def home():
    return "Bot is running!"

def run_flask():
    app.run(host="0.0.0.0", port=10000)

# --- Telegram Bot Handlers ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("👋 Hello! Send me a PDF and I’ll make quiz questions from it!")

async def handle_pdf(update: Update, context: ContextTypes.DEFAULT_TY
