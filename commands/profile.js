const { getUser, upsertUser, getChatUserStat, getUserRank } = require('../services/userService');
const { getUserAchievements, getRecentUserAchievements } = require('../services/achievementService');

function getDisplayName(from) {
  return [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || String(from.id);
}

async function profileCommand(ctx) {
  try {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const existing = await getUser(userId);

    if (!existing) {
      return ctx.reply('⚠️ Сначала зарегистрируйся через /start в личке с ботом.');
    }

    const username = ctx.from.username || null;
    const displayName = getDisplayName(ctx.from);
    await upsertUser(userId, username, displayName);

    const stat = await getChatUserStat(chatId, userId);
    const rank = await getUserRank(chatId, userId);
    const { owned } = await getUserAchievements(userId);
    const recent = await getRecentUserAchievements(userId, 5);

    const achievementsList = owned.length
      ? recent.map((item) => `• ${item}`).join('\n')
      : '• нет ачивок';

    return ctx.reply(
      `👤 ${displayName}\n` +
      `🧠 Психи: ${stat.psycho_count}\n` +
      `🏆 Топ: ${rank ? `#${rank}` : '—'}\n` +
      `🎖 Ачивки: ${owned.length}\n` +
      `${achievementsList}`
    );
  } catch (err) {
    console.error('Ошибка в /profile:', err);
    return ctx.reply('❌ Не удалось загрузить профиль.');
  }
}

module.exports = profileCommand;
