const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

function getDb() {
  return pool;
}

async function initDb() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      username TEXT,
      display_name TEXT
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS psycho_stats (
      chat_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      psycho_count INTEGER NOT NULL DEFAULT 0,
      last_used BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (chat_id, user_id)
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );
  `);
  console.log('✅ PostgreSQL инициализирован');
}

module.exports = { getDb, initDb };