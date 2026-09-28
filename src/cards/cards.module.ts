import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { List } from '../lists/entities/list.entity';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, List]),
    AuthModule,
  ],
  controllers: [CardsController],
  providers: [CardsService],
})
export class CardsModule {}