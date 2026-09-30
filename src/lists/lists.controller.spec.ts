import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';

describe('ListsController', () => {
  let controller: ListsController;

  const listsServiceMock = {
    findAllForUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const requestMock = {
    user: {
      id: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListsController],
      providers: [
        {
          provide: ListsService,
          useValue: listsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ListsController>(ListsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return the connected user’s lists', async () => {
      const lists = [
        { id: '1', name: 'To do' },
        { id: '2', name: 'In progress' },
      ];

      listsServiceMock.findAllForUser.mockResolvedValue(lists);

      const result = await controller.findAll(requestMock as any);

      expect(listsServiceMock.findAllForUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(lists);
    });
  });

  describe('create', () => {
    it('should create a list for the connected user', async () => {
      const dto = {
        name: 'New list',
      };

      const list = {
        id: '1',
        name: 'New list',
      };

      listsServiceMock.create.mockResolvedValue(list);

      const result = await controller.create(dto as any, requestMock as any);

      expect(listsServiceMock.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual(list);
    });
  });

  describe('update', () => {
    it('should update a list belonging to the connected user', async () => {
      const dto = {
        name: 'Updated list',
      };

      const list = {
        id: '1',
        name: 'Updated list',
      };

      listsServiceMock.update.mockResolvedValue(list);

      const result = await controller.update(
        '1',
        dto as any,
        requestMock as any,
      );

      expect(listsServiceMock.update).toHaveBeenCalledWith('1', dto, 1);

      expect(result).toEqual(list);
    });
  });

  describe('remove', () => {
    it('should remove a list belonging to the connected user', async () => {
      listsServiceMock.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1', requestMock as any);

      expect(listsServiceMock.remove).toHaveBeenCalledWith('1', 1);
      expect(result).toBeUndefined();
    });
  });
});
