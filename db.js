const { Pool } = require('pg');

const databaseUrl = (process.env.DATABASE_URL || '').trim();
const pgEnvConfig = {
  host: (process.env.PGHOST || '').trim(),
  user: (process.env.PGUSER || '').trim(),
  password: process.env.PGPASSWORD || '',
  database: (process.env.PGDATABASE || '').trim(),
  port: Number(process.env.PGPORT || 5432),
};
const hasFullPgEnvConfig =
  Boolean(pgEnvConfig.host) &&
  Boolean(pgEnvConfig.user) &&
  Boolean(pgEnvConfig.password) &&
  Boolean(pgEnvConfig.database);

if (!databaseUrl && !hasFullPgEnvConfig) {
  throw new Error('PostgreSQL connection is not configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE.');
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
  const connectionPath = hasFullPgEnvConfig ? 'PG_ENV' : 'DATABASE_URL';
  const debug = {
    connectionPath,
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

  if (hasFullPgEnvConfig) {
    debug.resolvedHost = pgEnvConfig.host;
    debug.resolvedUser = pgEnvConfig.user;
    debug.resolvedDatabase = pgEnvConfig.database;
  } else {
    try {
      const parsed = new URL(databaseUrl);
      debug.resolvedHost = parsed.hostname || '(missing)';
      debug.resolvedUser = parsed.username || '(missing)';
      debug.resolvedDatabase = (parsed.pathname || '/').replace(/^\//, '') || '(missing)';
    } catch (err) {
      debug.connectionPath = 'DATABASE_URL (invalid format)';
    }
  }

  return debug;
}

const connectionDebug = resolveConnectionDebug();
console.log('[db] Connection configuration:', connectionDebug);
if (!hasFullPgEnvConfig && (connectionDebug.pgEnv.PGHOST || connectionDebug.pgEnv.PGUSER || connectionDebug.pgEnv.PGDATABASE || connectionDebug.pgEnv.PGPASSWORD)) {
  console.log('[db] PG* env vars are partially set. Falling back to DATABASE_URL.');
}

const basePoolOptions = {
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
};
const pool = hasFullPgEnvConfig
  ? new Pool({
      ...basePoolOptions,
      host: pgEnvConfig.host,
      port: pgEnvConfig.port,
      user: pgEnvConfig.user,
      password: pgEnvConfig.password,
      database: pgEnvConfig.database,
    })
  : new Pool({
      ...basePoolOptions,
      connectionString: databaseUrl,
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