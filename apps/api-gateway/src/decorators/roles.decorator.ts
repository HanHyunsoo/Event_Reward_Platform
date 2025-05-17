import { SetMetadata } from '@nestjs/common';
import { Role } from '@event-reward-platform/protocol';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
