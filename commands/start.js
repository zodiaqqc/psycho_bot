const { upsertUser } = require('../services/userService');
 
async function startCommand(ctx) {
  try {
    if (ctx.chat.type !== 'private') {
      return ctx.reply('👤 Напиши мне в личные сообщения, чтобы зарегистрироваться!');
    }
 
    const userId = ctx.from.id;
    const username = ctx.from.username || null;
    const displayName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || String(userId);
 
    const { created } = await upsertUser(userId, username, displayName);
 
    if (created) {
      return ctx.reply(
        `🎉 Добро пожаловать, ${displayName}!\n\n` +
        `Ты зарегистрирован в психо-гриндилке.\n\n` +
        `📋 Команды:\n` +
        `/psycho — сойти с ума\n` +
        `/top — таблица лидеров\n` +
        `/profile — твой профиль и ачивки`
      );
    }
 
    return ctx.reply(
      `👋 Ты уже зарегистрирован, ${displayName}!\n\n` +
      `📋 Команды:\n` +
      `/psycho — сойти с ума\n` +
      `/top — таблица лидеров\n` +
      `/profile — твой профиль и ачивки`
    );
  } catch (err) {
    console.error('Ошибка в /start:', err);
    return ctx.reply('❌ Произошла ошибка. Попробуй ещё раз.');
  }
}
 
module.exports = startCommand;