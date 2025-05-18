import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOrLoginUserRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '사용자 아이디',
    example: 'admin',
  })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '비밀번호',
    example: 'admin',
  })
  password: string;
}
