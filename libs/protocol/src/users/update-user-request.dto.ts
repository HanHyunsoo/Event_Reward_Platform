import { IsEnum } from 'class-validator';
import { Role } from './role.enum';

export class UpdateUserRequestDto {
  @IsEnum(Role)
  role: Role;
}
