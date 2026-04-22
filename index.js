require('dotenv').config();
const { Telegraf } = require('telegraf');
const { initDb } = require('./db');

const startCommand = require('./commands/start');
const psychoCommand = require('./commands/psycho');
const topCommand = require('./commands/top');
const profileCommand = require('./commands/profile');
const { adminPsychoCommand, adminPsychoAction, adminPsychoTextInput } = require('./commands/adminPsycho');

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required.');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

async function bootstrap() {
  try {
    await initDb();

    await bot.telegram.setMyCommands([
      { command: 'start', description: '👤 Регистрация' },
      { command: 'psycho', description: '🧠 Сойти с ума' },
      { command: 'top', description: '🏆 Таблица лидеров' },
      { command: 'profile', description: '👤 Профиль и ачивки' },
      { command: 'psyadmin', description: '🛠 Админ-панель (reply)' },
    ]);

    bot.command('start', startCommand);
    bot.command('psycho', psychoCommand);
    bot.command('top', topCommand);
    bot.command('profile', profileCommand);
    bot.command('psyadmin', adminPsychoCommand);

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
    bot.on('text', adminPsychoTextInput);

    bot.catch((err) => console.error('Ошибка бота:', err));

    await bot.launch();
    console.log('🤖 Психо-бот запущен');
  } catch (err) {
    console.error('❌ Bot bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));