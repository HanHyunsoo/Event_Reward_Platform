import { Role } from '@event-reward-platform/protocol';

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export interface RefreshTokenPayload {
  userId: string;
}
