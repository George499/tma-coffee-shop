import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BotAuthGuard } from '../auth/bot-auth.guard';
import { TmaAuthGuard } from '../auth/tma-auth.guard';
import { TmaUserParam, type TmaUser } from '../auth/tma-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @UseGuards(TmaAuthGuard)
  create(@Body() body: CreateOrderDto, @TmaUserParam() user: TmaUser) {
    return this.orders.create(body, user);
  }

  @Get(':id')
  @UseGuards(TmaAuthGuard)
  findOne(@Param('id') id: string, @TmaUserParam() user: TmaUser) {
    return this.orders.findOneForUser(id, user);
  }

  @Patch(':id/status')
  @UseGuards(BotAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.orders.applyAction(id, body.action);
  }
}
