import { Controller, Get, UseGuards, Req } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListsService } from './lists.service';
import { List } from './entities/list.entity';
import type { AuthRequest } from '../common/auth-request.interface';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  async findAll(@Req() req: AuthRequest): Promise<List[]> {
    return this.listsService.findAllForUser(req.user.id);
  }
}
