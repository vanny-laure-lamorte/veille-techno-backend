import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';

import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../user/entities/user.entity';
import { ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../common/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @UseInterceptors(ClassSerializerInterceptor)
  register(@Body() dto: CreateUserDto): Promise<User> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login a user' })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(dto);
  }
}
