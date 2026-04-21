const { upsertUser } = require('../services/userService');
const { getUserAchievements } = require('../services/achievementService');
 
async function achievementsCommand(ctx) {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || null;
    const displayName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || String(userId);
    await upsertUser(userId, username, displayName);
 
    const { owned, total } = await getUserAchievements(userId);
 
    if (!owned.length) {
      return ctx.reply(
        `🎖 Твои ачивки: 0 / ${total}\n\n` +
        `Пока пусто. Используй /psycho — возможно повезёт!`
      );
    }
 
    const list = owned.map((name) => `• ${name}`).join('\n');
 
    return ctx.reply(
      `🎖 Твои ачивки: ${owned.length} / ${total}\n\n` +
      list
    );
  } catch (err) {
    console.error('Ошибка в /achievements:', err);
    return ctx.reply('❌ Не удалось загрузить ачивки.');
  }
}
 
module.exports = achievementsCommand;