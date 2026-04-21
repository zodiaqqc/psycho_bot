const { getTopUsers } = require('../services/userService');
 
const MEDALS = ['🥇', '🥈', '🥉'];
 
async function topCommand(ctx) {
  try {
    const users = await getTopUsers(ctx.chat.id, 10);
 
    if (!users.length) {
      return ctx.reply('😶 В этом чате пока никто не сходил с ума. Будь первым: /psycho');
    }
 
    const lines = users.map((u, i) => {
      const medal    = MEDALS[i] ?? `${i + 1}.`;
      const name = u.display_name || u.username || `id${u.id}`;
      return `${medal} ${name} — ${u.psycho_count}`;
    });
 
    return ctx.reply(
      `🏆 <b>Лидерборд этого чата</b>\n\n` + lines.join('\n'),
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error('Ошибка в /top:', err);
    return ctx.reply('❌ Не удалось загрузить таблицу.');
  }
}
 
module.exports = topCommand;
 