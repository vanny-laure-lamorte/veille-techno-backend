import { IsString,
  IsNotEmpty, IsInt,
  IsOptional,
  Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListDto {
  @IsString()
  @ApiProperty({ example: 'X' })
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}