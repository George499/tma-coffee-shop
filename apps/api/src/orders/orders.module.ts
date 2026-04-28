import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminNotifierService } from './admin-notifier.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, AdminNotifierService],
})
export class OrdersModule {}
