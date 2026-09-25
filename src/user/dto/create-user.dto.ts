import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateUserDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @ApiProperty({
    description: 'The email of the user',
    example: 'lucas.martinie@gmail.com'})
  email: string;

  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @ApiProperty({
    description: 'The password of the user',
    example: 'lucas123'})
  password: string;

  @IsNotEmpty({ message: 'name is required' })
  @ApiProperty({
    description: 'The name of the user',
    example: 'Lucas Martinie'})
  name: string;
}