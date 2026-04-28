import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Bot, type Context } from 'grammy';
import { OrdersService } from '../orders/orders.service';

const ORDER_CALLBACK = /^order:(accept|reject):(.+)$/;

@Injectable()
export class TelegramService
  implements OnModuleInit, OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(TelegramService.name);
  private bot!: Bot;
  private mode: 'webhook' | 'longpoll' | 'disabled' = 'disabled';

  constructor(private readonly orders: OrdersService) {}

  onModuleInit(): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN missing; bot integration disabled',
      );
      return;
    }

    this.bot = new Bot(token);

    this.bot.command('start', async (ctx) => {
      await ctx.reply('Coffee shop bot is online.');
    });

    this.bot.callbackQuery(ORDER_CALLBACK, async (ctx) => {
      await this.handleOrderCallback(ctx);
    });

    this.bot.catch((err) => {
      this.logger.error('Bot error:', err.error);
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.bot) return;

    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    if (webhookUrl) {
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
      try {
        await this.bot.api.setWebhook(webhookUrl, {
          secret_token: secret,
          drop_pending_updates: false,
        });
        this.mode = 'webhook';
        this.logger.log(`Telegram webhook registered: ${webhookUrl}`);
      } catch (err) {
        this.logger.error('Failed to register Telegram webhook', err as Error);
      }
      return;
    }

    if (process.env.TELEGRAM_LONGPOLL === 'true') {
      try {
        await this.bot.api.deleteWebhook({ drop_pending_updates: false });
      } catch (err) {
        this.logger.warn(
          `deleteWebhook before long-poll failed: ${(err as Error).message}`,
        );
      }
      void this.bot.start({
        onStart: ({ username }) =>
          this.logger.log(`Telegram long-poll started as @${username}`),
      });
      this.mode = 'longpoll';
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.mode === 'longpoll' && this.bot) {
      await this.bot.stop();
    }
  }

  /**
   * Process an update received via the webhook endpoint. Validates Telegram's
   * `X-Telegram-Bot-Api-Secret-Token` header against the configured secret.
   */
  async handleWebhook(update: unknown, secret?: string): Promise<void> {
    if (!this.bot || this.mode !== 'webhook') {
      throw new UnauthorizedException('Webhook mode is not active');
    }
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret token');
    }
    await this.bot.handleUpdate(update as Parameters<Bot['handleUpdate']>[0]);
  }

  private async handleOrderCallback(ctx: Context): Promise<void> {
    const match = ctx.match;
    if (!match || typeof match === 'string') return;
    const action = match[1] as 'accept' | 'reject';
    const orderId = match[2];
    if (!orderId) return;

    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (adminChatId && String(ctx.from?.id) !== adminChatId) {
      await ctx.answerCallbackQuery({
        text: 'Только админ может менять статус.',
        show_alert: true,
      });
      return;
    }

    try {
      await this.orders.applyAction(orderId, action);
      const verb = action === 'accept' ? '✅ Принят' : '❌ Отклонён';
      const original = ctx.callbackQuery?.message?.text;
      if (original) {
        await ctx.editMessageText(`${original}\n\n<b>${verb}</b>`, {
          parse_mode: 'HTML',
        });
      } else {
        await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      }
      await ctx.answerCallbackQuery({ text: verb });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось обновить статус';
      this.logger.error(`Order callback failed: ${message}`);
      await ctx.answerCallbackQuery({ text: message, show_alert: true });
    }
  }
}
