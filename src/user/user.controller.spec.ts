import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRole } from './enums/user-role.enum';

describe('UserController', () => {
  let controller: UserController;

  const userServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const userMock = {
    id: 'user1',
    email: 'user@test.com',
    name: 'Test User',
    role: UserRole.USER,
  };

  const adminMock = {
    id: 'admin1',
    email: 'admin@test.com',
    name: 'Admin',
    role: UserRole.ADMIN,
  };

  const requestMock = {
    user: userMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = {
        email: 'new@test.com',
        name: 'New User',
        password: 'password123',
        role: UserRole.USER,
      };

      const createdUser = {
        id: 'user2',
        ...dto,
      };

      userServiceMock.create.mockResolvedValue(createdUser);

      const result = await controller.create(dto as any);

      expect(userServiceMock.create).toHaveBeenCalledTimes(1);
      expect(userServiceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdUser);
    });

    it('should propagate a service error', async () => {
      const dto = {
        email: 'existing@test.com',
        password: 'password123',
      };

      const error = new Error('Email already in use');

      userServiceMock.create.mockRejectedValue(error);

      await expect(controller.create(dto as any)).rejects.toThrow(error);

      expect(userServiceMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [userMock, adminMock];

      userServiceMock.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(userServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    it('should return an empty list if no users exist', async () => {
      userServiceMock.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(userServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('findMe', () => {
    it('should return the currently authenticated user', async () => {
      userServiceMock.findOne.mockResolvedValue(userMock);

      const result = await controller.findMe(requestMock as any);

      expect(userServiceMock.findOne).toHaveBeenCalledWith(userMock.id);
      expect(result).toEqual(userMock);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      userServiceMock.findOne.mockResolvedValue(userMock);

      const result = await controller.findOne('user1');

      expect(userServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(userServiceMock.findOne).toHaveBeenCalledWith('user1');
      expect(result).toEqual(userMock);
    });

    it('should propagate a service error', async () => {
      const error = new Error('User not found');

      userServiceMock.findOne.mockRejectedValue(error);

      await expect(controller.findOne('unknown-id')).rejects.toThrow(error);

      expect(userServiceMock.findOne).toHaveBeenCalledWith('unknown-id');
    });
  });

  describe('update', () => {
    it('should update their own profile', async () => {
      const dto = {
        name: 'Updated Name',
      };

      const updatedUser = {
        ...userMock,
        ...dto,
      };

      userServiceMock.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        'user1',
        dto as any,
        requestMock as any,
      );

      expect(userServiceMock.update).toHaveBeenCalledTimes(1);

      expect(userServiceMock.update).toHaveBeenCalledWith(
        'user1',
        dto,
        requestMock.user,
      );

      expect(result).toEqual(updatedUser);
    });

    it('should correctly pass the administrator’s information', async () => {
      const dto = {
        name: 'Updated User',
        role: UserRole.ADMIN,
      };

      const adminRequest = {
        user: adminMock,
      };

      const updatedUser = {
        ...userMock,
        ...dto,
      };

      userServiceMock.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        'user1',
        dto as any,
        adminRequest as any,
      );

      expect(userServiceMock.update).toHaveBeenCalledWith(
        'user1',
        dto,
        adminRequest.user,
      );

      expect(result).toEqual(updatedUser);
    });

    it('should correctly pass a password change', async () => {
      const dto = {
        password: 'new-password',
      };

      userServiceMock.update.mockResolvedValue(userMock);

      const result = await controller.update(
        'user1',
        dto as any,
        requestMock as any,
      );

      expect(userServiceMock.update).toHaveBeenCalledWith(
        'user1',
        dto,
        requestMock.user,
      );

      expect(result).toEqual(userMock);
    });

    it('should propagate a service error', async () => {
      const dto = {
        name: 'Updated Name',
      };

      const error = new Error('You can only update your own profile');

      userServiceMock.update.mockRejectedValue(error);

      await expect(
        controller.update('user2', dto as any, requestMock as any),
      ).rejects.toThrow(error);

      expect(userServiceMock.update).toHaveBeenCalledWith(
        'user2',
        dto,
        requestMock.user,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      userServiceMock.remove.mockResolvedValue(undefined);

      const result = await controller.remove('user1');

      expect(userServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(userServiceMock.remove).toHaveBeenCalledWith('user1');
      expect(result).toBeUndefined();
    });

    it('should propagate a service error', async () => {
      const error = new Error('User not found');

      userServiceMock.remove.mockRejectedValue(error);

      await expect(controller.remove('unknown-id')).rejects.toThrow(error);

      expect(userServiceMock.remove).toHaveBeenCalledWith('unknown-id');
    });
  });
});
