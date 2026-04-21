const { getDb, saveDb } = require('../db');
 
async function getUser(userId) {
  const db = await getDb();
  const res = db.exec('SELECT * FROM users WHERE id = ?', [userId]);
  if (!res.length || !res[0].values.length) return null;
  const [id, username, display_name] = res[0].values[0];
  return { id, username, display_name };
}
 
async function upsertUser(userId, username, displayName) {
  const db = await getDb();
  const existing = await getUser(userId);
  if (existing) {
    db.run(
      'UPDATE users SET username = ?, display_name = ? WHERE id = ?',
      [username || null, displayName || null, userId]
    );
    saveDb();
    return { created: false };
  }
  db.run(
    'INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)',
    [userId, username || null, displayName || null]
  );
  saveDb();
  return { created: true };
}
 
async function ensureChatStat(chatId, userId) {
  const db = await getDb();
  db.run(
    'INSERT OR IGNORE INTO psycho_stats (chat_id, user_id, psycho_count, last_used) VALUES (?, ?, 0, 0)',
    [chatId, userId]
  );
}

async function getChatUserStat(chatId, userId) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  const res = db.exec(
    'SELECT psycho_count, last_used FROM psycho_stats WHERE chat_id = ? AND user_id = ?',
    [chatId, userId]
  );
  if (!res.length || !res[0].values.length) {
    return { psycho_count: 0, last_used: 0 };
  }
  const [psycho_count, last_used] = res[0].values[0];
  return { psycho_count, last_used };
}

async function addPsychoCount(chatId, userId, amount) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  db.run(
    'UPDATE psycho_stats SET psycho_count = psycho_count + ?, last_used = ? WHERE chat_id = ? AND user_id = ?',
    [amount, Date.now(), chatId, userId]
  );
  saveDb();
}
 
async function updateLastUsed(chatId, userId) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  db.run(
    'UPDATE psycho_stats SET last_used = ? WHERE chat_id = ? AND user_id = ?',
    [Date.now(), chatId, userId]
  );
  saveDb();
}
 
async function adminSetPsychoCount(chatId, userId, count) {
  const db = await getDb();
  await ensureChatStat(chatId, userId);
  db.run(
    'UPDATE psycho_stats SET psycho_count = ? WHERE chat_id = ? AND user_id = ?',
    [Math.max(0, count), chatId, userId]
  );
  saveDb();
}

async function adminAddPsychoCount(chatId, userId, delta) {
  const current = await getChatUserStat(chatId, userId);
  await adminSetPsychoCount(chatId, userId, current.psycho_count + delta);
}

async function getTopUsers(chatId, limit = 10) {
  const db = await getDb();
  const res = db.exec(
    `SELECT u.id, u.username, u.display_name, s.psycho_count
     FROM psycho_stats s
     JOIN users u ON u.id = s.user_id
     WHERE s.chat_id = ?
     ORDER BY s.psycho_count DESC
     LIMIT ?`,
    [chatId, limit]
  );
  if (!res.length) return [];
  return res[0].values.map(([id, username, display_name, psycho_count]) => ({
    id,
    username,
    display_name,
    psycho_count,
  }));
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