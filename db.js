const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
 
const DB_PATH = path.join(__dirname, 'psycho.db');
 
let db;
 
async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}
 
function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}
 
async function initDb() {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      display_name TEXT
    );
    CREATE TABLE IF NOT EXISTS psycho_stats (
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      psycho_count INTEGER DEFAULT 0,
      last_used INTEGER DEFAULT 0,
      PRIMARY KEY (chat_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL
    );
  `);
  try {
    db.run('ALTER TABLE users ADD COLUMN display_name TEXT');
  } catch (_) {
    // Колонка уже существует в старой базе.
  }
  saveDb();
  console.log('✅ База данных инициализирована');
}
 
module.exports = { getDb, saveDb, initDb };