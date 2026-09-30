import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    process.env.PASSWORD_PEPPER = 'test-pepper';
  });

  describe('register', () => {
    it('should create a user', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'password',
      };

      const user = {
        id: 1,
        email: 'test@test.com',
      };

      usersServiceMock.create.mockResolvedValue(user);

      const result = await service.register(dto as any);

      expect(usersServiceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should reject login if the user does not exist', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should throw an error if PASSWORD_PEPPER is missing', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: 'hashed-password',
        role: 'USER',
      });

      delete process.env.PASSWORD_PEPPER;

      await expect(
        service.login({
          email: 'test@test.com',
          password: 'password',
        }),
      ).rejects.toThrow('PASSWORD_PEPPER is not found');
    });

    it('should reject login if the password is incorrect', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: 'hashed-password',
        role: 'USER',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-passwordtest-pepper',
        'hashed-password',
      );
    });

    it('should generate a token if the credentials are valid', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        password: 'hashed-password',
        role: 'USER',
      };

      usersServiceMock.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtServiceMock.signAsync.mockResolvedValue('fake-jwt-token');

      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'passwordtest-pepper',
        'hashed-password',
      );

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      expect(result).toEqual({
        accessToken: 'fake-jwt-token',
      });
    });
  });
});
