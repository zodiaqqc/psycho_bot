const { upsertUser } = require('../services/userService');
const { grantCustomAchievement } = require('../services/achievementService');

const ALLOWED_USERS = [
  2080755014,
  1976302841,
];

function getDisplayName(from) {
  return [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || String(from.id);
}

function extractAchievementName(text) {
  const parts = String(text || '').trim().split(/\s+/);
  if (parts.length <= 1) return null;
  const rest = text.replace(/^\/give_achievement(@\w+)?/i, '').trim();
  const quoteMatch = rest.match(/"([^"]{1,80})"/);
  if (quoteMatch) return quoteMatch[1].trim();
  return rest.slice(0, 80).trim() || null;
}

async function giveAchievementCommand(ctx) {
  try {
    if (!ALLOWED_USERS.includes(ctx.from.id)) {
      return ctx.reply('⛔ У тебя нет доступа к этой команде.');
    }

    const target = ctx.message.reply_to_message?.from;
    if (!target) {
      return ctx.reply('ℹ️ Ответь на сообщение пользователя: /give_achievement "❗Блатной❗"');
    }

    const name = extractAchievementName(ctx.message.text);
    if (!name) {
      return ctx.reply('⚠️ Укажи название ачивки в кавычках. Пример: /give_achievement "❗Блатной❗"');
    }

    const targetDisplayName = getDisplayName(target);
    await upsertUser(target.id, target.username || null, targetDisplayName);
    await grantCustomAchievement(target.id, name);

    return ctx.reply(`✅ ${targetDisplayName} получил ачивку: ${name}`);
  } catch (err) {
    console.error('Ошибка в /give_achievement:', err);
    return ctx.reply('❌ Не удалось выдать ачивку.');
  }
}

module.exports = giveAchievementCommand;
