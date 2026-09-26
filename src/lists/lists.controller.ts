import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListsService } from './lists.service';
import { List } from './entities/list.entity';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import type { AuthRequest } from '../common/auth-request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  async findAll(@Req() req: AuthRequest): Promise<List[]> {
    return this.listsService.findAllForUser(req.user.id);
  }

  @Post()
  async create(
    @Body() dto: CreateListDto,
    @Req() req: AuthRequest,
  ): Promise<List> {
    return this.listsService.create(dto, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
    @Req() req: AuthRequest,
  ): Promise<List> {
    return this.listsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<void> {
    return this.listsService.remove(id, req.user.id);
  }
}