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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from './cards.service';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import type { AuthRequest } from '../common/auth-request.interface';

@ApiTags('Cards')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('lists/:listId/cards')
  @ApiOperation({ summary: 'List all cards in a list' })
  async findAllForList(
    @Param('listId') listId: string,
    @Req() req: AuthRequest,
  ): Promise<Card[]> {
    return this.cardsService.findAllForList(listId, req.user.id);
  }

  @Post('lists/:listId/cards')
  @ApiOperation({ summary: 'Create a card in a list' })
  async create(
    @Param('listId') listId: string,
    @Body() dto: CreateCardDto,
    @Req() req: AuthRequest,
  ): Promise<Card> {
    return this.cardsService.create(listId, dto, req.user.id);
  }

  @Get('cards/:id')
  @ApiOperation({ summary: 'Get a card' })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<Card> {
    return this.cardsService.findOne(id, req.user.id);
  }

  @Patch('cards/:id')
  @ApiOperation({ summary: 'Update a card' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
    @Req() req: AuthRequest,
  ): Promise<Card> {
    return this.cardsService.update(id, dto, req.user.id);
  }

  @Delete('cards/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a card' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<void> {
    return this.cardsService.remove(id, req.user.id);
  }
}