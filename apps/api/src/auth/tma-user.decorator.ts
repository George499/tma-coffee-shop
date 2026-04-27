import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@telegram-apps/init-data-node';

declare module 'express' {
  interface Request {
    tmaUser?: User;
  }
}

export type TmaUser = User;

/**
 * Resolves the Telegram user that was attached to the request by
 * {@link TmaAuthGuard}. Use only on routes guarded by it; otherwise the
 * value will be `undefined`.
 */
export const TmaUserParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.tmaUser;
  },
);
