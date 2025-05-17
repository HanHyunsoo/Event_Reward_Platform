import { Role } from './role.enum';

export interface CreateOrLoginUserResponseDto {
  userId: string;
  role: Role;
}
