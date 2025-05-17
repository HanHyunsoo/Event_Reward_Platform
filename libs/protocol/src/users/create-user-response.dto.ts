import { Role } from './role.enum';

export interface CreateUserResponseDto {
  userId: string;
  role: Role;
}
