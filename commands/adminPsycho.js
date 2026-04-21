const { Markup } = require('telegraf');
const { upsertUser, getChatUserStat, adminAddPsychoCount, adminSetPsychoCount } = require('../services/userService');

// Только эти пользователи имеют доступ
const ALLOWED_USERS = [
  2080755014, // @cuJka
  1976302841  // @princofpain
];

const ACTIONS = [
  [{ label: '➕ 1', action: 'add', value: 1 }, { label: '➕ 5', action: 'add', value: 5 }, { label: '➕ 10', action: 'add', value: 10 }],
  [{ label: '➖ 1', action: 'sub', value: 1 }, { label: '➖ 5', action: 'sub', value: 5 }, { label: '➖ 10', action: 'sub', value: 10 }],
  [{ label: '♻️ Обнулить', action: 'reset', value: 0 }],
];

function getDisplayName(from) {
  return [from.first_name, from.last_name].filter(Boolean).join(' ') || String(from.id);
}

function buildKeyboard(chatId, userId) {
  return Markup.inlineKeyboard(
    ACTIONS.map((row) =>
      row.map((btn) =>
        Markup.button.callback(btn.label, `psyadmin:${chatId}:${userId}:${btn.action}:${btn.value}`)
      )
    )
  );
}

// Проверка доступа
function isAllowedUser(ctx) {
  return ALLOWED_USERS.includes(ctx.from.id);
}

async function adminPsychoCommand(ctx) {
  try {
    if (!['group', 'supergroup'].includes(ctx.chat.type)) {
      return ctx.reply('⚠️ Эта панель работает только в группах.');
    }

    if (!isAllowedUser(ctx)) {
      return ctx.reply('⛔ У тебя нет доступа к этой панели.');
    }

    const target = ctx.message.reply_to_message?.from;
    if (!target) {
      return ctx.reply('ℹ️ Ответь командой /psyadmin на сообщение нужного пользователя.');
    }

    const displayName = getDisplayName(target);
    await upsertUser(target.id, target.username || null, displayName);
    const stat = await getChatUserStat(ctx.chat.id, target.id);

    return ctx.reply(
      `🛠 <b>Админ-панель псих-очков</b>\n` +
      `👤 Пользователь: <b>${displayName}</b>\n` +
      `📊 Сейчас: <b>${stat.psycho_count}</b>`,
      {
        parse_mode: 'HTML',
        ...buildKeyboard(ctx.chat.id, target.id),
      }
    );
  } catch (err) {
    console.error('Ошибка в /psyadmin:', err);
    return ctx.reply('❌ Не удалось открыть админ-панель.');
  }
}

async function adminPsychoAction(ctx) {
  try {
    const [, rawChatId, rawUserId, action, rawValue] = ctx.callbackQuery.data.split(':');
    const chatId = Number(rawChatId);
    const userId = Number(rawUserId);
    const value = Number(rawValue);

    if (ctx.chat.id !== chatId) {
      return ctx.answerCbQuery('Панель не из этого чата.', { show_alert: true });
    }

    if (!isAllowedUser(ctx)) {
      return ctx.answerCbQuery('Нет доступа.', { show_alert: true });
    }

    if (action === 'add') await adminAddPsychoCount(chatId, userId, value);
    if (action === 'sub') await adminAddPsychoCount(chatId, userId, -value);
    if (action === 'reset') await adminSetPsychoCount(chatId, userId, 0);

    const stat = await getChatUserStat(chatId, userId);
    const user = await ctx.telegram.getChatMember(chatId, userId);
    const displayName = getDisplayName(user.user);

    await upsertUser(userId, user.user.username || null, displayName);

    await ctx.editMessageText(
      `🛠 <b>Админ-панель псих-очков</b>\n` +
      `👤 Пользователь: <b>${displayName}</b>\n` +
      `📊 Сейчас: <b>${stat.psycho_count}</b>`,
      {
        parse_mode: 'HTML',
        ...buildKeyboard(chatId, userId),
      }
    );

    return ctx.answerCbQuery('Готово');
  } catch (err) {
    console.error('Ошибка в админ-кнопке:', err);
    return ctx.answerCbQuery('Ошибка', { show_alert: true });
  }
}

module.exports = { adminPsychoCommand, adminPsychoAction };