import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
const botSecret = process.env.BOT_API_SECRET;
if (!botSecret) {
  throw new Error('BOT_API_SECRET is not set');
}

const adminChatId = process.env.ADMIN_CHAT_ID;
if (!adminChatId) {
  throw new Error('ADMIN_CHAT_ID is not set');
}

const bot = new Bot(token);

bot.command('start', async (ctx) => {
  await ctx.reply('Coffee shop bot is online.');
});

bot.callbackQuery(/^order:(accept|reject):(.+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const action = match[1] as 'accept' | 'reject';
  const orderId = match[2];
  if (!orderId) return;
  const fromId = String(ctx.from?.id ?? '');

  if (fromId !== adminChatId) {
    await ctx.answerCallbackQuery({
      text: 'Только админ может менять статус.',
      show_alert: true,
    });
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Secret': botSecret,
      },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string }
        | null;
      const msg = body?.message ?? `${res.status} ${res.statusText}`;
      await ctx.answerCallbackQuery({ text: msg, show_alert: true });
      return;
    }

    const verb = action === 'accept' ? '✅ Принят' : '❌ Отклонён';
    if (ctx.callbackQuery.message?.text) {
      await ctx.editMessageText(
        `${ctx.callbackQuery.message.text}\n\n<b>${verb}</b>`,
        { parse_mode: 'HTML' },
      );
    } else {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    }
    await ctx.answerCallbackQuery({ text: verb });
  } catch (err) {
    console.error('Failed to update order status', err);
    await ctx.answerCallbackQuery({
      text: 'Не удалось связаться с API.',
      show_alert: true,
    });
  }
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

await bot.start({
  onStart: ({ username }) => {
    console.log(`Bot @${username} started`);
  },
});
