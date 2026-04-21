const { getDb, saveDb } = require('../db');
 
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
  const res = db.exec(
    'SELECT name FROM achievements WHERE user_id = ? ORDER BY id ASC',
    [userId]
  );
  if (!res.length) return [];
  return res[0].values.map((r) => r[0]);
}
 
async function grantRandomAchievement(userId) {
  const owned = await getOwnedAchievements(userId);
  const available = ACHIEVEMENTS.filter((a) => !owned.includes(a));
  if (!available.length) return null;
 
  const name = available[Math.floor(Math.random() * available.length)];
  const db = await getDb();
  db.run('INSERT INTO achievements (user_id, name) VALUES (?, ?)', [userId, name]);
  saveDb();
  return name;
}
 
async function getUserAchievements(userId) {
  const owned = await getOwnedAchievements(userId);
  return {
    owned,
    total: ACHIEVEMENTS.length,
  };
}
 
module.exports = { grantRandomAchievement, getUserAchievements };