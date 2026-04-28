import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [OrdersModule],
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
