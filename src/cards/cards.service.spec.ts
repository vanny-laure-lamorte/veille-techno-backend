import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CardsService } from './cards.service';
import { Card } from './entities/card.entity';
import { List } from '../lists/entities/list.entity';

describe('CardsService', () => {
  let service: CardsService;

  const cardRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const listRepositoryMock = {
    findOne: jest.fn(),
  };

  const ownedList = {
    id: 'list1',
    ownerId: 'user1',
  };

  const ownedCard = {
    id: 'card1',
    title: 'Card 1',
    description: 'Description',
    position: 0,
    listId: 'list1',
    list: ownedList,
  };

  const requestUserId = 'user1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: getRepositoryToken(Card),
          useValue: cardRepositoryMock,
        },
        {
          provide: getRepositoryToken(List),
          useValue: listRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForList', () => {
    it('should return all cards in the list', async () => {
      const cards = [
        { id: 'card1', title: 'Card 1', position: 0 },
        { id: 'card2', title: 'Card 2', position: 1 },
      ];

      listRepositoryMock.findOne.mockResolvedValue(ownedList);
      cardRepositoryMock.find.mockResolvedValue(cards);

      const result = await service.findAllForList('list1', requestUserId);

      expect(listRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'list1' },
      });

      expect(cardRepositoryMock.find).toHaveBeenCalledWith({
        where: { listId: 'list1' },
        order: { position: 'ASC' },
      });

      expect(result).toEqual(cards);
    });

    it('should throw an error if the list does not exist', async () => {
      listRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.findAllForList('list1', requestUserId),
      ).rejects.toThrow(new NotFoundException('List not found'));

      expect(cardRepositoryMock.find).not.toHaveBeenCalled();
    });

    it('should throw an error if the list belongs to another user', async () => {
      listRepositoryMock.findOne.mockResolvedValue({
        id: 'list1',
        ownerId: 'other-user',
      });

      await expect(
        service.findAllForList('list1', requestUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to access this list',
        ),
      );

      expect(cardRepositoryMock.find).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a card with a specified position', async () => {
      const dto = {
        title: 'New card',
        description: 'Description',
        position: 3,
      };

      const createdCard = {
        ...dto,
        listId: 'list1',
      };

      listRepositoryMock.findOne.mockResolvedValue(ownedList);
      cardRepositoryMock.create.mockReturnValue(createdCard);
      cardRepositoryMock.save.mockResolvedValue(createdCard);

      const result = await service.create('list1', dto as any, requestUserId);

      expect(listRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'list1' },
      });

      expect(cardRepositoryMock.create).toHaveBeenCalledWith({
        title: 'New card',
        description: 'Description',
        position: 3,
        listId: 'list1',
      });

      expect(cardRepositoryMock.save).toHaveBeenCalledWith(createdCard);
      expect(result).toEqual(createdCard);
    });

    it('should calculate the next position automatically', async () => {
      const dto = {
        title: 'New card',
        description: 'Description',
      };

      const lastCard = {
        id: 'card2',
        listId: 'list1',
        position: 4,
      };

      const createdCard = {
        title: 'New card',
        description: 'Description',
        position: 5,
        listId: 'list1',
      };

      listRepositoryMock.findOne.mockResolvedValue(ownedList);
      cardRepositoryMock.findOne.mockResolvedValue(lastCard);
      cardRepositoryMock.create.mockReturnValue(createdCard);
      cardRepositoryMock.save.mockResolvedValue(createdCard);

      const result = await service.create('list1', dto as any, requestUserId);

      expect(cardRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { listId: 'list1' },
        order: { position: 'DESC' },
      });

      expect(cardRepositoryMock.create).toHaveBeenCalledWith({
        title: 'New card',
        description: 'Description',
        position: 5,
        listId: 'list1',
      });

      expect(result).toEqual(createdCard);
    });

    it('should use position 0 if the list contains no cards', async () => {
      const dto = {
        title: 'First card',
      };

      const createdCard = {
        title: 'First card',
        description: null,
        position: 0,
        listId: 'list1',
      };

      listRepositoryMock.findOne.mockResolvedValue(ownedList);
      cardRepositoryMock.findOne.mockResolvedValue(null);
      cardRepositoryMock.create.mockReturnValue(createdCard);
      cardRepositoryMock.save.mockResolvedValue(createdCard);

      const result = await service.create('list1', dto as any, requestUserId);

      expect(cardRepositoryMock.create).toHaveBeenCalledWith({
        title: 'First card',
        description: null,
        position: 0,
        listId: 'list1',
      });

      expect(result).toEqual(createdCard);
    });

    it('should reject creation if the list does not exist', async () => {
      listRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.create('list1', { title: 'New card' } as any, requestUserId),
      ).rejects.toThrow(new NotFoundException('List not found'));

      expect(cardRepositoryMock.create).not.toHaveBeenCalled();
      expect(cardRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject creation if the list belongs to another user', async () => {
      listRepositoryMock.findOne.mockResolvedValue({
        id: 'list1',
        ownerId: 'other-user',
      });

      await expect(
        service.create('list1', { title: 'New card' } as any, requestUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to access this list',
        ),
      );

      expect(cardRepositoryMock.create).not.toHaveBeenCalled();
      expect(cardRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a card belonging to the user', async () => {
      cardRepositoryMock.findOne.mockResolvedValue(ownedCard);

      const result = await service.findOne('card1', requestUserId);

      expect(cardRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'card1' },
        relations: { list: true },
      });

      expect(result).toEqual(ownedCard);
    });

    it('should throw an error if the card does not exist', async () => {
      cardRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('card1', requestUserId)).rejects.toThrow(
        new NotFoundException('Card not found'),
      );
    });

    it('should reject access to a card belonging to another user', async () => {
      const card = {
        ...ownedCard,
        list: {
          id: 'list1',
          ownerId: 'other-user',
        },
      };

      cardRepositoryMock.findOne.mockResolvedValue(card);

      await expect(service.findOne('card1', requestUserId)).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to access this card',
        ),
      );
    });
  });

  describe('update', () => {
    it('should update a card', async () => {
      const dto = {
        title: 'Updated card',
        description: 'New description',
      };

      const card = {
        ...ownedCard,
      };

      const updatedCard = {
        ...card,
        ...dto,
      };

      cardRepositoryMock.findOne.mockResolvedValue(card);
      cardRepositoryMock.save.mockResolvedValue(updatedCard);

      const result = await service.update('card1', dto as any, requestUserId);

      expect(cardRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'card1' },
        relations: { list: true },
      });

      expect(cardRepositoryMock.save).toHaveBeenCalledWith(updatedCard);

      expect(result).toEqual(updatedCard);
    });

    it('should check the new list when moving a card', async () => {
      const dto = {
        listId: 'list2',
      };

      const card = {
        ...ownedCard,
      };

      const newList = {
        id: 'list2',
        ownerId: 'user1',
      };

      const updatedCard = {
        ...card,
        listId: 'list2',
      };

      cardRepositoryMock.findOne.mockResolvedValue(card);
      listRepositoryMock.findOne.mockResolvedValue(newList);
      cardRepositoryMock.save.mockResolvedValue(updatedCard);

      const result = await service.update('card1', dto as any, requestUserId);

      expect(listRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'list2' },
      });

      expect(cardRepositoryMock.save).toHaveBeenCalledWith(updatedCard);

      expect(result).toEqual(updatedCard);
    });

    it('should reject moving to a list that does not exist', async () => {
      const dto = {
        listId: 'list2',
      };

      cardRepositoryMock.findOne.mockResolvedValue(ownedCard);
      listRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update('card1', dto as any, requestUserId),
      ).rejects.toThrow(new NotFoundException('List not found'));

      expect(cardRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject moving to another user’s list', async () => {
      const dto = {
        listId: 'list2',
      };

      cardRepositoryMock.findOne.mockResolvedValue(ownedCard);

      listRepositoryMock.findOne.mockResolvedValue({
        id: 'list2',
        ownerId: 'other-user',
      });

      await expect(
        service.update('card1', dto as any, requestUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to access this list',
        ),
      );

      expect(cardRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject updating a card that does not exist', async () => {
      cardRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update('card1', { title: 'Updated' } as any, requestUserId),
      ).rejects.toThrow(new NotFoundException('Card not found'));

      expect(cardRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject updating a card belonging to another user', async () => {
      const card = {
        ...ownedCard,
        list: {
          id: 'list1',
          ownerId: 'other-user',
        },
      };

      cardRepositoryMock.findOne.mockResolvedValue(card);

      await expect(
        service.update('card1', { title: 'Updated' } as any, requestUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to access this card',
        ),
      );

      expect(cardRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a card', async () => {
      cardRepositoryMock.findOne.mockResolvedValue(ownedCard);
      cardRepositoryMock.remove.mockResolvedValue(ownedCard);

      const result = await service.remove('card1', requestUserId);

      expect(cardRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'card1' },
        relations: { list: true },
      });

      expect(cardRepositoryMock.remove).toHaveBeenCalledWith(ownedCard);

      expect(result).toBeUndefined();
    });

    it('should throw an error if the card does not exist', async () => {
      cardRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.remove('card1', requestUserId)).rejects.toThrow(
        new NotFoundException('Card not found'),
      );

      expect(cardRepositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should reject deleting a card belonging to another user', async () => {
      const card = {
        ...ownedCard,
        list: {
          id: 'list1',
          ownerId: 'other-user',
        },
      };

      cardRepositoryMock.findOne.mockResolvedValue(card);

      await expect(service.remove('card1', requestUserId)).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to access this card',
        ),
      );

      expect(cardRepositoryMock.remove).not.toHaveBeenCalled();
    });
  });
});
