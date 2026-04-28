import { Module } from '@nestjs/common';
import { BotAuthGuard } from './bot-auth.guard';
import { TmaAuthGuard } from './tma-auth.guard';

@Module({
  providers: [TmaAuthGuard, BotAuthGuard],
  exports: [TmaAuthGuard, BotAuthGuard],
})
export class AuthModule {}
