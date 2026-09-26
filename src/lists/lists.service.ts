import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';

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
}
