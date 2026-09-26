import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
  ) {}

  async findAllForUser(ownerId: string): Promise<List[]> {
    return this.listRepository.find({
      where: { ownerId },
      order: { position: 'ASC' },
    });
  }

  async create(dto: CreateListDto, ownerId: string): Promise<List> {
    const position = dto.position ?? (await this.getNextPosition(ownerId));

    const list = this.listRepository.create({
      title: dto.title,
      position,
      ownerId,
    });

    return this.listRepository.save(list);
  }

  async update(id: string, dto: UpdateListDto, userId: string): Promise<List> {
    const list = await this.findOneOrThrow(id);

    if (list.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this list');
    }

    Object.assign(list, dto);
    return this.listRepository.save(list);
  }

  async remove(id: string, userId: string): Promise<void> {
    const list = await this.findOneOrThrow(id);

    if (list.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this list');
    }

    await this.listRepository.remove(list);
  }

  private async findOneOrThrow(id: string): Promise<List> {
    const list = await this.listRepository.findOne({ where: { id } });
    if (!list) {
      throw new NotFoundException('List not found');
    }
    return list;
  }

  private async getNextPosition(ownerId: string): Promise<number> {
    const lastList = await this.listRepository.findOne({
      where: { ownerId },
      order: { position: 'DESC' },
    });
    return lastList ? lastList.position + 1 : 0;
  }
}