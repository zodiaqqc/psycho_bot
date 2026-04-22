require('dotenv').config();
const { Telegraf } = require('telegraf');
const { initDb } = require('./db');

const startCommand = require('./commands/start');
const psychoCommand = require('./commands/psycho');
const topCommand = require('./commands/top');
const profileCommand = require('./commands/profile');
const giveAchievementCommand = require('./commands/giveAchievement');
const { adminPsychoCommand, adminPsychoAction } = require('./commands/adminPsycho');

const bot = new Telegraf(process.env.BOT_TOKEN);

initDb().then(async () => {
  await bot.telegram.setMyCommands([
    { command: 'start', description: '👤 Регистрация' },
    { command: 'psycho', description: '🧠 Сойти с ума' },
    { command: 'top', description: '🏆 Таблица лидеров' },
    { command: 'profile', description: '👤 Профиль и ачивки' },
    { command: 'psyadmin', description: '🛠 Админ-панель (reply)' },
    { command: 'give_achievement', description: '🎖 Выдать ачивку (admin, reply)' },
  ]);

  bot.command('start', startCommand);
  bot.command('psycho', psychoCommand);
  bot.command('top', topCommand);
  bot.command('profile', profileCommand);
  bot.command('psyadmin', adminPsychoCommand);
  bot.command('give_achievement', giveAchievementCommand);

  bot.hears(/^псих$/i, (ctx) => {
    // защита от дублирования (если вдруг это команда)
    if (ctx.message.text.startsWith('/')) return;
    return psychoCommand(ctx);
  });

  bot.hears(/^таблы$/i, (ctx) => {
    // защита от дублирования (если вдруг это команда)
    if (ctx.message.text.startsWith('/')) return;
    return psychoCommand(ctx);
  });

  bot.action(/^psyadmin:/, adminPsychoAction);

  bot.catch((err, ctx) => console.error('Ошибка бота:', err));

  return bot.launch();
}).then(() => {
  console.log('🤖 Психо-бот запущен');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


console.log("DATABASE_URL =", process.env.DATABASE_URL);