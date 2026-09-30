import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';
import { UserRole } from '../user/enums/user-role.enum';

describe('JwtStrategy', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe('constructor', () => {
    it('should be defined if JWT_SECRET exists', () => {
      const strategy = new JwtStrategy();

      expect(strategy).toBeDefined();
    });

    it('should throw an error if JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;

      expect(() => new JwtStrategy()).toThrow('JWT_SECRET is not defined');
    });
  });

  describe('validate', () => {
    it('should return the user information', async () => {
      const strategy = new JwtStrategy();

      const payload = {
        sub: 'user1',
        email: 'test@test.com',
        role: UserRole.USER,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user1',
        email: 'test@test.com',
        role: UserRole.USER,
      });
    });

    it('should throw an UnauthorizedException if sub is missing', async () => {
      const strategy = new JwtStrategy();

      const payload = {
        email: 'test@test.com',
        role: UserRole.USER,
      };

      await expect(strategy.validate(payload as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if the payload is null', async () => {
      const strategy = new JwtStrategy();

      await expect(strategy.validate(null as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if the payload is undefined', async () => {
      const strategy = new JwtStrategy();

      await expect(strategy.validate(undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
