import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TmaAuthGuard } from '../auth/tma-auth.guard';
import { TmaUserParam, type TmaUser } from '../auth/tma-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(TmaAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Body() body: CreateOrderDto, @TmaUserParam() user: TmaUser) {
    return this.orders.create(body, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TmaUserParam() user: TmaUser) {
    return this.orders.findOneForUser(id, user);
  }
}
