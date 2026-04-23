const { getUser, upsertUser, getChatUserStat, addPsychoCount } = require('../services/userService');
const { grantRandomAchievement } = require('../services/achievementService');
 
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minute
const ACHIEVEMENT_CHANCE = 0.15;
const REQUEST_SPAM_WINDOW_MS = 3000;
const recentAttempts = new Map();

const NORMAL_TEMPLATES = [
  '{actor} сошёл с ума',
  '{actor} словил ПТСР',
  '{actor} выпил таблетки',
  '{actor} чувствует тревогу',
  '{actor} словил депрессию',
  '{actor} находится в стрессе',
];

const RARE_TEMPLATES = [
  '{actor} сорвался с цепи!',
  '{actor} словил панический страх!',
  '{actor} увидел галлюцинации!',
  '{actor} поймал психоз!',
  '{actor} словил нервный срыв!',
  '{actor} словил биполярку!',
  '{actor} словил манию!',
  '{actor} поймал шизу!',
];

const FAIL_TEMPLATES = [
  '{actor} выпил не те таблетки...',
  '{actor} выгорел...',
  '{actor} поймал откат...',
  '{actor} словил апатию...',
];

const REPLY_TEMPLATES = [
  '{actor} свёл с ума {target}',
  '{actor} довел до нервного срыва {target}',
  '{actor} оказал сильное давление на {target}',
  '{actor} заставил {target} растеряться',
];

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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildReplyLine(ctx, displayName) {
  const target = ctx.message.reply_to_message?.from;
  if (!target || target.id === ctx.from.id) return null;
  const targetName = getDisplayName(target);
  return pickRandom(REPLY_TEMPLATES)
    .replace('{actor}', displayName)
    .replace('{target}', targetName);
}

function getEventPayload() {
  const roll = Math.random();
  if (roll < 0.7) {
    return {
      delta: randomInt(1, 10),
      prefix: '😵',
      text: pickRandom(NORMAL_TEMPLATES),
    };
  }
  if (roll < 0.85) {
    return {
      delta: randomInt(20, 40),
      prefix: '🔥',
      text: pickRandom(RARE_TEMPLATES),
    };
  }
  return {
    delta: -randomInt(5, 15),
    prefix: '💊',
    text: pickRandom(FAIL_TEMPLATES),
  };
}
 
async function psychoCommand(ctx) {
  try {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const existing = await getUser(userId);
    if (!existing) {
      return ctx.reply('⚠️ Сначала зарегистрируйся через /start в личке с ботом.');
    }

    const antiSpamKey = `${chatId}:${userId}`;
    const now = Date.now();
    const previousAttempt = recentAttempts.get(antiSpamKey) || 0;
    if (now - previousAttempt < REQUEST_SPAM_WINDOW_MS) {
      return;
    }
    recentAttempts.set(antiSpamKey, now);

    const username = ctx.from.username || null;
    const displayName = getDisplayName(ctx.from);
    await upsertUser(userId, username, displayName);
    const stat = await getChatUserStat(chatId, userId);

    const elapsed = now - (stat.last_used || 0);

    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed;
      return ctx.reply(
        `⏳ <b>${displayName}</b>, нужно подождать: <b>${formatDuration(remainingMs)}</b>`,
        { parse_mode: 'HTML' }
      );
    }

    const event = getEventPayload();
    await addPsychoCount(chatId, userId, event.delta);
    const updated = await getChatUserStat(chatId, userId);
    const total = updated.psycho_count;
    const replyLine = buildReplyLine(ctx, displayName);
    const eventText = replyLine || event.text.replace('{actor}', displayName);
    const sign = event.delta >= 0 ? '+' : '−';
    const amount = Math.abs(event.delta);

    if (event.delta > 0 && Math.random() < ACHIEVEMENT_CHANCE) {
      const achievement = await grantRandomAchievement(userId);
      if (achievement) {
        return ctx.reply(
          `${event.prefix} <b>${eventText}</b>\n` +
          `${sign}<b>${amount}</b> психов\n` +
          `🎖 <b>Ачивка:</b> ${achievement}\n` +
          `📊 <b>Итого в этом чате:</b> ${total}`,
          { parse_mode: 'HTML' }
        );
      }
    }

    return ctx.reply(
      `${event.prefix} <b>${eventText}</b>\n` +
      `${sign}<b>${amount}</b> психов\n` +
      `📊 <b>Итого в этом чате:</b> ${total}`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error('Ошибка в /psycho:', err);
    return ctx.reply('❌ Что-то пошло не так.');
  }
}
 
module.exports = psychoCommand;