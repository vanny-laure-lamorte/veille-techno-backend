import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UserService(usersRepository as any);

    process.env.PASSWORD_PEPPER = 'test-pepper';
  });

  it('doit créer un utilisateur', async () => {
    const dto = {
      email: 'test@test.com',
      password: 'password123',
      name: 'Test',
    };

    usersRepository.findOne.mockResolvedValue(null);

    usersRepository.create.mockReturnValue({
      ...dto,
      password: 'hashed-password',
    });

    usersRepository.save.mockResolvedValue({
      id: '1',
      email: dto.email,
      name: dto.name,
      password: 'hashed-password',
    });

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

    const result = await service.create(dto);

    expect(result.email).toBe('test@test.com');
    expect(result.name).toBe('Test');
    expect(result.password).toBe('hashed-password');

    expect(usersRepository.save).toHaveBeenCalled();
  });

  it('doit refuser un email déjà utilisé', async () => {
    const dto = {
      email: 'test@test.com',
      password: 'password123',
      name: 'Test',
    };

    usersRepository.findOne.mockResolvedValue({
      id: '1',
      email: 'test@test.com',
    });

    await expect(service.create(dto)).rejects.toThrow(
      new ConflictException('Email already in use'),
    );

    expect(usersRepository.save).not.toHaveBeenCalled();
  });
});
