import { IsEnum } from 'class-validator';
import { Role } from './role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRequestDto {
  @IsEnum(Role)
  @ApiProperty({
    description: '권한',
    example: Role.ADMIN,
    enum: Role,
  })
  role: Role;
}
