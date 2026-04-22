# 🧠 Psycho Grinder Bot

A Telegram bot with a gamified progression system where users can upgrade stats, unlock achievements, and compete on a global leaderboard.

---

## ⚙️ About the Project

Psycho Grinder Bot is a lightweight gamification system that transforms user activity into progression:

- actions → points  
- points → stat growth  
- stats → achievements  
- everything → competitive leaderboard  

This project is purely fictional and gamified. It does not represent or simulate real psychological or medical systems.

---

## 🎮 Features

- 📈 Progression / grinding system  
- 🏆 Achievement system  
- 🥇 Global leaderboard  
- 👤 User profiles with detailed stats  
- 🔄 Persistent data storage  
- ⚡ Fast Node.js backend  
- 🗄️ PostgreSQL database  

---

## 🧩 Tech Stack

- Node.js  
- Telegraf (Telegram Bot API)  
- PostgreSQL  
- pg (node-postgres)  
- dotenv  

---

## 📦 Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/zodiaqqc/psycho_bot.git
cd psycho_bot
````

### 2. Install dependencies
- npm install

## 🔐 Environment Variables

Create a .env file in the root directory:

BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=your_postgres_connection_string

## ▶️ Running the Bot
Development / Production start
npm start
### 🗄️ Database

The bot uses PostgreSQL as its main database.

It stores:

user profiles
statistics
achievements
leaderboard data
progression history
