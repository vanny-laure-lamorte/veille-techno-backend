import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call AuthService.register with the DTO', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'password',
      };

      const user = {
        id: 1,
        email: 'test@test.com',
      };

      authServiceMock.register.mockResolvedValue(user);

      const result = await controller.register(dto as any);

      expect(authServiceMock.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should call AuthService.login with the DTO', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'password',
      };

      const response = {
        accessToken: 'fake-jwt-token',
      };

      authServiceMock.login.mockResolvedValue(response);

      const result = await controller.login(dto as any);

      expect(authServiceMock.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });
});
