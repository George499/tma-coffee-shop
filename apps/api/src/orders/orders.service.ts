import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryType, OrderStatus } from '@tma-coffee-shop/shared';
import type { TmaUser } from '../auth/tma-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNotifierService } from './admin-notifier.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { OrderAction } from './dto/update-order-status.dto';
import { calculateTotal } from './orders.util';

const SCHEDULE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: AdminNotifierService,
  ) {}

  async create(input: CreateOrderDto, tmaUser: TmaUser) {
    const productIds = this.extractUniqueProductIds(input.items);
    const scheduledAt = this.parseScheduledAt(input.scheduledAt);
    this.assertAddressIfDelivery(input);

    const result = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isAvailable: true },
        select: { id: true, name: true, price: true },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException(
          'One or more products are unavailable or do not exist',
        );
      }

      const pricing = new Map(products.map((p) => [p.id, p]));
      const totalAmount = calculateTotal(input.items, pricing);

      const userId = BigInt(tmaUser.id);
      const userFields = {
        firstName: tmaUser.first_name,
        lastName: tmaUser.last_name ?? null,
        username: tmaUser.username ?? null,
        languageCode: tmaUser.language_code ?? null,
      };

      await tx.user.upsert({
        where: { id: userId },
        create: { id: userId, ...userFields },
        update: userFields,
      });

      const itemsCreate = input.items.map((item) => {
        const product = pricing.get(item.productId)!;
        return {
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity: item.quantity,
        };
      });

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          deliveryType: input.deliveryType,
          address:
            input.deliveryType === DeliveryType.DELIVERY
              ? (input.address ?? null)
              : null,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          scheduledAt,
          comment: input.comment ?? null,
          items: { create: itemsCreate },
        },
        select: { id: true, status: true, totalAmount: true },
      });

      return { order, itemsCreate };
    });

    // Best-effort: don't block the response on Telegram, but await so the
    // logger picks up failures while we're still inside the request scope.
    await this.notifier.notifyNewOrder({
      orderId: result.order.id,
      totalAmount: result.order.totalAmount,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryType: input.deliveryType,
      address: input.deliveryType === DeliveryType.DELIVERY ? input.address : null,
      scheduledAt,
      comment: input.comment ?? null,
      items: result.itemsCreate,
    });

    return result.order;
  }

  async applyAction(id: string, action: OrderAction) {
    const next =
      action === 'accept' ? OrderStatus.ACCEPTED : OrderStatus.CANCELLED;

    const updated = await this.prisma.order.updateMany({
      where: { id, status: OrderStatus.NEW },
      data: { status: next },
    });

    if (updated.count === 0) {
      const exists = await this.prisma.order.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!exists) {
        throw new NotFoundException(`Order ${id} not found`);
      }
      throw new ConflictException(
        `Order ${id} is in status ${exists.status}; only NEW orders can be ${action}ed`,
      );
    }

    return { id, status: next };
  }

  async findOneForUser(id: string, tmaUser: TmaUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        totalAmount: true,
        deliveryType: true,
        address: true,
        customerName: true,
        customerPhone: true,
        scheduledAt: true,
        comment: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            productPrice: true,
            quantity: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (order.userId !== BigInt(tmaUser.id)) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const { userId: _userId, ...rest } = order;
    return rest;
  }

  private extractUniqueProductIds(
    items: CreateOrderDto['items'],
  ): number[] {
    const ids = items.map((i) => i.productId);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new BadRequestException(
        'items must not contain duplicate productId entries',
      );
    }
    return [...unique];
  }

  private parseScheduledAt(raw: string | undefined): Date | null {
    if (!raw) return null;
    const date = new Date(raw);
    const t = date.getTime();
    const now = Date.now();
    if (t < now) {
      throw new BadRequestException('scheduledAt cannot be in the past');
    }
    if (t > now + SCHEDULE_WINDOW_MS) {
      throw new BadRequestException(
        'scheduledAt cannot be more than 14 days ahead',
      );
    }
    return date;
  }

  private assertAddressIfDelivery(input: CreateOrderDto): void {
    if (
      input.deliveryType === DeliveryType.DELIVERY &&
      !input.address?.trim()
    ) {
      throw new BadRequestException(
        'address is required when deliveryType is DELIVERY',
      );
    }
  }
}
