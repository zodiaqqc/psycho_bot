const { getDb } = require('../db');
 
const ACHIEVEMENTS = [
  '🧠 Голоса в голове',
  '🌀 Потеря реальности',
  '👾 Цифровой глюк',
  '🕯️ Свет в темноте',
  '🐍 Тени шепчут',
  '🎭 Раздвоение личности',
  '🌙 Ночной кошмар',
  '🔮 Вещий сон',
  '⚡ Шизофрения',
  '🫧 Пузырь реальности',
  '🎪 Цирк в черепной коробке',
  '🪬 Сглаз третьего глаза',
  '🕳️ Кроличья нора',
  '📡 Ты не один',
  '🧿 Кто-то смотрит',
];
 
async function getOwnedAchievements(userId) {
  const db = await getDb();
  const res = await db.query(
    'SELECT name FROM achievements WHERE user_id = $1 ORDER BY id ASC',
    [userId]
  );
  return res.rows.map((r) => r.name);
}
 
async function grantRandomAchievement(userId) {
  const owned = await getOwnedAchievements(userId);
  const available = ACHIEVEMENTS.filter((a) => !owned.includes(a));
  if (!available.length) return null;
 
  const name = available[Math.floor(Math.random() * available.length)];
  const db = await getDb();
  await db.query('INSERT INTO achievements (user_id, name) VALUES ($1, $2)', [userId, name]);
  return name;
}
 
async function getUserAchievements(userId) {
  const owned = await getOwnedAchievements(userId);
  return {
    owned,
    total: ACHIEVEMENTS.length,
  };
}

async function getRecentUserAchievements(userId, limit = 5) {
  const db = await getDb();
  const res = await db.query(
    'SELECT name FROM achievements WHERE user_id = $1 ORDER BY id DESC LIMIT $2',
    [userId, limit]
  );
  return res.rows.map((r) => r.name);
}

async function grantCustomAchievement(userId, name) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const db = await getDb();
  await db.query('INSERT INTO achievements (user_id, name) VALUES ($1, $2)', [userId, cleanName]);
  return cleanName;
}

async function getUserAchievementsWithIds(userId) {
  const db = await getDb();
  const res = await db.query(
    'SELECT id, name FROM achievements WHERE user_id = $1 ORDER BY id ASC',
    [userId]
  );
  return res.rows;
}

async function deleteUserAchievementByIndex(userId, index) {
  const list = await getUserAchievementsWithIds(userId);
  const target = list[index - 1];
  if (!target) return null;

  const db = await getDb();
  await db.query('DELETE FROM achievements WHERE id = $1 AND user_id = $2', [target.id, userId]);
  return target;
}
 
module.exports = {
  grantRandomAchievement,
  getUserAchievements,
  getRecentUserAchievements,
  grantCustomAchievement,
  getUserAchievementsWithIds,
  deleteUserAchievementByIndex,
};