import { Controller, Get, UseGuards } from '@nestjs/common';
import { TmaAuthGuard } from '../auth/tma-auth.guard';
import {
  TmaUserParam,
  type TmaUser,
} from '../auth/tma-user.decorator';

@Controller('me')
@UseGuards(TmaAuthGuard)
export class MeController {
  @Get()
  whoami(@TmaUserParam() user: TmaUser): TmaUser {
    return user;
  }
}
