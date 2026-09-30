import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

describe('CardsController', () => {
  let controller: CardsController;

  const cardsServiceMock = {
    findAllForList: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const requestMock = {
    user: {
      id: 'user1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardsController],
      providers: [
        {
          provide: CardsService,
          useValue: cardsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CardsController>(CardsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllForList', () => {
    it('should return all cards in a list', async () => {
      const cards = [
        { id: '1', title: 'Card 1' },
        { id: '2', title: 'Card 2' },
      ];

      cardsServiceMock.findAllForList.mockResolvedValue(cards);

      const result = await controller.findAllForList(
        'list1',
        requestMock as any,
      );

      expect(cardsServiceMock.findAllForList).toHaveBeenCalledWith(
        'list1',
        'user1',
      );

      expect(result).toEqual(cards);
    });
  });

  describe('create', () => {
    it('should create a card in a list', async () => {
      const dto = {
        title: 'New card',
      };

      const card = {
        id: '1',
        title: 'New card',
      };

      cardsServiceMock.create.mockResolvedValue(card);

      const result = await controller.create(
        'list1',
        dto as any,
        requestMock as any,
      );

      expect(cardsServiceMock.create).toHaveBeenCalledWith(
        'list1',
        dto,
        'user1',
      );

      expect(result).toEqual(card);
    });
  });

  describe('findOne', () => {
    it('should return a card', async () => {
      const card = {
        id: 'card1',
        title: 'My card',
      };

      cardsServiceMock.findOne.mockResolvedValue(card);

      const result = await controller.findOne('card1', requestMock as any);

      expect(cardsServiceMock.findOne).toHaveBeenCalledWith('card1', 'user1');

      expect(result).toEqual(card);
    });
  });

  describe('update', () => {
    it('should update a card', async () => {
      const dto = {
        title: 'Updated card',
      };

      const card = {
        id: 'card1',
        title: 'Updated card',
      };

      cardsServiceMock.update.mockResolvedValue(card);

      const result = await controller.update(
        'card1',
        dto as any,
        requestMock as any,
      );

      expect(cardsServiceMock.update).toHaveBeenCalledWith(
        'card1',
        dto,
        'user1',
      );

      expect(result).toEqual(card);
    });
  });

  describe('remove', () => {
    it('should delete a card', async () => {
      cardsServiceMock.remove.mockResolvedValue(undefined);

      const result = await controller.remove('card1', requestMock as any);

      expect(cardsServiceMock.remove).toHaveBeenCalledWith('card1', 'user1');

      expect(result).toBeUndefined();
    });
  });
});
