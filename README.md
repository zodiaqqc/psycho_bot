# 🧠 Psycho Grinder Bot

A Telegram bot with a gamified progression system where users grind stats, unlock achievements, and compete on a global leaderboard.

---

## ⚙️ About the project

Psycho Grinder Bot is a gamified system that turns user activity into progression:

- users earn points through actions
- points increase stats
- stats unlock achievements
- users compete on a leaderboard

This is a purely gamified system (no medical or psychological claims).

---

## 🎮 Features

- 📈 Grinding / progression system
- 🏆 Achievement system
- 🥇 Global leaderboard
- 👤 User profiles with stats
- 🔄 Persistent progress tracking
- ⚡ Lightweight Node.js backend

---

## 🧩 Tech Stack

- Node.js
- Telegraf (Telegram Bot API)
- SQLite (`psycho.db`)
- dotenv

---

## 🚀 Installation

```bash
git clone https://github.com/zodiaqqc/psycho_bot.git
cd psycho_bot
npm install
```

## 🔐 Environment variables

- Create a .env file in the root directory:
BOT_TOKEN=your_telegram_bot_token

- Run the bot
npm start

## 🗄️ Database

- The bot uses SQLite for local storage:

- user stats
- achievements
- leaderboard data

- File: psycho.db
