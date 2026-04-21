const { getDb } = require('../db');
 
async function getUser(userId) {
  const db = await getDb();
  const res = await db.query('SELECT id, username, display_name FROM users WHERE id = $1', [userId]);
  return res.rows[0] || null;
}
 
async function upsertUser(userId, username, displayName) {
  const db = await getDb();
  const res = await db.query(
    `INSERT INTO users (id, username, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (id)
     DO UPDATE SET username = EXCLUDED.username, display_name = EXCLUDED.display_name
     RETURNING (xmax = 0) AS inserted`,
    [userId, username || null, displayName || null]
  );
  return { created: Boolean(res.rows[0]?.inserted) };
}
 
async function ensureChatStat(chatId, userId) {
  const db = await getDb();
  await db.query(
    `INSERT INTO psycho_stats (chat_id, user_id, psycho_count, last_used)
     VALUES ($1, $2, 0, 0)
     ON CONFLICT (chat_id, user_id) DO NOTHING`,
    [chatId, userId]
  );
}

async function getChatUserStat(chatId, userId) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  const res = await db.query(
    'SELECT psycho_count, last_used FROM psycho_stats WHERE chat_id = $1 AND user_id = $2',
    [chatId, userId]
  );
  if (!res.rowCount) {
    return { psycho_count: 0, last_used: 0 };
  }
  return res.rows[0];
}

async function addPsychoCount(chatId, userId, amount) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  await db.query(
    'UPDATE psycho_stats SET psycho_count = psycho_count + $1, last_used = $2 WHERE chat_id = $3 AND user_id = $4',
    [amount, Date.now(), chatId, userId]
  );
}
 
async function updateLastUsed(chatId, userId) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  await db.query(
    'UPDATE psycho_stats SET last_used = $1 WHERE chat_id = $2 AND user_id = $3',
    [Date.now(), chatId, userId]
  );
}
 
async function adminSetPsychoCount(chatId, userId, count) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  await db.query(
    'UPDATE psycho_stats SET psycho_count = $1 WHERE chat_id = $2 AND user_id = $3',
    [Math.max(0, count), chatId, userId]
  );
}

async function adminAddPsychoCount(chatId, userId, delta) {
  const current = await getChatUserStat(chatId, userId);
  await adminSetPsychoCount(chatId, userId, current.psycho_count + delta);
}

async function getTopUsers(chatId, limit = 10) {
  const db = await getDb();
  const res = await db.query(
    `SELECT u.id, u.username, u.display_name, s.psycho_count
     FROM psycho_stats s
     JOIN users u ON u.id = s.user_id
     WHERE s.chat_id = $1
     ORDER BY s.psycho_count DESC
     LIMIT $2`,
    [chatId, limit]
  );
  return res.rows;
}
 
module.exports = {
  getUser,
  upsertUser,
  getChatUserStat,
  addPsychoCount,
  updateLastUsed,
  getTopUsers,
  adminSetPsychoCount,
  adminAddPsychoCount,
};