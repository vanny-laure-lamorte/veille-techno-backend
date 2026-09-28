import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { List } from '../lists/entities/list.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
  ) {}

  async findAllForList(listId: string, userId: string): Promise<Card[]> {
    await this.getOwnedListOrThrow(listId, userId);

    return this.cardRepository.find({
      where: { listId },
      order: { position: 'ASC' },
    });
  }

  async create(
    listId: string,
    dto: CreateCardDto,
    userId: string,
  ): Promise<Card> {
    await this.getOwnedListOrThrow(listId, userId);

    const position = dto.position ?? (await this.getNextPosition(listId));

    const card = this.cardRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      position,
      listId,
    });

    return this.cardRepository.save(card);
  }

  async findOne(id: string, userId: string): Promise<Card> {
    const card = await this.getOwnedCardOrThrow(id, userId);
    return card;
  }

  async update(id: string, dto: UpdateCardDto, userId: string): Promise<Card> {
    const card = await this.getOwnedCardOrThrow(id, userId);


    if (dto.listId && dto.listId !== card.listId) {
      await this.getOwnedListOrThrow(dto.listId, userId);
    }

    Object.assign(card, dto);
    return this.cardRepository.save(card);
  }

  async remove(id: string, userId: string): Promise<void> {
    const card = await this.getOwnedCardOrThrow(id, userId);
    await this.cardRepository.remove(card);
  }

  private async getOwnedListOrThrow(
    listId: string,
    userId: string,
  ): Promise<List> {
    const list = await this.listRepository.findOne({ where: { id: listId } });

    if (!list) {
      throw new NotFoundException('List not found');
    }
    if (list.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this list',
      );
    }
    return list;
  }

  private async getOwnedCardOrThrow(
    id: string,
    userId: string,
  ): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: {list:true},
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }
    if (card.list.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this card',
      );
    }
    return card;
  }

  private async getNextPosition(listId: string): Promise<number> {
    const lastCard = await this.cardRepository.findOne({
      where: { listId },
      order: { position: 'DESC' },
    });
    return lastCard ? lastCard.position + 1 : 0;
  }
}