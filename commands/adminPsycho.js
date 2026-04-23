const { Markup } = require('telegraf');
const { upsertUser, getChatUserStat, adminAddPsychoCount, adminSetPsychoCount } = require('../services/userService');
const {
  grantCustomAchievement,
  getUserAchievementsWithIds,
  deleteUserAchievementByIndex,
} = require('../services/achievementService');

// Только эти пользователи имеют доступ
const ALLOWED_USERS = [
  2080755014, // @cuJka
  1976302841  // @princofpain
];

const ACTIONS = [
  [{ label: '➕ 1', action: 'add', value: 1 }, { label: '➕ 5', action: 'add', value: 5 }, { label: '➕ 10', action: 'add', value: 10 }],
  [{ label: '➖ 1', action: 'sub', value: 1 }, { label: '➖ 5', action: 'sub', value: 5 }, { label: '➖ 10', action: 'sub', value: 10 }],
  [{ label: '♻️ Обнулить', action: 'reset', value: 0 }],
  [{ label: '🎖 Ачивки', action: 'achievements', value: 0 }],
];

const pendingAdminInput = new Map();

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

function buildAchievementsKeyboard(chatId, userId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Добавить ачивку', `psyadmin:${chatId}:${userId}:add_achievement:0`),
    ],
    [
      Markup.button.callback('➖ Удалить ачивку', `psyadmin:${chatId}:${userId}:remove_achievement:0`),
    ],
    [
      Markup.button.callback('⬅️ Назад', `psyadmin:${chatId}:${userId}:back:0`),
    ],
  ]);
}

// Проверка доступа: разработчики + текущий владелец группы
async function isAllowedUser(ctx, chatId = ctx.chat?.id) {
  if (ALLOWED_USERS.includes(ctx.from.id)) {
    return true;
  }

  if (!chatId) {
    return false;
  }

  try {
    const member = await ctx.telegram.getChatMember(chatId, ctx.from.id);
    return member?.status === 'creator';
  } catch (err) {
    return false;
  }
}

async function adminPsychoCommand(ctx) {
  try {
    if (!['group', 'supergroup'].includes(ctx.chat.type)) {
      return ctx.reply('⚠️ Эта панель работает только в группах.');
    }

    if (!(await isAllowedUser(ctx))) {
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

async function renderMainPanel(ctx, chatId, userId) {
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
}

async function renderAchievementsPanel(ctx, chatId, userId) {
  const user = await ctx.telegram.getChatMember(chatId, userId);
  const displayName = getDisplayName(user.user);
  await upsertUser(userId, user.user.username || null, displayName);

  const achievements = await getUserAchievementsWithIds(userId);
  const lines = achievements.length
    ? achievements.map((item, index) => `${index + 1}. ${item.name}`).join('\n')
    : 'Пусто';

  await ctx.editMessageText(
    `🎖 <b>Ачивки пользователя</b>\n` +
    `👤 <b>${displayName}</b>\n\n` +
    `${lines}`,
    {
      parse_mode: 'HTML',
      ...buildAchievementsKeyboard(chatId, userId),
    }
  );
}

async function adminPsychoAction(ctx) {
  try {
    const [, rawChatId, rawUserId, action, rawValue = '0'] = ctx.callbackQuery.data.split(':');
    const chatId = Number(rawChatId);
    const userId = Number(rawUserId);
    const value = Number(rawValue);

    if (ctx.chat.id !== chatId) {
      return ctx.answerCbQuery('Панель не из этого чата.', { show_alert: true });
    }

    if (!(await isAllowedUser(ctx, chatId))) {
      return ctx.answerCbQuery('Нет доступа.', { show_alert: true });
    }

    if (action === 'add') {
      await adminAddPsychoCount(chatId, userId, value);
      await renderMainPanel(ctx, chatId, userId);
      return ctx.answerCbQuery('Готово');
    }

    if (action === 'sub') {
      await adminAddPsychoCount(chatId, userId, -value);
      await renderMainPanel(ctx, chatId, userId);
      return ctx.answerCbQuery('Готово');
    }

    if (action === 'reset') {
      await adminSetPsychoCount(chatId, userId, 0);
      await renderMainPanel(ctx, chatId, userId);
      return ctx.answerCbQuery('Готово');
    }

    if (action === 'achievements') {
      await renderAchievementsPanel(ctx, chatId, userId);
      return ctx.answerCbQuery('Список ачивок');
    }

    if (action === 'back') {
      await renderMainPanel(ctx, chatId, userId);
      return ctx.answerCbQuery('Назад');
    }

    if (action === 'add_achievement') {
      pendingAdminInput.set(`${chatId}:${ctx.from.id}`, {
        mode: 'add',
        targetUserId: userId,
      });
      await ctx.reply('✍️ Введи название ачивки следующим сообщением (до 80 символов).');
      return ctx.answerCbQuery('Жду текст');
    }

    if (action === 'remove_achievement') {
      pendingAdminInput.set(`${chatId}:${ctx.from.id}`, {
        mode: 'remove',
        targetUserId: userId,
      });
      await ctx.reply('🔢 Введи номер ачивки из списка, которую нужно удалить.');
      return ctx.answerCbQuery('Жду номер');
    }

    return ctx.answerCbQuery('Неизвестное действие', { show_alert: true });
  } catch (err) {
    console.error('Ошибка в админ-кнопке:', err);
    return ctx.answerCbQuery('Ошибка', { show_alert: true });
  }
}

async function adminPsychoTextInput(ctx) {
  try {
    if (!['group', 'supergroup'].includes(ctx.chat.type)) return;
    if (!(await isAllowedUser(ctx))) return;
    if (!ctx.message?.text) return;
    if (ctx.message.text.startsWith('/')) return;

    const key = `${ctx.chat.id}:${ctx.from.id}`;
    const pending = pendingAdminInput.get(key);
    if (!pending) return;

    const rawInput = ctx.message.text.trim();
    if (!rawInput) return ctx.reply('⚠️ Пустой ввод. Попробуй еще раз.');

    if (pending.mode === 'add') {
      const achievement = rawInput.slice(0, 80);
      await grantCustomAchievement(pending.targetUserId, achievement);
      pendingAdminInput.delete(key);
      return ctx.reply(`✅ Ачивка добавлена: ${achievement}`);
    }

    if (pending.mode === 'remove') {
      const index = Number(rawInput);
      if (!Number.isInteger(index) || index < 1) {
        return ctx.reply('⚠️ Введи корректный номер ачивки (1, 2, 3...).');
      }

      const removed = await deleteUserAchievementByIndex(pending.targetUserId, index);
      if (!removed) {
        return ctx.reply('⚠️ Ачивка с таким номером не найдена.');
      }

      pendingAdminInput.delete(key);
      return ctx.reply(`🗑 Удалена ачивка: ${removed.name}`);
    }
  } catch (err) {
    console.error('Ошибка обработки ввода админ-панели:', err);
    return ctx.reply('❌ Не удалось обработать ввод.');
  }
}

module.exports = { adminPsychoCommand, adminPsychoAction, adminPsychoTextInput };