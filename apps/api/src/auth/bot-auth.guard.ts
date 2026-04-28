import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Guards routes meant for server-to-server bot calls. Compares the
 * `X-Bot-Secret` header against `BOT_API_SECRET` using a constant-time
 * comparison to prevent timing leaks.
 */
@Injectable()
export class BotAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.BOT_API_SECRET;
    if (!expected) {
      throw new InternalServerErrorException(
        'BOT_API_SECRET is not configured on the server',
      );
    }

    const req = context.switchToHttp().getRequest<Request>();
    const presented = req.header('x-bot-secret') ?? '';

    const a = Buffer.from(presented, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid bot secret');
    }
    return true;
  }
}
