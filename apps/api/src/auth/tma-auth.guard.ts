import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { InitDataValidationError, validateInitData } from './init-data.util';

/**
 * Guards routes that require a valid Telegram Mini App init data.
 *
 * Expects an `Authorization: tma <initDataRaw>` header. Validates the
 * HMAC-SHA256 signature against `TELEGRAM_BOT_TOKEN` and rejects entries
 * older than 24 hours. On success, the parsed Telegram user is attached
 * to `request.tmaUser` and made accessible via {@link TmaUserParam}.
 */
@Injectable()
export class TmaAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.header('authorization') ?? '';
    const [scheme, raw] = auth.split(' ');

    if (scheme !== 'tma' || !raw) {
      throw new UnauthorizedException(
        'Expected "Authorization: tma <initData>" header',
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new InternalServerErrorException(
        'TELEGRAM_BOT_TOKEN is not configured on the server',
      );
    }

    try {
      const parsed = validateInitData(raw, token);
      if (!parsed.user) {
        throw new InitDataValidationError('initData has no user');
      }
      req.tmaUser = parsed.user;
      return true;
    } catch (err) {
      if (err instanceof InitDataValidationError) {
        throw new UnauthorizedException(err.message);
      }
      throw err;
    }
  }
}
