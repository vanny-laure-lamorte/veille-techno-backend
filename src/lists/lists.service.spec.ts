import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ListsService } from './lists.service';
import { List } from './entities/list.entity';

describe('ListsService', () => {
  let service: ListsService;

  const repositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        {
          provide: getRepositoryToken(List),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<ListsService>(ListsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return the user’s lists', async () => {
      const lists = [
        { id: '1', title: 'To do', ownerId: 'user1', position: 0 },
        { id: '2', title: 'In progress', ownerId: 'user1', position: 1 },
      ];

      repositoryMock.find.mockResolvedValue(lists);

      const result = await service.findAllForUser('user1');

      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: { ownerId: 'user1' },
        order: { position: 'ASC' },
      });

      expect(result).toEqual(lists);
    });
  });

  describe('create', () => {
    it('should create a list with a specified position', async () => {
      const dto = {
        title: 'New list',
        position: 2,
      };

      const list = {
        id: '1',
        title: 'New list',
        position: 2,
        ownerId: 'user1',
      };

      repositoryMock.create.mockReturnValue(list);
      repositoryMock.save.mockResolvedValue(list);

      const result = await service.create(dto, 'user1');

      expect(repositoryMock.create).toHaveBeenCalledWith({
        title: 'New list',
        position: 2,
        ownerId: 'user1',
      });

      expect(repositoryMock.save).toHaveBeenCalledWith(list);
      expect(result).toEqual(list);
    });

    it('should calculate the position if it is not provided', async () => {
      const dto = {
        title: 'New list',
      };

      const lastList = {
        id: '1',
        title: 'Last list',
        position: 2,
        ownerId: 'user1',
      };

      const list = {
        id: '2',
        title: 'New list',
        position: 3,
        ownerId: 'user1',
      };

      repositoryMock.findOne.mockResolvedValue(lastList);
      repositoryMock.create.mockReturnValue(list);
      repositoryMock.save.mockResolvedValue(list);

      const result = await service.create(dto, 'user1');

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { ownerId: 'user1' },
        order: { position: 'DESC' },
      });

      expect(repositoryMock.create).toHaveBeenCalledWith({
        title: 'New list',
        position: 3,
        ownerId: 'user1',
      });

      expect(result).toEqual(list);
    });

    it('should use position 0 if no lists exist', async () => {
      const dto = {
        title: 'First list',
      };

      const list = {
        id: '1',
        title: 'First list',
        position: 0,
        ownerId: 'user1',
      };

      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.create.mockReturnValue(list);
      repositoryMock.save.mockResolvedValue(list);

      const result = await service.create(dto, 'user1');

      expect(repositoryMock.create).toHaveBeenCalledWith({
        title: 'First list',
        position: 0,
        ownerId: 'user1',
      });

      expect(result).toEqual(list);
    });
  });

  describe('update', () => {
    it('should update a list belonging to the user', async () => {
      const list = {
        id: '1',
        title: 'Old title',
        position: 0,
        ownerId: 'user1',
      };

      const dto = {
        title: 'New title',
      };

      repositoryMock.findOne.mockResolvedValue(list);
      repositoryMock.save.mockResolvedValue({
        ...list,
        ...dto,
      });

      const result = await service.update('1', dto, 'user1');

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...list,
        title: 'New title',
      });
    });

    it('should throw an error if the list does not exist', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update('1', { title: 'Test' }, 'user1'),
      ).rejects.toThrow(new NotFoundException('List not found'));
    });

    it('should reject the update if the user is not the owner', async () => {
      const list = {
        id: '1',
        title: 'My list',
        ownerId: 'user1',
      };

      repositoryMock.findOne.mockResolvedValue(list);

      await expect(
        service.update('1', { title: 'Test' }, 'user2'),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to modify this list',
        ),
      );

      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a list belonging to the user', async () => {
      const list = {
        id: '1',
        title: 'List to delete',
        ownerId: 'user1',
      };

      repositoryMock.findOne.mockResolvedValue(list);
      repositoryMock.remove.mockResolvedValue(list);

      await service.remove('1', 'user1');

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(repositoryMock.remove).toHaveBeenCalledWith(list);
    });

    it('should throw an error if the list does not exist', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.remove('1', 'user1')).rejects.toThrow(
        new NotFoundException('List not found'),
      );

      expect(repositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should reject deletion if the user is not the owner', async () => {
      const list = {
        id: '1',
        title: 'My list',
        ownerId: 'user1',
      };

      repositoryMock.findOne.mockResolvedValue(list);

      await expect(service.remove('1', 'user2')).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to delete this list',
        ),
      );

      expect(repositoryMock.remove).not.toHaveBeenCalled();
    });
  });
});
