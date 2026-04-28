import { IsIn } from 'class-validator';

export const ORDER_ACTIONS = ['accept', 'reject'] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

export class UpdateOrderStatusDto {
  @IsIn(ORDER_ACTIONS)
  action!: OrderAction;
}
