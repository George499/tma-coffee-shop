import { Injectable, Logger } from '@nestjs/common';
import { DeliveryType } from '@tma-coffee-shop/shared';

type NotifyItem = {
  productName: string;
  productPrice: number;
  quantity: number;
};

type NotifyPayload = {
  orderId: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  address?: string | null;
  scheduledAt?: Date | null;
  comment?: string | null;
  items: NotifyItem[];
};

const SCHEDULE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
});

function formatRub(kopecks: number): string {
  return `${Math.round(kopecks / 100)} ₽`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Best-effort delivery of new-order alerts to the admin chat. Never throws —
 * Telegram or network failures are logged and the order proceeds.
 */
@Injectable()
export class AdminNotifierService {
  private readonly logger = new Logger(AdminNotifierService.name);

  async notifyNewOrder(payload: NotifyPayload): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;
    if (!token || !chatId) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID is missing; skipping admin notification',
      );
      return;
    }

    const text = this.buildText(payload);
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Принять',
                  callback_data: `order:accept:${payload.orderId}`,
                },
                {
                  text: '❌ Отклонить',
                  callback_data: `order:reject:${payload.orderId}`,
                },
              ],
            ],
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(
          `Telegram sendMessage returned ${res.status}: ${body}`,
        );
      }
    } catch (err) {
      this.logger.error('Failed to send admin notification', err as Error);
    }
  }

  private buildText(payload: NotifyPayload): string {
    const lines: string[] = [];
    lines.push(`🆕 <b>Заказ ${escapeHtml(payload.orderId)}</b>`);
    lines.push(
      `${escapeHtml(payload.customerName)} • ${escapeHtml(payload.customerPhone)}`,
    );
    lines.push(
      payload.deliveryType === DeliveryType.DELIVERY
        ? `🚚 Доставка${payload.address ? `: ${escapeHtml(payload.address)}` : ''}`
        : '🏃 Самовывоз',
    );
    if (payload.scheduledAt) {
      lines.push(`🕐 ${SCHEDULE_FORMATTER.format(payload.scheduledAt)}`);
    }
    if (payload.comment) {
      lines.push(`💬 ${escapeHtml(payload.comment)}`);
    }
    lines.push('');
    for (const item of payload.items) {
      lines.push(
        `• ${escapeHtml(item.productName)} × ${item.quantity} — ${formatRub(item.productPrice * item.quantity)}`,
      );
    }
    lines.push('');
    lines.push(`<b>Итого: ${formatRub(payload.totalAmount)}</b>`);
    return lines.join('\n');
  }
}
