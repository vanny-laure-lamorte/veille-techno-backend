import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
} from '@nestjs/common';

import { ListsService } from './lists.service';
import { List } from './entities/list.entity';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import type { AuthRequest } from '../common/auth-request.interface';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';


@Controller('lists')
@ApiBearerAuth()
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all lists' })
  async findAll(@Req() req: AuthRequest): Promise<List[]> {
    return this.listsService.findAllForUser(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a list' })
  async create(
    @Body() dto: CreateListDto,
    @Req() req: AuthRequest,
  ): Promise<List> {
    return this.listsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a list' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
    @Req() req: AuthRequest,
  ): Promise<List> {
    return this.listsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a list' })
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<void> {
    return this.listsService.remove(id, req.user.id);
  }
}