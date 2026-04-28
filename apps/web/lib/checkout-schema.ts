import { z } from 'zod';
import { DeliveryType } from '@tma-coffee-shop/shared';

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const SCHEDULE_MIN_OFFSET_MS = 15 * 60 * 1000; // submit -> server validation buffer
const SCHEDULE_MAX_OFFSET_MS = 14 * 24 * 60 * 60 * 1000;

export const checkoutSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(1, 'Введите имя')
      .max(100, 'Имя слишком длинное'),
    customerPhone: z
      .string()
      .trim()
      .regex(PHONE_REGEX, 'Введите номер телефона'),
    deliveryType: z.nativeEnum(DeliveryType),
    address: z
      .string()
      .trim()
      .max(200, 'Адрес слишком длинный')
      .optional()
      .or(z.literal('')),
    scheduledAt: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    comment: z
      .string()
      .trim()
      .max(500, 'Комментарий слишком длинный')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === DeliveryType.DELIVERY) {
      const len = (data.address ?? '').length;
      if (len < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address'],
          message: 'Введите адрес доставки',
        });
      }
    }

    if (data.scheduledAt) {
      const t = new Date(data.scheduledAt).getTime();
      if (Number.isNaN(t)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scheduledAt'],
          message: 'Некорректное время',
        });
      } else {
        const now = Date.now();
        if (t < now + SCHEDULE_MIN_OFFSET_MS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['scheduledAt'],
            message: 'Минимум через 15 минут',
          });
        } else if (t > now + SCHEDULE_MAX_OFFSET_MS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['scheduledAt'],
            message: 'Не дальше чем через 14 дней',
          });
        }
      }
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
