const { Pool } = require('pg');

const databaseUrl = (process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. PostgreSQL connection is not configured.');
}

function maskConnectionUrl(value) {
  if (!value) return '(empty)';
  try {
    const parsed = new URL(value);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch (err) {
    return '(invalid URL format)';
  }
}

function resolveConnectionDebug() {
  const debug = {
    connectionPath: 'DATABASE_URL',
    databaseUrlMasked: maskConnectionUrl(databaseUrl),
    resolvedHost: '(unresolved)',
    resolvedUser: '(unresolved)',
    resolvedDatabase: '(unresolved)',
    pgEnv: {
      PGHOST: process.env.PGHOST || null,
      PGUSER: process.env.PGUSER || null,
      PGPASSWORD: process.env.PGPASSWORD ? '***' : null,
      PGDATABASE: process.env.PGDATABASE || null,
    },
  };

  try {
    const parsed = new URL(databaseUrl);
    debug.resolvedHost = parsed.hostname || '(missing)';
    debug.resolvedUser = parsed.username || '(missing)';
    debug.resolvedDatabase = (parsed.pathname || '/').replace(/^\//, '') || '(missing)';
  } catch (err) {
    debug.connectionPath = 'DATABASE_URL (invalid format)';
  }

  return debug;
}

const connectionDebug = resolveConnectionDebug();
console.log('[db] Connection configuration:', connectionDebug);
if (connectionDebug.pgEnv.PGHOST || connectionDebug.pgEnv.PGUSER || connectionDebug.pgEnv.PGDATABASE || connectionDebug.pgEnv.PGPASSWORD) {
  console.log('[db] PG* env vars are set, but Pool uses explicit DATABASE_URL.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

function getDb() {
  return pool;
}

async function initDb() {
  const db = getDb();

  await db.query('SELECT 1');

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

  console.log('✅ PostgreSQL initialized');
}

module.exports = { getDb, initDb };