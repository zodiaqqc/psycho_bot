const { upsertUser, getChatUserStat, addPsychoCount } = require('../services/userService');
const { grantRandomAchievement } = require('../services/achievementService');
 
const COOLDOWN_MS = 60 * 60 * 1000; // 1 час
const ACHIEVEMENT_CHANCE = 0.15;

function getDisplayName(from) {
  return [from.first_name, from.last_name].filter(Boolean).join(' ') || String(from.id);
}

function formatDuration(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}ч ${minutes}м`;
  if (hours > 0) return `${hours}ч`;
  return `${minutes}м`;
}
 
async function psychoCommand(ctx) {
  try {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const username = ctx.from.username || null;
    const displayName = getDisplayName(ctx.from);
    await upsertUser(userId, username, displayName);
    const stat = await getChatUserStat(chatId, userId);

    const now     = Date.now();
    const elapsed = now - (stat.last_used || 0);

    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed;
      return ctx.reply(
        `⏳ <b>${displayName}</b>, нужно подождать: <b>${formatDuration(remainingMs)}</b>`,
        { parse_mode: 'HTML' }
      );
    }

    const gained = Math.floor(Math.random() * 10) + 1;
    await addPsychoCount(chatId, userId, gained);
    const updated = await getChatUserStat(chatId, userId);
    const total = updated.psycho_count;

    if (Math.random() < ACHIEVEMENT_CHANCE) {
      const achievement = await grantRandomAchievement(userId);
      if (achievement) {
        return ctx.reply(
          `🧠 <b>${displayName}</b> словил психо-бафф!\n` +
          `➕ <b>${gained}</b> расстройств\n` +
          `🎖 <b>Ачивка:</b> ${achievement}\n` +
          `📊 <b>Итого в этом чате:</b> ${total}`,
          { parse_mode: 'HTML' }
        );
      }
    }

    return ctx.reply(
      `😵 <b>${displayName}</b> снова сошел с ума\n` +
      `➕ <b>${gained}</b> расстройств\n` +
      `📊 <b>Итого в этом чате:</b> ${total}`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error('Ошибка в /psycho:', err);
    return ctx.reply('❌ Что-то пошло не так.');
  }
}
 
module.exports = psychoCommand;