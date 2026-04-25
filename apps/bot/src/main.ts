import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const bot = new Bot(token);

bot.command('start', async (ctx) => {
  await ctx.reply('Coffee shop bot is online.');
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

await bot.start({
  onStart: ({ username }) => {
    console.log(`Bot @${username} started`);
  },
});
