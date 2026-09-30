import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;

  const usersRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const user = {
    id: 'user1',
    email: 'user@test.com',
    name: 'Test User',
    password: 'hashed-password',
    role: UserRole.USER,
  };

  const admin = {
    id: 'admin1',
    email: 'admin@test.com',
    name: 'Admin',
    password: 'hashed-password',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    process.env.PASSWORD_PEPPER = 'test-pepper';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.PASSWORD_PEPPER;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
        ...dto,
        password: 'hashed-password',
      };

      usersRepositoryMock.findOne.mockResolvedValue(null);
      usersRepositoryMock.create.mockReturnValue(createdUser);
      usersRepositoryMock.save.mockResolvedValue(createdUser);

      const result = await service.create(dto as any);

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123test-pepper', 10);

      expect(usersRepositoryMock.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashed-password',
      });

      expect(usersRepositoryMock.save).toHaveBeenCalledWith(createdUser);

      expect(result).toEqual(createdUser);
    });

    it('should reject creation if the email already exists', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(user);

      await expect(
        service.create({
          email: user.email,
          password: 'password',
        } as any),
      ).rejects.toThrow(new ConflictException('Email already in use'));

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw an error if PASSWORD_PEPPER is missing', async () => {
      delete process.env.PASSWORD_PEPPER;

      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          email: 'new@test.com',
          password: 'password',
        } as any),
      ).rejects.toThrow('PASSWORD_PEPPER is not configured');

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should transform a QueryFailedError into a ConflictException', async () => {
      const dto = {
        email: 'new@test.com',
        password: 'password',
      };

      const queryError = new QueryFailedError(
        'INSERT',
        [],
        new Error('duplicate'),
      );

      usersRepositoryMock.findOne.mockResolvedValue(null);
      usersRepositoryMock.create.mockReturnValue(user);
      usersRepositoryMock.save.mockRejectedValue(queryError);

      await expect(service.create(dto as any)).rejects.toThrow(
        new ConflictException('Email already in use'),
      );
    });

    it('should rethrow an error that is not a QueryFailedError', async () => {
      const error = new Error('Database error');

      usersRepositoryMock.findOne.mockResolvedValue(null);
      usersRepositoryMock.create.mockReturnValue(user);
      usersRepositoryMock.save.mockRejectedValue(error);

      await expect(
        service.create({
          email: 'new@test.com',
          password: 'password',
        } as any),
      ).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [user, admin];

      usersRepositoryMock.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(usersRepositoryMock.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findOne('user1');

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'user1' },
      });

      expect(result).toEqual(user);
    });

    it('should throw an error if the user does not exist', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('user1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('update', () => {
    it('should allow a user to update their own profile', async () => {
      const dto = {
        name: 'New Name',
      };

      const userToUpdate = { ...user };

      usersRepositoryMock.findOne.mockResolvedValue(userToUpdate);
      usersRepositoryMock.save.mockResolvedValue({
        ...userToUpdate,
        ...dto,
      });

      const result = await service.update('user1', dto as any, {
        id: 'user1',
        role: UserRole.USER,
      });

      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user1',
          name: 'New Name',
        }),
      );

      expect(result).toEqual({
        ...userToUpdate,
        ...dto,
      });
    });

    it('should allow an admin to update another user', async () => {
      const dto = {
        name: 'Modified User',
      };

      const userToUpdate = { ...user };

      usersRepositoryMock.findOne.mockResolvedValue(userToUpdate);
      usersRepositoryMock.save.mockResolvedValue({
        ...userToUpdate,
        ...dto,
      });

      const result = await service.update('user1', dto as any, {
        id: 'admin1',
        role: UserRole.ADMIN,
      });

      expect(result).toEqual({
        ...userToUpdate,
        ...dto,
      });

      expect(usersRepositoryMock.save).toHaveBeenCalled();
    });

    it('should prevent a user from updating another profile', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(user);

      await expect(
        service.update('user1', { name: 'Modified' } as any, {
          id: 'user2',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(
        new ForbiddenException('You can only update your own profile'),
      );

      expect(usersRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should prevent a user from changing the role', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(user);

      await expect(
        service.update('user1', { role: UserRole.ADMIN } as any, {
          id: 'user1',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(
        new ForbiddenException('Only an admin can change a role'),
      );

      expect(usersRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should allow an admin to change the role', async () => {
      const dto = {
        role: UserRole.ADMIN,
      };

      const userToUpdate = { ...user };

      usersRepositoryMock.findOne.mockResolvedValue(userToUpdate);
      usersRepositoryMock.save.mockResolvedValue({
        ...userToUpdate,
        role: UserRole.ADMIN,
      });

      const result = await service.update('user1', dto as any, {
        id: 'admin1',
        role: UserRole.ADMIN,
      });

      expect(result.role).toBe(UserRole.ADMIN);

      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });

    it('should reject an email that is already in use', async () => {
      const dto = {
        email: 'other@test.com',
      };

      usersRepositoryMock.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({
          id: 'user2',
          email: 'other@test.com',
        });

      await expect(
        service.update('user1', dto as any, {
          id: 'user1',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(new ConflictException('Email already in use'));

      expect(usersRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should not check the email if the new email is unchanged', async () => {
      const dto = {
        email: user.email,
      };

      const userToUpdate = { ...user };

      usersRepositoryMock.findOne.mockResolvedValue(userToUpdate);
      usersRepositoryMock.save.mockResolvedValue(userToUpdate);

      await service.update('user1', dto as any, {
        id: 'user1',
        role: UserRole.USER,
      });

      expect(usersRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should hash a new password', async () => {
      const dto = {
        password: 'new-password',
      };

      const userToUpdate = { ...user };

      usersRepositoryMock.findOne.mockResolvedValue(userToUpdate);
      usersRepositoryMock.save.mockResolvedValue({
        ...userToUpdate,
        password: 'hashed-password',
      });

      await service.update('user1', dto as any, {
        id: 'user1',
        role: UserRole.USER,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);

      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed-password',
        }),
      );
    });

    it('should transform a QueryFailedError during the update', async () => {
      const queryError = new QueryFailedError(
        'UPDATE',
        [],
        new Error('duplicate'),
      );

      usersRepositoryMock.findOne.mockResolvedValue(user);
      usersRepositoryMock.save.mockRejectedValue(queryError);

      await expect(
        service.update('user1', { name: 'New Name' } as any, {
          id: 'user1',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(new ConflictException('Email already in use'));
    });

    it('should rethrow an unknown error during the update', async () => {
      const error = new Error('Database error');

      usersRepositoryMock.findOne.mockResolvedValue(user);
      usersRepositoryMock.save.mockRejectedValue(error);

      await expect(
        service.update('user1', { name: 'New Name' } as any, {
          id: 'user1',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(error);
    });

    it('should reject the update if the user does not exist', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update('user1', { name: 'New Name' } as any, {
          id: 'user1',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(user);
      usersRepositoryMock.remove.mockResolvedValue(user);

      const result = await service.remove('user1');

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'user1' },
      });

      expect(usersRepositoryMock.remove).toHaveBeenCalledWith(user);

      expect(result).toBeUndefined();
    });

    it('should throw an error if the user does not exist', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.remove('user1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(usersRepositoryMock.remove).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('user@test.com');

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: 'user@test.com' },
      });

      expect(result).toEqual(user);
    });

    it('should throw an error if no user matches', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findByEmail('unknown@test.com')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('onModuleInit', () => {
    it('should do nothing if ADMIN_EMAIL is missing', async () => {
      delete process.env.ADMIN_EMAIL;
      process.env.ADMIN_PASSWORD = 'admin-password';

      await service.onModuleInit();

      expect(usersRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(usersRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should do nothing if ADMIN_PASSWORD is missing', async () => {
      process.env.ADMIN_EMAIL = 'admin@test.com';
      delete process.env.ADMIN_PASSWORD;

      await service.onModuleInit();

      expect(usersRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(usersRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should create an admin if one does not exist', async () => {
      process.env.ADMIN_EMAIL = 'admin@test.com';
      process.env.ADMIN_PASSWORD = 'admin-password';
      process.env.PASSWORD_PEPPER = 'test-pepper';

      const createdAdmin = {
        email: 'admin@test.com',
        name: 'Admin',
        role: UserRole.ADMIN,
        password: 'hashed-password',
      };

      usersRepositoryMock.findOne.mockResolvedValue(null);
      usersRepositoryMock.create.mockReturnValue(createdAdmin);
      usersRepositoryMock.save.mockResolvedValue(createdAdmin);

      await service.onModuleInit();

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('admin-passwordtest-pepper', 10);

      expect(usersRepositoryMock.create).toHaveBeenCalledWith({
        email: 'admin@test.com',
        name: 'Admin',
        role: UserRole.ADMIN,
        password: 'hashed-password',
      });

      expect(usersRepositoryMock.save).toHaveBeenCalledWith(createdAdmin);
    });

    it('should update an existing admin', async () => {
      process.env.ADMIN_EMAIL = 'admin@test.com';
      process.env.ADMIN_PASSWORD = 'new-password';
      process.env.PASSWORD_PEPPER = 'test-pepper';

      const existingAdmin = {
        id: 'admin1',
        email: 'admin@test.com',
        name: 'Old Name',
        role: UserRole.USER,
        password: 'old-password',
      };

      usersRepositoryMock.findOne.mockResolvedValue(existingAdmin);
      usersRepositoryMock.save.mockResolvedValue(existingAdmin);

      await service.onModuleInit();

      expect(existingAdmin.password).toBe('hashed-password');
      expect(existingAdmin.role).toBe(UserRole.ADMIN);
      expect(existingAdmin.name).toBe('Admin');

      expect(usersRepositoryMock.create).not.toHaveBeenCalled();
      expect(usersRepositoryMock.save).toHaveBeenCalledWith(existingAdmin);
    });
  });
});
